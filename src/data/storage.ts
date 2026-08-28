import {
  Student,
  SchoolClass,
  Subject,
  Course,
  Question,
  Exam,
  ExamSubmission,
  ExamAnswer,
  AcademicHistory,
  SchoolSettings,
  DeveloperContact,
  NetworkConfig,
  PedagogicalReport,
  CommonQuestionError,
  QuestionStat,
  StudentResultSummary,
  SystemBackup,
  NotificationItem,
  CommunicationMessage,
  RoleNotificationPreferences,
  UserRole,
} from '../types';
import {
  DEFAULT_STUDENTS,
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS,
  DEFAULT_COURSES,
  DEFAULT_QUESTIONS,
  DEFAULT_EXAMS,
  DEFAULT_SUBMISSIONS,
  DEFAULT_ACADEMIC_HISTORIES,
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_DEVELOPER_CONTACT,
  DEFAULT_SERVER_CONFIG,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_COMMUNICATIONS,
  DEFAULT_ROLE_PREFERENCES,
} from './defaultData';

const KEYS = {
  DATA: 'edugestao_master_store_v4',
  STUDENTS: 'edugestao_students_v4',
  CLASSES: 'edugestao_classes_v4',
  SUBJECTS: 'edugestao_subjects_v4',
  COURSES: 'edugestao_courses_v4',
  QUESTIONS: 'edugestao_questions_v4',
  EXAMS: 'edugestao_exams_v4',
  SUBMISSIONS: 'edugestao_submissions_v4',
  HISTORIES: 'edugestao_histories_v4',
  SETTINGS: 'edugestao_settings_v4',
  SERVER_CONFIG: 'edugestao_server_config_v4',
  NOTIFICATIONS: 'edugestao_notifications_v4',
  COMMUNICATIONS: 'edugestao_communications_v4',
  ROLE_PREFS: 'edugestao_role_prefs_v4',
};

export interface AppStateData {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  courses: Course[];
  questions: Question[];
  exams: Exam[];
  submissions: ExamSubmission[];
  academicHistories: AcademicHistory[];
  settings: SchoolSettings;
  notifications: NotificationItem[];
  communications: CommunicationMessage[];
  rolePreferences: Record<UserRole, RoleNotificationPreferences>;
}

/**
 * Loads entire master application state from local storage or seeds with default mock data
 */
export function getStoredData(): AppStateData {
  const raw = localStorage.getItem(KEYS.DATA);
  if (!raw) {
    const initial: AppStateData = {
      students: DEFAULT_STUDENTS,
      classes: DEFAULT_CLASSES,
      subjects: DEFAULT_SUBJECTS,
      courses: DEFAULT_COURSES,
      questions: DEFAULT_QUESTIONS,
      exams: DEFAULT_EXAMS,
      submissions: DEFAULT_SUBMISSIONS,
      academicHistories: DEFAULT_ACADEMIC_HISTORIES,
      settings: DEFAULT_SCHOOL_SETTINGS,
      notifications: DEFAULT_NOTIFICATIONS,
      communications: DEFAULT_COMMUNICATIONS,
      rolePreferences: DEFAULT_ROLE_PREFERENCES,
    };
    saveStoredData(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      students: parsed.students || DEFAULT_STUDENTS,
      classes: parsed.classes || DEFAULT_CLASSES,
      subjects: parsed.subjects || DEFAULT_SUBJECTS,
      courses: parsed.courses || DEFAULT_COURSES,
      questions: parsed.questions || DEFAULT_QUESTIONS,
      exams: parsed.exams || DEFAULT_EXAMS,
      submissions: parsed.submissions || DEFAULT_SUBMISSIONS,
      academicHistories: parsed.academicHistories || DEFAULT_ACADEMIC_HISTORIES,
      settings: parsed.settings || DEFAULT_SCHOOL_SETTINGS,
      notifications: parsed.notifications || DEFAULT_NOTIFICATIONS,
      communications: parsed.communications || DEFAULT_COMMUNICATIONS,
      rolePreferences: parsed.rolePreferences || DEFAULT_ROLE_PREFERENCES,
    };
  } catch {
    return {
      students: DEFAULT_STUDENTS,
      classes: DEFAULT_CLASSES,
      subjects: DEFAULT_SUBJECTS,
      courses: DEFAULT_COURSES,
      questions: DEFAULT_QUESTIONS,
      exams: DEFAULT_EXAMS,
      submissions: DEFAULT_SUBMISSIONS,
      academicHistories: DEFAULT_ACADEMIC_HISTORIES,
      settings: DEFAULT_SCHOOL_SETTINGS,
      notifications: DEFAULT_NOTIFICATIONS,
      communications: DEFAULT_COMMUNICATIONS,
      rolePreferences: DEFAULT_ROLE_PREFERENCES,
    };
  }
}

