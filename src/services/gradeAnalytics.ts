/**
 * Notas para os gráficos e painéis pedagógicos.
 *
 * As notas lançadas pelos professores ficam no Diário de Notas (classGradeSheets: uma folha
 * por turma + disciplina + bimestre). O histórico escolar (academicHistories) só é preenchido
 * na emissão de histórico/importação. Os painéis liam apenas o histórico e, sem ele, mostravam
 * números de exemplo do protótipo. Aqui as duas fontes viram uma só lista de históricos,
 * no mesmo formato (AcademicHistory), e os cálculos devolvem null quando não há nota —
 * nunca um número inventado.
 */
import { AcademicHistory, AcademicRecordItem, ClassGradeSheet, Student } from '../types';

export const PASSING_GRADE = 6;
const TERM_INDEX: Record<string, 0 | 1 | 2 | 3> = {
  '1º Bimestre': 0,
  '2º Bimestre': 1,
  '3º Bimestre': 2,
  '4º Bimestre': 3,
};
const BKEYS = ['b1', 'b2', 'b3', 'b4'] as const;

export const isNum = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);

/** Média com 1 casa; null quando a lista está vazia. */
export function avg1(values: Array<number | null | undefined>): number | null {
  const ok = values.filter(isNum);
  if (!ok.length) return null;
  return Math.round((ok.reduce((a, b) => a + b, 0) / ok.length) * 10) / 10;
}

const subjectKey = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** A linha do diário tem nota lançada? (a folha nasce com média 0 para todos) */
function hasGrade(e: any): boolean {
  if (!e) return false;
  if (['assessment1', 'assessment2', 'activitiesScore', 'examScore', 'recoveryScore'].some((k) => isNum(e[k]))) return true;
  return isNum(e.termAverage) && e.termAverage > 0;
}

/**
 * Junta histórico escolar + Diário de Notas em uma lista de históricos por aluno.
 * A nota do diário (média do bimestre) prevalece sobre a do histórico no mesmo bimestre.
 */
export function mergeGradeHistories(
  histories: AcademicHistory[] = [],
  sheets: ClassGradeSheet[] = [],
  students: Student[] = []
): AcademicHistory[] {
  const byStudent = new Map<string, AcademicHistory>();
  (histories || []).forEach((h) => {
    if (!h?.studentId) return;
    byStudent.set(h.studentId, {
      ...h,
      records: (h.records || []).filter(Boolean).map((r) => ({ ...r, bimonthlyGrades: { ...(r.bimonthlyGrades || { b1: null, b2: null, b3: null, b4: null }) } })),
    });
  });
  const studentById = new Map((students || []).map((s) => [s.id, s]));
  const touched = new Set<AcademicRecordItem>();

  (sheets || []).forEach((sheet) => {
    const t = TERM_INDEX[String(sheet?.term || '')];
    if (t === undefined) return;
    (sheet.grades || []).forEach((g) => {
      if (!g?.studentId || !hasGrade(g)) return;
      let h = byStudent.get(g.studentId);
      if (!h) {
        const st = studentById.get(g.studentId);
        h = {
          id: `hist-diario-${g.studentId}`,
          studentId: g.studentId,
          schoolYear: sheet.schoolYear,
          gradeLevel: String((st as any)?.series || ''),
          schoolName: '',
          cityState: '',
          records: [],
          generalAverage: 0,
          attendanceRate: 0,
          finalResult: 'EM_CURSO',
          observations: '',
          issuedAt: '',
        };
        byStudent.set(g.studentId, h);
      }
      const key = subjectKey(sheet.subjectName);
      let rec = h.records.find((r) => subjectKey(r.subjectName) === key);
      if (!rec) {
        rec = {
          id: `rec-${sheet.subjectId || key}`,
          subjectId: sheet.subjectId,
          subjectName: sheet.subjectName,
          teacherName: sheet.teacherName || '',
          workloadHours: 0,
          bimonthlyGrades: { b1: null, b2: null, b3: null, b4: null },
          recoveryGrade: null,
          finalGrade: NaN,
          totalAbsences: 0,
          maxAllowedAbsences: 0,
          status: 'EM_ANDAMENTO',
        };
        h.records.push(rec);
      }
      rec.bimonthlyGrades[BKEYS[t]] = Math.round(Number(g.termAverage) * 10) / 10;
      touched.add(rec);
    });
  });

  // Média final da disciplina: a do histórico, ou a média dos bimestres lançados.
  byStudent.forEach((h) => {
    h.records.forEach((r) => {
      if (touched.has(r) || !isNum(r.finalGrade) || (r.finalGrade === 0 && BKEYS.some((k) => isNum(r.bimonthlyGrades?.[k])))) {
        const m = avg1(BKEYS.map((k) => r.bimonthlyGrades?.[k]));
        r.finalGrade = m === null ? (NaN as any) : m;
      }
    });
    const g = avg1(h.records.map((r) => (isNum(r.finalGrade) ? r.finalGrade : null)));
    if (g !== null && (!isNum(h.generalAverage) || h.generalAverage === 0 || h.id.startsWith('hist-diario-'))) h.generalAverage = g;
  });
  return Array.from(byStudent.values());
}

/** Notas de um aluno nos 4 bimestres (média das disciplinas; ou só da disciplina pedida). */
export function studentBimesters(h: AcademicHistory | null | undefined, subject = 'ALL'): Array<number | null> {
  if (!h) return [null, null, null, null];
  const recs = (h.records || []).filter((r) => subject === 'ALL' || subjectKey(r.subjectName) === subjectKey(subject));
  return BKEYS.map((k) => avg1(recs.map((r) => r.bimonthlyGrades?.[k])));
}

/** Média final do aluno (todas as disciplinas ou uma). */
export function studentFinal(h: AcademicHistory | null | undefined, subject = 'ALL'): number | null {
  if (!h) return null;
  const recs = (h.records || []).filter((r) => subject === 'ALL' || subjectKey(r.subjectName) === subjectKey(subject));
  return avg1(recs.map((r) => (isNum(r.finalGrade) ? r.finalGrade : null)));
}

export interface GroupStats {
  students: number;
  withGrades: number;
  bimesters: Array<number | null>;
  /** % de alunos com média do bimestre >= 6 (entre os que têm nota no bimestre). */
  bimesterApproval: Array<number | null>;
  average: number | null;
  approval: number | null;
}

/** Estatísticas de um grupo de alunos (turma, escola...). */
export function groupStats(studentIds: string[], histByStudent: Map<string, AcademicHistory>, subject = 'ALL'): GroupStats {
  const bims: number[][] = [[], [], [], []];
  const finals: number[] = [];
  studentIds.forEach((id) => {
    const h = histByStudent.get(id);
    if (!h) return;
    studentBimesters(h, subject).forEach((v, i) => isNum(v) && bims[i].push(v));
    const f = studentFinal(h, subject);
    if (isNum(f)) finals.push(f);
  });
  const pct = (arr: number[]) => (arr.length ? Math.round((arr.filter((v) => v >= PASSING_GRADE).length / arr.length) * 100) : null);
  return {
    students: studentIds.length,
    withGrades: finals.length,
    bimesters: bims.map((b) => avg1(b)),
    bimesterApproval: bims.map(pct),
    average: avg1(finals),
    approval: pct(finals),
  };
}

export const BIMESTER_LABELS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

/** Texto de nota para tela: "7,5" ou "—". */
export const fmtGrade = (v: number | null | undefined) => (isNum(v) ? v.toFixed(1).replace('.', ',') : '—');
