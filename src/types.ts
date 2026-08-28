export type StudentStatus = 'ACTIVE' | 'TRANSFERRED' | 'CONCLUDED' | 'SUSPENDED';

export interface Student {
  id: string;
  name: string;
  enrollmentNumber: string; // Matrícula / RA
  cpf: string;
  rg?: string;
  birthDate: string;
  gender: 'M' | 'F' | 'OTHER';
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  courseId: string;
  classId: string;
  status: StudentStatus;
  entryDate: string;
  photoUrl?: string;
  observations?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "3º Ano A - Ensino Médio"
  gradeLevel: string; // "3º Ano"
  segment: 'ENSINO_FUNDAMENTAL' | 'ENSINO_MEDIO' | 'EDUCACAO_INFANTIL' | 'TECNICO';
  shift: 'MANHÃ' | 'TARDE' | 'NOITE' | 'INTEGRAL';
  schoolYear: number;
  maxCapacity: number;
  roomNumber: string;
  classTeacher?: string;
}

export interface Course {
  id: string;
  name: string;
  segment: string;
  durationYears: number;
  description: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  segment: string;
  teacherName: string;
  workloadHours: number;
}

export interface AcademicRecordItem {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  workloadHours: number;
  bimonthlyGrades: {
    b1: number | null;
    b2: number | null;
    b3: number | null;
    b4: number | null;
  };
  recoveryGrade: number | null;
  finalGrade: number;
  totalAbsences: number;
  maxAllowedAbsences: number;
  status: 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'EM_ANDAMENTO';
}

export interface AcademicHistory {
  id: string;
  studentId: string;
  schoolYear: number;
  gradeLevel: string;
  schoolName: string;
  cityState: string;
  records: AcademicRecordItem[];
  generalAverage: number;
  attendanceRate: number;
  finalResult: 'APROVADO' | 'REPROVADO' | 'EM_CURSO';
  observations: string;
  issuedAt: string;
}

export type QuestionDifficulty = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY_KEYWORD';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  code: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  bnccSkill?: string; // Código de habilidade BNCC (e.g. EM13MAT301)
  difficulty: QuestionDifficulty;
  type: QuestionType;
  stem: string; // Enunciado
  options?: QuestionOption[];
  essayKeywords?: string[]; // Palavras-chave obrigatórias para correção automática de discursivas
  modelAnswer?: string;
  explanation: string;
  authorTeacher: string;
  tags: string[];
  createdAt: string;
}

export interface ExamQuestionConfig {
  questionId: string;
  points: number;
  timeLimitSeconds?: number; // Tempo de resposta por questão (opcional)
  customOrder?: number;
}

export interface AutoCorrectionRules {
  partialCreditForKeywords: boolean;
  caseSensitive: boolean;
  negativeMarking: boolean; // Penalidade por erro
  penaltyPerWrongOption: number;
  allowReviewAfterSubmission: boolean;
  showExplanationInstantly: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  classId: string;
  teacherName: string;
  schoolYear: number;
  term: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre' | 'Recuperação' | 'Simulado Geral';
  totalPoints: number;
  passingScore: number;
  timeLimitMinutes: number; // Tempo total da prova em minutos (0 = sem limite)
  timePerQuestionSeconds?: number; // Tempo individual configurado
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: ExamQuestionConfig[];
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'FINISHED' | 'ARCHIVED';
  autoCorrectionRules: AutoCorrectionRules;
  scheduledDate: string;
  dueDateTime: string;
  createdAt: string;
}

export interface ExamAnswer {
  questionId: string;
  selectedOptionId?: string;
  essayAnswerText?: string;
  timeSpentSeconds: number;
  isCorrect: boolean;
  earnedScore: number;
  feedback?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  classId: string;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  answers: ExamAnswer[];
  commonMistakesIdentified: string[];
  pedagogicalFeedback?: string;
  status: 'APROVADO' | 'REPROVADO';
}

export interface CommonQuestionError {
  questionId: string;
  questionCode: string;
  topic: string;
  questionStem: string;
  correctOptionText: string;
  mostChosenWrongOption: string;
  errorCount: number;
  totalAnswers: number;
  errorPercentage: number;
  bnccSkill?: string;
  pedagogicalDiagnostic: string;
  suggestedIntervention: string;
  mistakeDescription: string;
}

export interface QuestionStat {
  questionId: string;
  code: string;
  topic: string;
  correctPercentage: number;
  errorPercentage: number;
}