/**
 * Persists entire master application state
 */
export function saveStoredData(data: AppStateData): void {
  try {
    localStorage.setItem(KEYS.DATA, JSON.stringify(data));
  } catch (e) {
    console.error('Falha ao persistir dados locais:', e);
  }
}

/**
 * Performs instant automatic correction of an exam submission based on question types and rules
 */
export function gradeExamSubmission(
  exam: Exam,
  questions: Question[],
  rawAnswers: ExamAnswer[],
  studentId: string
): ExamSubmission {
  const questionMap = new Map<string, Question>(questions.map((q) => [q.id, q]));
  const gradedAnswers: ExamAnswer[] = [];
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let totalTimeSpent = 0;
  const commonMistakes: string[] = [];

  const appData = getStoredData();
  const student = appData.students.find((s) => s.id === studentId) || {
    id: studentId,
    name: 'Estudante Avaliado',
    enrollmentNumber: 'RA-0000',
    classId: exam.classId,
  };

  exam.questions.forEach((qConfig) => {
    const q = questionMap.get(qConfig.questionId);
    const maxPoints = qConfig.points;
    maxScore += maxPoints;

    const studentAns = rawAnswers.find((a) => a.questionId === qConfig.questionId);
    const timeSpent = studentAns?.timeSpentSeconds || 60;
    totalTimeSpent += timeSpent;

    if (!q) {
      gradedAnswers.push({
        questionId: qConfig.questionId,
        timeSpentSeconds: timeSpent,
        isCorrect: false,
        earnedScore: 0,
        feedback: 'Item avaliativo não encontrado no acervo.',
      });
      incorrectCount++;
      return;
    }

    let isCorrect = false;
    let earnedScore = 0;
    let feedback = '';

    if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
      const selectedOptId = studentAns?.selectedOptionId;
      const correctOpt = q.options?.find((o) => o.isCorrect);
      const selectedOpt = q.options?.find((o) => o.id === selectedOptId);

      if (selectedOpt && selectedOpt.isCorrect) {
        isCorrect = true;
        earnedScore = maxPoints;
        feedback = selectedOpt.explanation || 'Alternativa correta! Excelente raciocínio.';
        correctCount++;
      } else {
        isCorrect = false;
        earnedScore = 0;
        incorrectCount++;

        if (exam.autoCorrectionRules.negativeMarking && exam.autoCorrectionRules.penaltyPerWrongOption) {
          earnedScore = -Math.abs(exam.autoCorrectionRules.penaltyPerWrongOption);
        }

        if (selectedOpt) {
          feedback = selectedOpt.explanation || `Incorreta. O gabarito oficial é: ${correctOpt?.text || 'Correta'}.`;
          commonMistakes.push(`Questão ${q.code} (${q.topic}): Selecionou distrator - ${selectedOpt.text.substring(0, 60)}`);
        } else {
          feedback = `Questão em branco. Resposta correta: ${correctOpt?.text || 'Gabarito oficial'}.`;
          commonMistakes.push(`Questão ${q.code} (${q.topic}): Deixada sem resposta.`);
        }
      }

      gradedAnswers.push({
        questionId: q.id,
        selectedOptionId: selectedOptId,
        timeSpentSeconds: timeSpent,
        isCorrect,
        earnedScore: Math.max(0, earnedScore),
        feedback,
      });
    } else if (q.type === 'ESSAY_KEYWORD') {
      const text = (studentAns?.essayAnswerText || '').trim();
      const keywords = q.essayKeywords || [];

      if (!text) {
        gradedAnswers.push({
          questionId: q.id,
          essayAnswerText: '',
          timeSpentSeconds: timeSpent,
          isCorrect: false,
          earnedScore: 0,
          feedback: 'Questão discursiva deixada em branco.',
        });
        incorrectCount++;
        commonMistakes.push(`Questão Discursiva ${q.code} (${q.topic}): Sem resposta redigida.`);
      } else {
        const lowerText = exam.autoCorrectionRules.caseSensitive ? text : text.toLowerCase();
        const matchedKeywords: string[] = [];
        const missingKeywords: string[] = [];

        keywords.forEach((kw) => {
          const target = exam.autoCorrectionRules.caseSensitive ? kw : kw.toLowerCase();
          if (lowerText.includes(target)) {
            matchedKeywords.push(kw);
          } else {
            missingKeywords.push(kw);
          }
        });

        const keywordRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 1;

        if (keywordRatio >= 0.75) {
          isCorrect = true;
          earnedScore = maxPoints * (exam.autoCorrectionRules.partialCreditForKeywords ? keywordRatio : 1);
          feedback = `Resposta satisfatória! Palavras-chave contempladas: ${matchedKeywords.join(', ')}.`;
          correctCount++;
        } else if (keywordRatio > 0 && exam.autoCorrectionRules.partialCreditForKeywords) {
          isCorrect = false;
          earnedScore = Number((maxPoints * keywordRatio).toFixed(2));
          feedback = `Resposta parcialmente correta (${(keywordRatio * 100).toFixed(0)}%). Termos identificados: ${matchedKeywords.join(', ')}. Termos ausentes: ${missingKeywords.join(', ')}.`;
          incorrectCount++;
          commonMistakes.push(`Discursiva ${q.code}: Omissão de conceitos-chave (${missingKeywords.join(', ')}).`);
        } else {
          isCorrect = false;
          earnedScore = 0;
          feedback = `Resposta insuficiente. Modelo de resposta oficial: ${q.modelAnswer || q.explanation}`;
          incorrectCount++;
          commonMistakes.push(`Discursiva ${q.code}: Não contemplou os conceitos essenciais exigidos.`);
        }

        gradedAnswers.push({
          questionId: q.id,
          essayAnswerText: text,
          timeSpentSeconds: timeSpent,
          isCorrect,
          earnedScore: Math.max(0, Number(earnedScore.toFixed(2))),
          feedback,
        });
      }
    }

    totalScore += Math.max(0, earnedScore);
  });

  totalScore = Number(totalScore.toFixed(2));
  const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(1)) : 0;
  const isApproved = totalScore >= exam.passingScore;

  let pedagogicalFeedback = '';
  if (percentage >= 90) {
    pedagogicalFeedback = 'Desempenho excelente! Demonstrou domínio superior dos conceitos avaliados.';
  } else if (percentage >= 70) {
    pedagogicalFeedback = 'Bom desempenho. O estudante atingiu os objetivos pedagógicos essenciais.';
  } else if (percentage >= 50) {
    pedagogicalFeedback = 'Desempenho regular. Recomenda-se revisão direcionada nos tópicos com erro.';
  } else {
    pedagogicalFeedback = 'Desempenho insatisfatório. Necessita de acompanhamento pedagógico e plano de recuperação.';
  }

  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    examId: exam.id,
    studentId: student.id,
    studentName: student.name,
    enrollmentNumber: student.enrollmentNumber,
    classId: student.classId,
    startedAt: new Date(Date.now() - totalTimeSpent * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
    timeSpentSeconds: totalTimeSpent,
    totalScore,
    maxScore,
    percentage,
    correctCount,
    incorrectCount,
    answers: gradedAnswers,
    commonMistakesIdentified: commonMistakes,
    pedagogicalFeedback,
    status: isApproved ? 'APROVADO' : 'REPROVADO',
  };
}

