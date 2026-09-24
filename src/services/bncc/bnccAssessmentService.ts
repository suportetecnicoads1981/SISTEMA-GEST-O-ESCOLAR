/**
 * Habilidades BNCC: regras do lançamento, importação/exportação e resumos dos relatórios.
 * Tudo aqui é puro (sem tela) para poder ser testado.
 */
import type { BnccSkill, BnccSkillAssessment, BnccMasteryLevel } from '../../types';

export const BNCC_LEVELS: Array<{ level: BnccMasteryLevel; sigla: string; label: string; color: string; bg: string }> = [
  { level: 1, sigla: 'ND', label: 'Não desenvolvida', color: '#ef4444', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
  { level: 2, sigla: 'ED', label: 'Em desenvolvimento', color: '#f59e0b', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { level: 3, sigla: 'D', label: 'Desenvolvida', color: '#0ea5e9', bg: 'bg-sky-100 text-sky-800 border-sky-300' },
  { level: 4, sigla: 'PD', label: 'Plenamente desenvolvida', color: '#10b981', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

export const levelInfo = (level?: number) => BNCC_LEVELS.find((l) => l.level === level);

/** Aceita 1-4, siglas (ND, ED, D, PD) ou o nome do nível. */
export function parseLevel(raw: any): BnccMasteryLevel | null {
  const v = String(raw ?? '').trim().toUpperCase();
  if (!v) return null;
  if (/^[1-4]$/.test(v)) return Number(v) as BnccMasteryLevel;
  const norm = v.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (norm === 'ND' || norm.startsWith('NAO')) return 1;
  if (norm === 'ED' || norm.startsWith('EM DESENV')) return 2;
  if (norm === 'PD' || norm.startsWith('PLENA')) return 4;
  if (norm === 'D' || norm.startsWith('DESENVOLVIDA')) return 3;
  return null;
}

const COMPONENTS: Record<string, string> = {
  LP: 'Língua Portuguesa',
  MA: 'Matemática',
  CI: 'Ciências',
  HI: 'História',
  GE: 'Geografia',
  AR: 'Arte',
  EF: 'Educação Física',
  ER: 'Ensino Religioso',
  LI: 'Língua Inglesa',
  EO: 'O eu, o outro e o nós',
  CG: 'Corpo, gestos e movimentos',
  TS: 'Traços, sons, cores e formas',
  ET: 'Espaços, tempos, quantidades, relações e transformações',
  LGG: 'Linguagens e suas Tecnologias',
  MAT: 'Matemática e suas Tecnologias',
  CNT: 'Ciências da Natureza e suas Tecnologias',
  CHS: 'Ciências Humanas e Sociais Aplicadas',
};

/**
 * Anos a que a habilidade se aplica, pelo código oficial:
 * EF01..EF09 = um ano; EF15 = 1º ao 5º; EF69 = 6º ao 9º; EF12, EF35, EF67, EF89 = faixas;
 * EI01..EI03 = Educação Infantil (ano 0); EM13 = Ensino Médio (10 a 12).
 */
export function skillYears(code: string): number[] {
  const c = String(code || '').trim().toUpperCase();
  const ef = /^EF(\d)(\d)/.exec(c);
  if (ef) {
    const a = Number(ef[1]);
    const b = Number(ef[2]);
    if (a === 0) return [b];
    const out: number[] = [];
    for (let y = a; y <= Math.max(a, b); y++) out.push(y);
    return out;
  }
  if (/^EI0[1-3]/.test(c)) return [0];
  if (/^EM13/.test(c)) return [10, 11, 12];
  return [];
}

/** Componente curricular pelo código (ex.: EF05MA03 → Matemática). */
export function componentFromCode(code: string): string {
  const c = String(code || '').trim().toUpperCase();
  const m = /^(?:EF\d\d|EI0\d|EM13)([A-Z]{2,3})/.exec(c);
  if (!m) return '';
  return COMPONENTS[m[1]] || COMPONENTS[m[1].slice(0, 2)] || m[1];
}

/** Ano da turma a partir da série (ex.: "5º Ano" → 5; "PRÉ I" → 0; "1ª Série EM" → 10). */
export function classYear(gradeLevel: string): number | null {
  const g = String(gradeLevel || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
  if (/PRE|INFANTIL|CRECHE|BERCARIO|MATERNAL/.test(g)) return 0;
  const serie = /(\d)\s*[ªAº°O]?\s*SERIE/.exec(g);
  if (serie && /MEDIO|EM\b|SERIE/.test(g) && !/ANO/.test(g)) return 9 + Number(serie[1]);
  const ano = /(\d)\s*[º°O]?\s*ANO/.exec(g) || /^(\d)\b/.exec(g.trim());
  if (ano) return Number(ano[1]);
  return null;
}

export function skillMatchesYear(skill: Pick<BnccSkill, 'code' | 'educationLevel'>, year: number | null): boolean {
  if (year === null) return true;
  const years = skillYears(skill.code);
  if (years.length) return years.includes(year);
  const fromLevel = classYear(skill.educationLevel || '');
  return fromLevel === null || fromLevel === year;
}

export const assessmentKey = (a: Pick<BnccSkillAssessment, 'studentId' | 'skillCode' | 'schoolYear' | 'term'>) =>
  `${a.studentId}|${String(a.skillCode).toUpperCase()}|${a.schoolYear}|${a.term}`;

/** Grava/atualiza lançamentos (mesmo aluno + habilidade + ano + bimestre = mesmo registro). */
export function upsertAssessments(current: BnccSkillAssessment[], incoming: BnccSkillAssessment[]): BnccSkillAssessment[] {
  const byKey = new Map<string, BnccSkillAssessment>();
  for (const a of current || []) byKey.set(assessmentKey(a), a);
  for (const a of incoming) {
    const key = assessmentKey(a);
    const prev = byKey.get(key);
    byKey.set(key, prev ? { ...prev, ...a, id: prev.id } : a);
  }
  return Array.from(byKey.values());
}

/** Remove lançamentos (ex.: célula apagada na grade). */
export function removeAssessments(current: BnccSkillAssessment[], keys: Set<string>): BnccSkillAssessment[] {
  return (current || []).filter((a) => !keys.has(assessmentKey(a)));
}

/** Id fixo por aluno + habilidade + ano + bimestre: o mesmo lançamento em outro computador vira o mesmo registro. */
export const assessmentIdFor = (a: Pick<BnccSkillAssessment, 'studentId' | 'skillCode' | 'schoolYear' | 'term'>) =>
  `bncc-av-${a.studentId}-${String(a.skillCode).toUpperCase()}-${a.schoolYear}-${a.term}`;

export const newAssessmentId = () => `bncc-av-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Resumos para relatórios e gráficos
// ---------------------------------------------------------------------------

export interface LevelDistribution {
  total: number;
  counts: Record<BnccMasteryLevel, number>;
  /** % de lançamentos em D ou PD */
  achievedPct: number;
  /** média de 1 a 4 */
  average: number;
}

export function distribution(list: BnccSkillAssessment[]): LevelDistribution {
  const counts: Record<BnccMasteryLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let sum = 0;
  for (const a of list) {
    if (counts[a.level] === undefined) continue;
    counts[a.level]++;
    sum += a.level;
  }
  const total = counts[1] + counts[2] + counts[3] + counts[4];
  return {
    total,
    counts,
    achievedPct: total ? Math.round(((counts[3] + counts[4]) / total) * 1000) / 10 : 0,
    average: total ? Math.round((sum / total) * 100) / 100 : 0,
  };
}

/** Último lançamento de cada aluno+habilidade até o bimestre informado (situação atual). */
export function latestByStudentSkill(list: BnccSkillAssessment[], upToTerm = 4): BnccSkillAssessment[] {
  const map = new Map<string, BnccSkillAssessment>();
  for (const a of list) {
    if (a.term > upToTerm) continue;
    const key = `${a.studentId}|${String(a.skillCode).toUpperCase()}`;
    const cur = map.get(key);
    if (!cur || a.term > cur.term || (a.term === cur.term && a.updatedAt > cur.updatedAt)) map.set(key, a);
  }
  return Array.from(map.values());
}

export function groupBy<T>(list: T[], keyOf: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of list) {
    const k = keyOf(item);
    const arr = m.get(k);
    if (arr) arr.push(item);
    else m.set(k, [item]);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Importação / exportação
// ---------------------------------------------------------------------------

const norm = (v: any) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();

/** Acha a coluna pelo nome (aceita variações: "Código", "codigo", "COD. HABILIDADE"...). */
function pick(row: Record<string, any>, ...names: string[]): any {
  const keys = Object.keys(row);
  for (const n of names) {
    const target = norm(n);
    const k = keys.find((key) => norm(key) === target) || keys.find((key) => norm(key).includes(target));
    if (k !== undefined && row[k] !== undefined && String(row[k]).trim() !== '') return row[k];
  }
  return undefined;
}

export const SKILL_EXPORT_COLUMNS = ['Código', 'Ano/Etapa', 'Componente', 'Unidade temática / Campo', 'Objeto de conhecimento', 'Descrição'];

export function skillsToRows(skills: BnccSkill[]): Array<Record<string, any>> {
  return skills.map((s) => ({
    Código: s.code,
    'Ano/Etapa': s.educationLevel,
    Componente: s.subject,
    'Unidade temática / Campo': s.fieldOfExperience || '',
    'Objeto de conhecimento': s.knowledgeObject || '',
    Descrição: s.description,
  }));
}

const levelLabelFromYears = (years: number[]) => {
  if (!years.length) return '';
  if (years[0] === 0) return 'Educação Infantil';
  if (years[0] >= 10) return 'Ensino Médio';
  return years.length === 1 ? `${years[0]}º Ano` : `${years[0]}º ao ${years[years.length - 1]}º Ano`;
};

/** Converte linhas de planilha em habilidades (código obrigatório; o resto é deduzido quando falta). */
export function rowsToSkills(rows: Array<Record<string, any>>): { skills: BnccSkill[]; errors: string[] } {
  const skills: BnccSkill[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const code = String(pick(row, 'Código', 'Codigo', 'Cod', 'Habilidade código', 'Code') ?? '')
      .trim()
      .toUpperCase()
      .replace(/[()\s]/g, '');
    const description = String(pick(row, 'Descrição', 'Descricao', 'Habilidade', 'Texto') ?? '').trim();
    if (!/^(EF\d\d|EI0\d|EM13)[A-Z]{2,3}\d{2}/.test(code)) {
      if (code || description) errors.push(`Linha ${i + 2}: código BNCC inválido "${code}".`);
      return;
    }
    if (!description) {
      errors.push(`Linha ${i + 2}: habilidade ${code} sem descrição.`);
      return;
    }
    if (seen.has(code)) return;
    seen.add(code);
    const years = skillYears(code);
    skills.push({
      id: `bncc-${code.toLowerCase()}`,
      code,
      educationLevel: String(pick(row, 'Ano/Etapa', 'Ano', 'Etapa', 'Série') ?? '').trim() || levelLabelFromYears(years),
      segment: years[0] === 0 ? 'EDUCACAO_INFANTIL' : years[0] >= 10 ? 'ENSINO_MEDIO' : years[0] >= 6 ? 'FUNDAMENTAL_II' : 'FUNDAMENTAL_I',
      subject: String(pick(row, 'Componente', 'Disciplina', 'Área') ?? '').trim() || componentFromCode(code),
      fieldOfExperience: String(pick(row, 'Unidade temática', 'Campo', 'Prática') ?? '').trim() || undefined,
      knowledgeObject: String(pick(row, 'Objeto de conhecimento', 'Objeto', 'Objetos') ?? '').trim() || undefined,
      description,
    });
  });
  return { skills, errors };
}

/** Junta habilidades novas ao catálogo (o código identifica; a versão importada atualiza a existente). */
export function mergeSkills(current: BnccSkill[], incoming: BnccSkill[]): { list: BnccSkill[]; added: number; updated: number } {
  const byCode = new Map((current || []).map((s) => [String(s.code).toUpperCase(), s]));
  let added = 0;
  let updated = 0;
  for (const s of incoming) {
    const key = s.code.toUpperCase();
    const prev = byCode.get(key);
    if (prev) {
      byCode.set(key, { ...prev, ...s, id: prev.id });
      updated++;
    } else {
      byCode.set(key, s);
      added++;
    }
  }
  return { list: Array.from(byCode.values()), added, updated };
}

export interface AssessmentExportContext {
  students: Array<{ id: string; name: string; enrollmentNumber?: string; classId?: string }>;
  classes: Array<{ id: string; name: string }>;
  skills: BnccSkill[];
}

export function assessmentsToRows(list: BnccSkillAssessment[], ctx: AssessmentExportContext): Array<Record<string, any>> {
  const st = new Map(ctx.students.map((s) => [s.id, s]));
  const cl = new Map(ctx.classes.map((c) => [c.id, c]));
  const sk = new Map(ctx.skills.map((s) => [s.code.toUpperCase(), s]));
  return list.map((a) => ({
    Matrícula: st.get(a.studentId)?.enrollmentNumber || '',
    Aluno: st.get(a.studentId)?.name || a.studentId,
    Turma: cl.get(a.classId)?.name || a.classId,
    'Ano letivo': a.schoolYear,
    Bimestre: a.term,
    Componente: a.subject,
    Código: a.skillCode,
    Habilidade: sk.get(a.skillCode.toUpperCase())?.description || '',
    Nível: levelInfo(a.level)?.sigla || a.level,
    'Nível (descrição)': levelInfo(a.level)?.label || '',
    Observação: a.notes || '',
  }));
}

/**
 * Lê lançamentos de uma planilha. O aluno é localizado pela matrícula (ou pelo nome dentro da turma);
 * a turma, pelo nome (ou pela turma do aluno).
 */
export function rowsToAssessments(
  rows: Array<Record<string, any>>,
  ctx: AssessmentExportContext & { defaultYear: number; teacherName?: string; defaultClassId?: string },
  skillsByCode: Map<string, BnccSkill>
): { list: BnccSkillAssessment[]; errors: string[] } {
  const list: BnccSkillAssessment[] = [];
  const errors: string[] = [];
  const byRa = new Map(ctx.students.filter((s) => s.enrollmentNumber).map((s) => [norm(s.enrollmentNumber), s]));
  const classByName = new Map(ctx.classes.map((c) => [norm(c.name), c]));
  const now = new Date().toISOString();

  rows.forEach((row, i) => {
    const line = i + 2;
    const code = String(pick(row, 'Código', 'Codigo', 'Habilidade código') ?? '').trim().toUpperCase();
    const level = parseLevel(pick(row, 'Nível', 'Nivel', 'Conceito', 'Resultado'));
    if (!code && level === null) return; // linha vazia
    if (!code) return void errors.push(`Linha ${line}: falta o código da habilidade.`);
    if (level === null) return void errors.push(`Linha ${line}: nível inválido (use 1-4 ou ND, ED, D, PD).`);

    const turmaName = pick(row, 'Turma');
    const turma = turmaName ? classByName.get(norm(turmaName)) : undefined;
    const ra = pick(row, 'Matrícula', 'Matricula', 'RA');
    const nome = pick(row, 'Aluno', 'Nome');
    let student = ra ? byRa.get(norm(ra)) : undefined;
    if (!student && nome) {
      const classId = turma?.id || ctx.defaultClassId;
      student =
        ctx.students.find((s) => norm(s.name) === norm(nome) && (!classId || s.classId === classId)) ||
        ctx.students.find((s) => norm(s.name) === norm(nome));
    }
    if (!student) return void errors.push(`Linha ${line}: aluno não encontrado (${ra || nome || 'sem matrícula/nome'}).`);

    const classId = turma?.id || student.classId || ctx.defaultClassId || '';
    const termRaw = Number(String(pick(row, 'Bimestre', 'Período', 'Etapa') ?? '1').replace(/\D/g, '')) || 1;
    const yearRaw = Number(String(pick(row, 'Ano letivo', 'Ano') ?? '').replace(/\D/g, ''));
    const schoolYear = yearRaw > 2000 ? yearRaw : ctx.defaultYear;
    const term = Math.min(4, Math.max(1, termRaw));
    list.push({
      id: assessmentIdFor({ studentId: student.id, skillCode: code, schoolYear, term }),
      studentId: student.id,
      classId,
      skillCode: code,
      subject: String(pick(row, 'Componente', 'Disciplina') ?? '').trim() || skillsByCode.get(code)?.subject || componentFromCode(code),
      schoolYear,
      term,
      level,
      notes: String(pick(row, 'Observação', 'Observacao', 'Obs') ?? '').trim() || undefined,
      teacherName: ctx.teacherName,
      updatedAt: now,
    });
  });
  return { list, errors };
}
