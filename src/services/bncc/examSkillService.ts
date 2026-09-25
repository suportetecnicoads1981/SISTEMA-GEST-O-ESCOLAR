/**
 * Desempenho por habilidade BNCC a partir das provas corrigidas.
 *
 * - Cada questão pode ter uma ou mais habilidades (campo bnccSkills ou bnccSkill com códigos
 *   separados por vírgula, que é como a questão vai para a nuvem).
 * - Prova aplicada no papel: o professor lança a alternativa marcada (A, B, C...) e, nas
 *   discursivas, os pontos; o sistema corrige e grava a correção (uma por aluno e prova).
 * - Percentual de acerto na habilidade = pontos obtidos ÷ pontos possíveis nas questões da
 *   habilidade (todas as provas do filtro). O nível segue as faixas ND / ED / D / PD.
 * Tudo aqui é puro (sem tela) para poder ser testado.
 */
import type { BnccMasteryLevel, Exam, ExamAnswer, ExamSubmission, Question, SchoolClass, Student } from '../../types';

// ---------------------------------------------------------------------------
// Habilidades da questão
// ---------------------------------------------------------------------------

/** Códigos de habilidade da questão (sem repetição, em maiúsculas). */
export function questionSkillCodes(q: Pick<Question, 'bnccSkill'> & { bnccSkills?: string[] } | null | undefined): string[] {
  if (!q) return [];
  const raw: string[] = [];
  if (Array.isArray(q.bnccSkills)) raw.push(...q.bnccSkills);
  if (q.bnccSkill) raw.push(...String(q.bnccSkill).split(/[,;\n|/]+/));
  const out: string[] = [];
  for (const r of raw) {
    const code = String(r || '')
      .trim()
      .toUpperCase()
      .replace(/[()]/g, '')
      .replace(/\s+/g, '');
    if (code && /\d/.test(code) && code.length >= 5 && !out.includes(code)) out.push(code);
  }
  return out;
}

/** Texto gravado em bnccSkill (e na nuvem) para uma lista de códigos. */
export const joinSkillCodes = (codes: string[]) => codes.join(', ');

// ---------------------------------------------------------------------------
// Níveis
// ---------------------------------------------------------------------------

/** Percentuais mínimos para ED, D e PD (abaixo do primeiro = ND). */
export interface LevelCuts {
  ed: number;
  d: number;
  pd: number;
}

export const DEFAULT_LEVEL_CUTS: LevelCuts = { ed: 40, d: 60, pd: 80 };

export function normalizeCuts(c: Partial<LevelCuts> | null | undefined): LevelCuts {
  const n = (v: any, def: number) => {
    const x = Number(v);
    return Number.isFinite(x) && x >= 0 && x <= 100 ? x : def;
  };
  const ed = n(c?.ed, DEFAULT_LEVEL_CUTS.ed);
  const d = Math.max(ed, n(c?.d, DEFAULT_LEVEL_CUTS.d));
  const pd = Math.max(d, n(c?.pd, DEFAULT_LEVEL_CUTS.pd));
  return { ed, d, pd };
}

