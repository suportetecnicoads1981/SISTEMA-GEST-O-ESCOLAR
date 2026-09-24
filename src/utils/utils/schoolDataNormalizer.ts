import type { SchoolClass, SchoolUnit, Student } from '../types';
import { canonicalGrade, normalizeSchoolName } from '../services/dataImportService';

/**
 * Correção automática (idempotente) do vínculo escola ↔ turma ↔ aluno.
 *
 * 1. Nome da escola sem o prefixo "ESCOLA:".
 * 2. Turma cujo nome começa com o nome de uma escola ("EMIEIF ERMINIO BRITO - PRÉ I (MANHÃ)")
 *    passa a se chamar "SÉRIE - TURNO" ("PRÉ I - MANHÃ") e fica vinculada a essa escola.
 * 3. Turma sem escola (ou com escola inexistente) herda a escola dos alunos matriculados nela.
 * 4. Aluno sem escola (ou com escola inexistente) herda a escola da turma.
 *
 * Só altera o que está errado; quando nada muda devolve `changed: false` e as mesmas listas.
 */
export function normalizeSchoolLinks<
  D extends { schoolUnits?: SchoolUnit[]; classes?: SchoolClass[]; students?: Student[] }
>(data: D): { data: D; changed: boolean; summary: string[] } {
  const now = new Date().toISOString();
  const summary: string[] = [];
  let changed = false;

  // 1. Escolas: remove "ESCOLA:" do nome
  const units: SchoolUnit[] = (data.schoolUnits || []).map((u) => {
    if (!u || typeof u.name !== 'string') return u;
    const clean = u.name.replace(/^\s*(ESCOLA|UNIDADE ESCOLAR)\s*:\s*/i, '').trim();
    if (clean && clean !== u.name) {
      changed = true;
      summary.push(`Escola "${u.name}" renomeada para "${clean}"`);
      return { ...u, name: clean, updatedAt: now } as SchoolUnit;
    }
    return u;
  });
  const unitIds = new Set(units.filter(Boolean).map((u) => u.id));

  // Prefixos de escola, do mais longo para o mais curto (evita casar "ESCOLA A" dentro de "ESCOLA AB")
  const prefixes = units
    .filter(Boolean)
    .flatMap((u) => [u.name, u.tradeName].filter(Boolean).map((n) => ({ unitId: u.id, norm: normalizeSchoolName(n) })))
    .filter((p) => p.norm.length >= 5)
    .sort((a, b) => b.norm.length - a.norm.length);

  const unitFromClassName = (className: string): string | undefined => {
    const n = normalizeSchoolName(className);
    return prefixes.find((p) => n.startsWith(`${p.norm} `))?.unitId;
  };

  // 2. Turmas: nome "SÉRIE - TURNO" e vínculo com a escola
  let classes: SchoolClass[] = (data.classes || []).map((c) => {
    if (!c) return c;
    const prefixUnit = typeof c.name === 'string' ? unitFromClassName(c.name) : undefined;
    const hasValidUnit = !!c.schoolUnitId && unitIds.has(c.schoolUnitId);
    if (!prefixUnit) return c;
    const grade = canonicalGrade(c.gradeLevel) || c.gradeLevel;
    if (!grade) return c;
    const next = {
      ...c,
      name: `${grade} - ${c.shift || 'MANHÃ'}`,
      schoolUnitId: hasValidUnit ? c.schoolUnitId : prefixUnit,
      updatedAt: now,
    } as SchoolClass;
    changed = true;
    summary.push(`Turma "${c.name}" → "${next.name}"`);
    return next;
  });

  // 3. Turma sem escola válida: usa a escola mais comum entre os alunos dela
  const students0 = (data.students || []).filter(Boolean);
  classes = classes.map((c) => {
    if (!c || (c.schoolUnitId && unitIds.has(c.schoolUnitId))) return c;
    const tally = new Map<string, number>();
    students0.forEach((s) => {
      if (s.classId === c.id && s.schoolUnitId && unitIds.has(s.schoolUnitId)) {
        tally.set(s.schoolUnitId, (tally.get(s.schoolUnitId) || 0) + 1);
      }
    });
    const best = Array.from(tally.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!best) return c;
    changed = true;
    return { ...c, schoolUnitId: best, updatedAt: now } as SchoolClass;
  });
  const classById = new Map(classes.filter(Boolean).map((c) => [c.id, c]));

  // 4. Aluno sem escola válida: herda a escola da turma
  const students: Student[] = (data.students || []).map((s) => {
    if (!s || (s.schoolUnitId && unitIds.has(s.schoolUnitId))) return s;
    const cls = s.classId ? classById.get(s.classId) : undefined;
    if (!cls?.schoolUnitId || !unitIds.has(cls.schoolUnitId)) return s;
    changed = true;
    return { ...s, schoolUnitId: cls.schoolUnitId, updatedAt: now } as Student;
  });

  if (!changed) return { data, changed: false, summary };
  return { data: { ...data, schoolUnits: units, classes, students }, changed: true, summary };
}

/** Nome da turma para exibição, sem o nome da escola na frente. */
export function displayClassName(cls: SchoolClass | undefined, units: SchoolUnit[] = []): string {
  if (!cls) return '';
  const n = normalizeSchoolName(cls.name);
  const hasPrefix = units.some((u) =>
    [u?.name, u?.tradeName].some((x) => {
      const p = normalizeSchoolName(x);
      return p.length >= 5 && n.startsWith(`${p} `);
    })
  );
  if (!hasPrefix) return cls.name;
  const grade = canonicalGrade(cls.gradeLevel) || cls.gradeLevel;
  return grade ? `${grade} - ${cls.shift || 'MANHÃ'}` : cls.name;
}
