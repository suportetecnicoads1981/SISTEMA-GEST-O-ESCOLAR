/**
 * Indicadores da Rede Municipal calculados SÓ com dados lançados no sistema
 * (nada estimado). Quando não há dado, devolve null para a tela mostrar "—".
 */

type AnyStudent = {
  id?: string;
  schoolUnitId?: string;
  classId?: string;
  status?: string;
  hasAEE?: boolean;
  hasAeeSupport?: boolean;
  specialConditions?: unknown[];
  specialNeeds?: unknown[];
  cidCodes?: unknown[];
  pendingFields?: unknown[];
  cadastralStatus?: string;
};
type AnyClass = { id?: string; schoolUnitId?: string };
type AnySheet = {
  classId?: string;
  subjectName?: string;
  grades?: Array<{
    assessment1?: number | null;
    assessment2?: number | null;
    activitiesScore?: number | null;
    examScore?: number | null;
    recoveryScore?: number | null;
    termAverage?: number | null;
  }>;
};

const filled = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const nonEmpty = (a: unknown) => Array.isArray(a) && a.length > 0;

/** Aluno da Educação Especial: AEE marcado ou condição/CID/necessidade registrada no cadastro. */
export function isSpecialEducationStudent(s: AnyStudent): boolean {
  return !!(s?.hasAEE || s?.hasAeeSupport || nonEmpty(s?.specialConditions) || nonEmpty(s?.specialNeeds) || nonEmpty(s?.cidCodes));
}

/** Aluno com pendência no cadastro (documentos, campos do Censo etc.). */
export function hasCadastralPending(s: AnyStudent): boolean {
  return nonEmpty(s?.pendingFields) || (!!s?.cadastralStatus && s.cadastralStatus !== 'OK');
}

/** Alunos ativos da escola: pelo vínculo do aluno ou pela turma em que está. */
export function activeStudentsOfUnit<T extends AnyStudent>(unitId: string, students: T[], classes: AnyClass[]): T[] {
  const classIds = new Set(classes.filter((c) => c?.schoolUnitId === unitId).map((c) => c.id));
  return students.filter(
    (s) => (s?.schoolUnitId === unitId || (!!s?.classId && classIds.has(s.classId))) && (!s?.status || s.status === 'ACTIVE')
  );
}

export const isValidInep = (code?: string) => /^\d{8}$/.test(String(code || '').trim());

export interface SchoolPerformance {
  overall: number | null;
  portuguese: number | null;
  math: number | null;
  /** Quantidade de médias lançadas (aluno × disciplina × bimestre). */
  gradesCount: number;
}

const norm = (s?: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Médias reais da escola a partir das notas lançadas nos diários (só entradas com alguma nota preenchida). */
export function schoolPerformance(unitId: string, classes: AnyClass[], sheets: AnySheet[]): SchoolPerformance {
  const classIds = new Set(classes.filter((c) => c?.schoolUnitId === unitId).map((c) => c.id));
  const all: number[] = [];
  const lp: number[] = [];
  const mat: number[] = [];
  for (const sh of sheets || []) {
    if (!sh?.classId || !classIds.has(sh.classId)) continue;
    const subj = norm(sh.subjectName);
    for (const g of sh.grades || []) {
      const anyScore = [g?.assessment1, g?.assessment2, g?.activitiesScore, g?.examScore, g?.recoveryScore].some(filled);
      if (!anyScore || !filled(g?.termAverage)) continue;
      const v = Number(g.termAverage);
      all.push(v);
      if (subj.includes('portugu')) lp.push(v);
      if (subj.includes('matematic')) mat.push(v);
    }
  }
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  return { overall: avg(all), portuguese: avg(lp), math: avg(mat), gradesCount: all.length };
}