export function levelFromPercent(pct: number, cuts: LevelCuts = DEFAULT_LEVEL_CUTS): BnccMasteryLevel {
  if (pct >= cuts.pd) return 4;
  if (pct >= cuts.d) return 3;
  if (pct >= cuts.ed) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Prova no papel: lançamento das respostas
// ---------------------------------------------------------------------------

/** Bimestre da prova (1 a 4) ou null para Recuperação / Simulado. */
export function examTermNumber(exam: Pick<Exam, 'term'>): number | null {
  const t = String(exam?.term || '');
  if (!/bimestre/i.test(t)) return null;
  const m = /([1-4])/.exec(t);
  return m ? Number(m[1]) : null;
}

/** Pontos da questão na prova (se não foram definidos, divide o total igualmente). */
export function questionPoints(exam: Exam, index: number): number {
  const cfg = exam.questions[index];
  const p = Number(cfg?.points);
  if (Number.isFinite(p) && p > 0) return p;
  const n = exam.questions.length || 1;
  return Number(((Number(exam.totalPoints) || 10) / n).toFixed(2));
}

export const optionLetter = (index: number) => String.fromCharCode(65 + index);

/** Marcação de um aluno numa questão: letra (objetivas) ou pontos (discursivas). */
export interface PaperMark {
  letter?: string;
  score?: number | null;
}

export type PaperMarks = Record<string, PaperMark>; // chave: questionId

/** Id fixo: lançar de novo a mesma prova para o mesmo aluno substitui a correção anterior. */
export const paperSubmissionId = (examId: string, studentId: string) => `sub-papel-${examId}-${studentId}`;

const isObjective = (q?: Question) => !!q && (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE');

/** Aluno sem nenhuma marcação (linha vazia = sem correção). */
export function marksAreEmpty(marks: PaperMarks | undefined): boolean {
  if (!marks) return true;
  return Object.values(marks).every((m) => !m || ((!m.letter || m.letter === '') && (m.score === undefined || m.score === null || (m.score as any) === '')));
}

/** Corrige a prova de papel de um aluno. */
export function gradePaperSubmission(
  exam: Exam,
  questions: Question[],
  student: Pick<Student, 'id' | 'name' | 'enrollmentNumber' | 'classId'>,
  marks: PaperMarks,
  when = new Date().toISOString()
): ExamSubmission {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const answers: ExamAnswer[] = [];
  let total = 0;
  let max = 0;
  let correct = 0;
  let incorrect = 0;

  exam.questions.forEach((cfg, idx) => {
    const q = qMap.get(cfg.questionId);
    const pts = questionPoints(exam, idx);
    max += pts;
    const mark = marks[cfg.questionId] || {};
    if (isObjective(q)) {
      const letter = String(mark.letter || '').trim().toUpperCase();
      const optIdx = letter ? letter.charCodeAt(0) - 65 : -1;
      const opt = optIdx >= 0 ? q!.options?.[optIdx] : undefined;
      const correctIdx = q!.options?.findIndex((o) => o.isCorrect) ?? -1;
      const ok = !!opt && !!opt.isCorrect;
      if (ok) correct++;
      else incorrect++;
      const earned = ok ? pts : 0;
      total += earned;
      answers.push({
        questionId: cfg.questionId,
        selectedOptionId: opt?.id,
        timeSpentSeconds: 0,
        isCorrect: ok,
        earnedScore: earned,
        feedback: !letter
          ? `Em branco. Gabarito: ${correctIdx >= 0 ? optionLetter(correctIdx) : '-'}.`
          : ok
            ? `Marcou ${letter} (correta).`
            : `Marcou ${letter}. Gabarito: ${correctIdx >= 0 ? optionLetter(correctIdx) : '-'}.`,
      });
    } else {
      const raw = Number(mark.score);
      const earned = Number.isFinite(raw) ? Math.min(pts, Math.max(0, raw)) : 0;
      const ok = pts > 0 && earned >= pts * 0.75;
      if (ok) correct++;
      else incorrect++;
      total += earned;
      answers.push({
        questionId: cfg.questionId,
        timeSpentSeconds: 0,
        isCorrect: ok,
        earnedScore: Number(earned.toFixed(2)),
        feedback: `Discursiva corrigida pelo professor: ${earned.toFixed(2)} de ${pts.toFixed(2)} ponto(s).`,
      });
    }
  });

  const totalScore = Number(total.toFixed(2));
  const maxScore = Number(max.toFixed(2));
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passing = Number(exam.passingScore);
  const approved = Number.isFinite(passing) && passing > 0 ? totalScore >= passing : percentage >= 60;

  return {
    id: paperSubmissionId(exam.id, student.id),
    examId: exam.id,
    studentId: student.id,
    studentName: student.name,
    enrollmentNumber: student.enrollmentNumber || '',
    classId: student.classId || exam.classId,
    startedAt: when,
    submittedAt: when,
    timeSpentSeconds: 0,
    totalScore,
    maxScore,
    percentage,
    correctCount: correct,
    incorrectCount: incorrect,
    answers,
    commonMistakesIdentified: [],
    pedagogicalFeedback: 'Prova aplicada no papel; respostas lançadas pelo professor.',
    status: approved ? 'APROVADO' : 'REPROVADO',
  };
}

/** Marcações a partir de uma correção já gravada (para reabrir o lançamento). */
export function marksFromSubmission(exam: Exam, questions: Question[], sub: ExamSubmission | undefined): PaperMarks {
  const marks: PaperMarks = {};
  if (!sub) return marks;
  const qMap = new Map(questions.map((q) => [q.id, q]));
  for (const cfg of exam.questions) {
    const q = qMap.get(cfg.questionId);
    const a = sub.answers?.find((x) => x.questionId === cfg.questionId);
    if (!a) continue;
    if (isObjective(q)) {
      const idx = q!.options?.findIndex((o) => o.id === a.selectedOptionId) ?? -1;
      if (idx >= 0) marks[cfg.questionId] = { letter: optionLetter(idx) };
    } else {
      marks[cfg.questionId] = { score: Number(a.earnedScore) || 0 };
    }
  }
  return marks;
}

/** Substitui as correções de um aluno numa prova (papel ou computador) pela nova lista. */
export function replaceSubmissions(
  current: ExamSubmission[],
  examId: string,
  upserts: ExamSubmission[],
  removeStudentIds: string[]
): ExamSubmission[] {
  const touched = new Set([...upserts.map((s) => s.studentId), ...removeStudentIds]);
  const kept = (current || []).filter((s) => !(s.examId === examId && touched.has(s.studentId)));
  return [...upserts, ...kept];
}

// ---------------------------------------------------------------------------
// Relatório de desempenho por habilidade
// ---------------------------------------------------------------------------

/** Nome da série de uma turma (ex.: "5º ANO"), para agrupar turmas de escolas diferentes. */
export function gradeKey(gradeLevel: string | undefined): string {
  return String(gradeLevel || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export interface SkillCell {
  earned: number;
  max: number;
  questions: number; // questões respondidas com a habilidade
  pct: number; // 0-100
  level: BnccMasteryLevel;
}

export interface StudentSkillRow {
  studentId: string;
  studentName: string;
  classId: string;
  exams: number;
  cells: Record<string, SkillCell>; // chave: código da habilidade
}

export interface SkillSummary {
  code: string;
  subject?: string;
  questions: number; // questões distintas com a habilidade
  studentsAssessed: number;
  avgPct: number;
  level: BnccMasteryLevel; // nível da série (média)
  distribution: Record<BnccMasteryLevel, number>;
}

export interface SkillPerformanceReport {
  skills: SkillSummary[];
  rows: StudentSkillRow[];
  examsUsed: Exam[];
  submissionsUsed: number;
  questionsWithoutSkill: number;
}

export interface SkillPerformanceFilter {
  classIds: Set<string>; // turmas incluídas (já filtradas por série/escola/turma)
  examIds?: Set<string> | null; // provas escolhidas (null = todas do filtro)
  subject?: string;
  schoolYear?: number;
  term?: number; // 0 = todos
}

export function examMatches(exam: Exam, f: Pick<SkillPerformanceFilter, 'subject' | 'schoolYear' | 'term'>): boolean {
  if (f.subject && exam.subject !== f.subject) return false;
  if (f.schoolYear && Number(exam.schoolYear) && Number(exam.schoolYear) !== f.schoolYear) return false;
  if (f.term && examTermNumber(exam) !== f.term) return false;
  return true;
}

export function buildSkillPerformance(
  exams: Exam[],
  questions: Question[],
  submissions: ExamSubmission[],
  students: Student[],
  f: SkillPerformanceFilter,
  cuts: LevelCuts = DEFAULT_LEVEL_CUTS,
  skillSubject?: (code: string) => string | undefined
): SkillPerformanceReport {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const examMap = new Map(exams.map((e) => [e.id, e]));
  const usedExams = new Map<string, Exam>();
  const skillQuestions = new Map<string, Set<string>>();
  const rows = new Map<string, StudentSkillRow>();
  const noSkill = new Set<string>();
  let used = 0;

  // A correção mais recente de cada aluno em cada prova.
  const latest = new Map<string, ExamSubmission>();
  for (const s of submissions || []) {
    if (!s) continue;
    const k = `${s.examId}|${s.studentId}`;
    const prev = latest.get(k);
    if (!prev || String(s.submittedAt || '') > String(prev.submittedAt || '')) latest.set(k, s);
  }

  for (const sub of latest.values()) {
    const exam = examMap.get(sub.examId);
    if (!exam || !examMatches(exam, f)) continue;
    if (f.examIds && f.examIds.size && !f.examIds.has(exam.id)) continue;
    const student = studentMap.get(sub.studentId);
    const classId = student?.classId || sub.classId;
    if (!f.classIds.has(classId)) continue;

    let counted = false;
    exam.questions.forEach((cfg, idx) => {
      const q = qMap.get(cfg.questionId);
      const codes = questionSkillCodes(q);
      if (!codes.length) {
        noSkill.add(cfg.questionId);
        return;
      }
      const pts = questionPoints(exam, idx);
      const ans = sub.answers?.find((a) => a.questionId === cfg.questionId);
      const earned = Math.min(pts, Math.max(0, Number(ans?.earnedScore) || 0));
      let row = rows.get(sub.studentId);
      if (!row) {
        row = { studentId: sub.studentId, studentName: student?.name || sub.studentName, classId, exams: 0, cells: {} };
        rows.set(sub.studentId, row);
      }
      for (const code of codes) {
        const cell = row.cells[code] || { earned: 0, max: 0, questions: 0, pct: 0, level: 1 as BnccMasteryLevel };
        cell.earned += earned;
        cell.max += pts;
        cell.questions += 1;
        row.cells[code] = cell;
        if (!skillQuestions.has(code)) skillQuestions.set(code, new Set());
        skillQuestions.get(code)!.add(cfg.questionId);
      }
      counted = true;
    });
    if (counted) {
      rows.get(sub.studentId)!.exams += 1;
      usedExams.set(exam.id, exam);
      used++;
    }
  }

  for (const row of rows.values()) {
    for (const cell of Object.values(row.cells)) {
      cell.pct = cell.max > 0 ? Math.round((cell.earned / cell.max) * 1000) / 10 : 0;
      cell.level = levelFromPercent(cell.pct, cuts);
    }
  }

  const skills: SkillSummary[] = Array.from(skillQuestions.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((code) => {
      const cells = Array.from(rows.values())
        .map((r) => r.cells[code])
        .filter(Boolean) as SkillCell[];
      const dist: Record<BnccMasteryLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      cells.forEach((c) => (dist[c.level] += 1));
      const avg = cells.length ? cells.reduce((a, c) => a + c.pct, 0) / cells.length : 0;
      const avgPct = Math.round(avg * 10) / 10;
      return {
        code,
        subject: skillSubject?.(code),
        questions: skillQuestions.get(code)!.size,
        studentsAssessed: cells.length,
        avgPct,
        level: levelFromPercent(avgPct, cuts),
        distribution: dist,
      };
    });

  return {
    skills,
    rows: Array.from(rows.values()).sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR')),
    examsUsed: Array.from(usedExams.values()),
    submissionsUsed: used,
    questionsWithoutSkill: noSkill.size,
  };
}

/** Turmas de uma série (e escola/turma, se escolhidas). */
export function classesForGrade(classes: SchoolClass[], grade: string, unitId: string, classId: string): SchoolClass[] {
  return classes.filter(
    (c) =>
      (!grade || gradeKey(c.gradeLevel) === grade) &&
      (unitId === 'ALL' || !unitId || c.schoolUnitId === unitId) &&
      (!classId || c.id === classId)
  );
}
