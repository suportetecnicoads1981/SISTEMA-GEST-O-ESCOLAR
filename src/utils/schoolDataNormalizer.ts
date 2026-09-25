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

  // 0. Limpeza de importações repetidas (ver removeImportDuplicates)
  const cleaned = removeImportDuplicates(data.schoolUnits || [], data.classes || [], data.students || [], summary);
  if (cleaned.changed) {
    changed = true;
    data = { ...data, schoolUnits: cleaned.units, classes: cleaned.classes, students: cleaned.students };
  }

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
    // Sem turma com escola: se a base tem UMA escola só (Servidor Remoto), o aluno é dela
    const target =
      cls?.schoolUnitId && unitIds.has(cls.schoolUnitId) ? cls.schoolUnitId : unitIds.size === 1 ? Array.from(unitIds)[0] : '';
    if (!target) return s;
    changed = true;
    return { ...s, schoolUnitId: target, updatedAt: now } as Student;
  });

  // 5. Matrícula (RA) repetida: o aluno cadastrado primeiro fica com o número; os demais
  //    recebem o próximo número livre (a nuvem não aceita dois alunos com o mesmo RA).
  const finalStudents = dedupeRegistrationNumbers(students, now, summary);
  if (finalStudents !== students) changed = true;

  if (!changed) return { data, changed: false, summary };
  return { data: { ...data, schoolUnits: units, classes, students: finalStudents }, changed: true, summary };
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