export interface StudentResultSummary {
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  score: number;
  maxScore: number;
  status: 'APROVADO' | 'REPROVADO';
  correctCount: number;
  timeSpentSeconds: number;
  mistakes: string[];
}

export interface PedagogicalReport {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  approvalRate: number;
  averageTimeSpentSeconds: number;
  commonErrors: CommonQuestionError[];
  questionStats: QuestionStat[];
  studentResults: StudentResultSummary[];
}

export interface SchoolSettings {
  name: string;
  tradeName: string;
  inepCode: string;
  cnpj: string;
  accreditationDecree: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  principalTitle: string;
  secretaryName: string;
  secretaryRegistration: string;
  logoUrl?: string;
  stampUrl?: string;
}

export interface SystemBackup {
  version: string;
  createdAt: string;
  exportedBy: string;
  data: {
    students: Student[];
    classes: SchoolClass[];
    subjects: Subject[];
    courses: Course[];
    questions: Question[];
    exams: Exam[];
    submissions: ExamSubmission[];
    academicHistories: AcademicHistory[];
    settings: SchoolSettings;
    notifications?: NotificationItem[];
    communications?: CommunicationMessage[];
    rolePreferences?: Record<UserRole, RoleNotificationPreferences>;
  };
}

export interface NetworkConfig {
  mode: 'STANDALONE' | 'SERVER' | 'CLIENT';
  serverHost: string;
  serverPort: number;
  clientStationName: string;
  autoSyncIntervalSeconds: number;
  lastConnectedAt?: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'TESTING';
}

export interface DeveloperContact {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  location: string;
  supportAvailability: string;
  license: string;
  systemVersion: string;
  changelog: {
    version: string;
    date: string;
    highlights: string[];
  }[];
}

/* ==========================================================================
   SISTEMA DE NOTIFICAÇÕES & MÓDULO DE COMUNICAÇÃO
   ========================================================================== */

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type NotificationType =
  | 'ENROLLMENT_STATUS'      // Matrículas aprovadas / recusadas / pendentes
  | 'EXAM_AVAILABLE'        // Novas avaliações disponíveis
  | 'DEADLINE_ALERT'        // Prazos de entrega de provas e documentos
  | 'EXAM_RESULT'           // Resultados e notas de provas corrigidas
  | 'IMPORTANT_ANNOUNCEMENT' // Comunicados importantes da diretoria/coordenação
  | 'DIRECT_MESSAGE';       // Mensagem direta de professores ou secretaria

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetRoles: UserRole[];
  targetUserId?: string;
  targetClassId?: string;
  actionTab?: string;
  actionLabel?: string;
  actionPayload?: Record<string, any>;
  createdAt: string;
  read: boolean;
  readAt?: string;
  metadata?: {
    studentId?: string;
    studentName?: string;
    examId?: string;
    examTitle?: string;
    score?: number;
    deadlineDate?: string;
    senderName?: string;
    announcementId?: string;
  };
}

export interface RoleNotificationPreferences {
  role: UserRole;
  channels: {
    inApp: boolean;
    browserPush: boolean;
    email: boolean;
    smsWhatsapp: boolean;
  };
  categories: {
    enrollmentStatus: boolean;
    examAvailable: boolean;
    deadlines: boolean;
    examResults: boolean;
    announcements: boolean;
    directMessages: boolean;
  };
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface CommunicationAttachment {
  id: string;
  name: string;
  sizeFormatted: string;
  type: 'PDF' | 'IMAGE' | 'DOC' | 'ZIP';
  url: string;
}

export interface ReadConfirmation {
  userId: string;
  userName: string;
  userRole: UserRole;
  confirmedAt: string;
}

export interface CommunicationMessage {
  id: string;
  title: string;
  content: string;
  senderRole: UserRole;
  senderName: string;
  senderTitle?: string;
  senderAvatar?: string;
  recipientType: 'ALL' | 'ROLE' | 'CLASS' | 'INDIVIDUAL';
  targetRoles: UserRole[];
  targetClassId?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  priority: 'NORMAL' | 'URGENTE' | 'INFORMATIVO';
  category: 'GERAL' | 'PEDAGOGICO' | 'SECRETARIA_FINANCEIRO' | 'EVENTO' | 'URGENTE';
  attachments: CommunicationAttachment[];
  sendPushNotification: boolean;
  requireReadConfirmation: boolean;
  readConfirmations: ReadConfirmation[];
  status: 'ENVIADO' | 'RASCUNHO' | 'PROGRAMADO';
  createdAt: string;
}