/**
 * Generates an aggregated pedagogical report analyzing common errors, distractor frequency, and student outcomes
 */
export function generatePedagogicalReport(
  exam: Exam,
  questions: Question[],
  students: Student[],
  submissions: ExamSubmission[]
): PedagogicalReport {
  const examSubmissions = submissions.filter((s) => s.examId === exam.id);
  const questionMap = new Map<string, Question>(questions.map((q) => [q.id, q]));
  const studentMap = new Map<string, Student>(students.map((s) => [s.id, s]));

  const totalSubs = examSubmissions.length || 1;
  const scores = examSubmissions.map((s) => s.totalScore);
  const averageScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const approvedCount = examSubmissions.filter((s) => s.totalScore >= exam.passingScore).length;
  const approvalRate = Number(((approvedCount / totalSubs) * 100).toFixed(1));
  const avgTime =
    scores.length > 0
      ? Math.round(examSubmissions.reduce((a, b) => a + b.timeSpentSeconds, 0) / totalSubs)
      : 1200;

  // Compute question hit rate stats and common distractor errors
  const commonErrors: CommonQuestionError[] = [];
  const questionStats: QuestionStat[] = [];

  exam.questions.forEach((qConfig) => {
    const q = questionMap.get(qConfig.questionId);
    if (!q) return;

    let correctForThisQ = 0;
    const wrongDistractorCounts: Record<string, number> = {};

    examSubmissions.forEach((sub) => {
      const ans = sub.answers.find((a) => a.questionId === q.id);
      if (ans?.isCorrect) {
        correctForThisQ++;
      } else {
        if (ans?.selectedOptionId) {
          wrongDistractorCounts[ans.selectedOptionId] = (wrongDistractorCounts[ans.selectedOptionId] || 0) + 1;
        }
      }
    });

    const correctPct = Number(((correctForThisQ / totalSubs) * 100).toFixed(0));
    const errorPct = 100 - correctPct;

    questionStats.push({
      questionId: q.id,
      code: q.code,
      topic: q.topic,
      correctPercentage: correctPct,
      errorPercentage: errorPct,
    });

    // Find most selected wrong option
    let mostChosenOptionText = 'Respostas discursivas incompletas ou em branco';
    let highestCount = 0;

    Object.entries(wrongDistractorCounts).forEach(([optId, count]) => {
      if (count > highestCount) {
        highestCount = count;
        const opt = q.options?.find((o) => o.id === optId);
        if (opt) {
          mostChosenOptionText = `Alternativa: "${opt.text}" (${opt.explanation || 'Distrator conceitual'})`;
        }
      }
    });

    const correctOpt = q.options?.find((o) => o.isCorrect);

    if (errorPct >= 25) {
      commonErrors.push({
        questionId: q.id,
        questionCode: q.code,
        topic: q.topic,
        questionStem: q.stem,
        correctOptionText: correctOpt?.text || q.modelAnswer || 'Gabarito Oficial',
        mostChosenWrongOption: mostChosenOptionText,
        errorCount: totalSubs - correctForThisQ,
        totalAnswers: totalSubs,
        errorPercentage: errorPct,
        bnccSkill: q.bnccSkill,
        pedagogicalDiagnostic: `Índice de erro de ${errorPct}%. Os alunos tenderam a assinalar o distrator: ${mostChosenOptionText}.`,
        suggestedIntervention: `Realizar aula de nivelamento com foco em "${q.topic}" abordando a resolução guiada de itens similares.`,
        mistakeDescription: `Erro predominante no tópico "${q.topic}": ${mostChosenOptionText}`,
      });
    }
  });

  // Individual student summaries
  const studentResults: StudentResultSummary[] = examSubmissions.map((sub) => {
    const student = studentMap.get(sub.studentId);
    return {
      studentId: sub.studentId,
      studentName: sub.studentName || student?.name || 'Estudante',
      enrollmentNumber: sub.enrollmentNumber || student?.enrollmentNumber || 'RA-000',
      score: sub.totalScore,
      maxScore: sub.maxScore,
      status: sub.totalScore >= exam.passingScore ? 'APROVADO' : 'REPROVADO',
      correctCount: sub.correctCount,
      timeSpentSeconds: sub.timeSpentSeconds,
      mistakes: sub.commonMistakesIdentified || [],
    };
  });

  return {
    id: `rep-${exam.id}-${Date.now()}`,
    examId: exam.id,
    examTitle: exam.title,
    subject: exam.subject,
    totalSubmissions: examSubmissions.length,
    averageScore,
    highestScore,
    lowestScore,
    approvalRate,
    averageTimeSpentSeconds: avgTime,
    commonErrors,
    questionStats,
    studentResults,
  };
}

/**
 * Creates full system backup snapshot
 */
export function createBackup(): SystemBackup {
  const current = getStoredData();
  return {
    version: '2.4.0',
    createdAt: new Date().toISOString(),
    exportedBy: 'Secretaria Geral EduGestão Pro',
    data: current,
  };
}

/**
 * Restores entire system state from a backup object
 */
export function restoreBackup(backup: SystemBackup): void {
  if (backup && backup.data) {
    saveStoredData({
      students: backup.data.students || [],
      classes: backup.data.classes || [],
      subjects: backup.data.subjects || [],
      courses: backup.data.courses || [],
      questions: backup.data.questions || [],
      exams: backup.data.exams || [],
      submissions: backup.data.submissions || [],
      academicHistories: backup.data.academicHistories || [],
      settings: backup.data.settings,
      notifications: backup.data.notifications || DEFAULT_NOTIFICATIONS,
      communications: backup.data.communications || DEFAULT_COMMUNICATIONS,
      rolePreferences: backup.data.rolePreferences || DEFAULT_ROLE_PREFERENCES,
    });
  }
}

export const StorageService = {
  getStoredData,
  saveStoredData,
  gradeExamSubmission,
  generatePedagogicalReport,
  createBackup,
  restoreBackup,
};