/** Momento de cadastro do aluno: createdAt, ou o carimbo de tempo do id ("std-imp-1790253432996-..."). */
function registeredAt(s: any): number {
  const t = Date.parse(String(s?.createdAt || s?.enrollmentDate || ''));
  if (!Number.isNaN(t)) return t;
  const m = String(s?.id || '').match(/(\d{12,14})/);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function dedupeRegistrationNumbers(students: Student[], now: string, summary: string[]): Student[] {
  // Agrupa pelo RA "base": "RA-2026-0181-DUP-xxxx" (marca provisória da nuvem) conta como RA-2026-0181
  const baseOf = (ra: string) => ra.split('-DUP-')[0];
  const groups = new Map<string, number[]>();
  students.forEach((s, i) => {
    const ra = String((s as any)?.enrollmentNumber || '').trim();
    if (!ra) return;
    const base = baseOf(ra);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base)!.push(i);
  });

  const needsWork = Array.from(groups.values()).some(
    (idx) => idx.length > 1 || String((students[idx[0]] as any).enrollmentNumber).includes('-DUP-')
  );
  if (!needsWork) return students;

  const year = new Date().getFullYear();
  let next =
    Math.max(
      0,
      ...Array.from(groups.keys()).map((r) => {
        const m = r.match(/^RA-\d{4}-(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
    ) + 1;
  const used = new Set(groups.keys());
  const out = students.slice();
  const setRa = (i: number, ra: string, motivo: string) => {
    summary.push(`${motivo}: "${(out[i] as any).name}" ${(out[i] as any).enrollmentNumber} → ${ra}`);
    out[i] = { ...out[i], enrollmentNumber: ra, updatedAt: now } as Student;
  };

  groups.forEach((idx, base) => {
    // Quem foi cadastrado primeiro fica com o número base; os demais recebem o próximo livre
    const sorted = idx.slice().sort((a, b) => registeredAt(out[a]) - registeredAt(out[b]) || a - b);
    const [keeper, ...others] = sorted;
    if (String((out[keeper] as any).enrollmentNumber) !== base) setRa(keeper, base, 'RA restaurado');
    others.forEach((i) => {
      let ra = `RA-${year}-${String(next).padStart(4, '0')}`;
      while (used.has(ra)) ra = `RA-${year}-${String(++next).padStart(4, '0')}`;
      used.add(ra);
      next++;
      setRa(i, ra, 'RA repetido');
    });
  });
  return out;
}

const HEADER_NAME = /^(NOME COMPLETO( DO\(?A?\)? ALUNO\(?A?\)?)?|NOME DO\(?A?\)? ALUNO\(?A?\)?|NOME|ALUNO\(?A?\)?)$/;

function personKey(s: any): string {
  const name = String(s?.name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const birth = String(s?.birthDate || '').slice(0, 10);
  return name && /^\d{4}-\d{2}-\d{2}$/.test(birth) ? `${name}|${birth}` : '';
}

/**
 * Limpa o que sobra de importações repetidas da mesma planilha:
 *  - "alunos" que são a linha de cabeçalho da tabela ("NOME COMPLETO DO ALUNO");
 *  - o mesmo aluno importado duas vezes (mesmo nome e mesma data de nascimento, ambos
 *    vindos de importação): fica o cadastrado primeiro;
 *  - turmas e escolas que ficaram vazias e são cópia de outra escola com o mesmo nome.
 * Registros criados à mão (id que não começa com "std-imp-") nunca são removidos.
 */
function removeImportDuplicates(
  units: SchoolUnit[],
  classes: SchoolClass[],
  students: Student[],
  summary: string[]
): { units: SchoolUnit[]; classes: SchoolClass[]; students: Student[]; changed: boolean } {
  const isImported = (s: any) => String(s?.id || '').startsWith('std-imp-');
  const removed = new Set<string>();

  students.forEach((s: any) => {
    if (!s || !isImported(s)) return;
    const n = String(s.name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
    if (HEADER_NAME.test(n)) removed.add(s.id);
  });
  if (removed.size) summary.push(`${removed.size} linha(s) de cabeçalho importadas como aluno removida(s)`);

  const byKey = new Map<string, any[]>();
  students.forEach((s: any) => {
    if (!s || removed.has(s.id) || !isImported(s)) return;
    const k = personKey(s);
    if (!k) return;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(s);
  });
  let dupCount = 0;
  byKey.forEach((list) => {
    if (list.length < 2) return;
    const sorted = list.slice().sort((a, b) => registeredAt(a) - registeredAt(b));
    sorted.slice(1).forEach((s) => {
      removed.add(s.id);
      dupCount++;
    });
  });
  if (dupCount) summary.push(`${dupCount} aluno(s) importado(s) em duplicidade removido(s)`);
  if (removed.size === 0) return { units, classes, students, changed: false };

  const keptStudents = students.filter((s: any) => !s || !removed.has(s.id));

  // Escola repetida (mesmo nome de outra) que ficou sem alunos: sai junto com as turmas vazias dela
  const normName = (n: any) => normalizeSchoolName(n);
  const studentsPerUnit = new Map<string, number>();
  keptStudents.forEach((s: any) => s?.schoolUnitId && studentsPerUnit.set(s.schoolUnitId, (studentsPerUnit.get(s.schoolUnitId) || 0) + 1));
  const studentsPerClass = new Map<string, number>();
  keptStudents.forEach((s: any) => s?.classId && studentsPerClass.set(s.classId, (studentsPerClass.get(s.classId) || 0) + 1));
  const dropUnits = new Set<string>();
  units.forEach((u) => {
    if (!u || (studentsPerUnit.get(u.id) || 0) > 0) return;
    const twin = units.some((o) => o && o.id !== u.id && normName(o.name) === normName(u.name) && (studentsPerUnit.get(o.id) || 0) > 0);
    const hadRemoved = students.some((s: any) => s && removed.has(s.id) && s.schoolUnitId === u.id);
    if (twin && hadRemoved) dropUnits.add(u.id);
  });
  const keptClasses = classes.filter(
    (c) => !c || !(dropUnits.has(c.schoolUnitId || '') && (studentsPerClass.get(c.id) || 0) === 0)
  );
  const keptUnits = units.filter((u) => !u || !dropUnits.has(u.id));
  if (dropUnits.size) summary.push(`${dropUnits.size} escola(s) duplicada(s) removida(s)`);

  return { units: keptUnits, classes: keptClasses, students: keptStudents, changed: true };
}

/**
 * Nome da turma com a escola (ex.: "1º ANO - MANHÃ — EMEF CASTRO ALVES").
 * Várias escolas têm turmas com o mesmo nome; sem a escola não dá para distinguir na lista.
 */
export function classLabelWithSchool(cls: SchoolClass | undefined, units: SchoolUnit[] = []): string {
  if (!cls) return '';
  const base = displayClassName(cls, units);
  if ((units || []).length <= 1) return base;
  const unit = units.find((u) => u?.id === cls.schoolUnitId);
  return unit?.name ? `${base} — ${unit.name}` : base;
}
