export type StudentStatus = 'ACTIVE' | 'TRANSFERRED' | 'CONCLUDED' | 'SUSPENDED' | 'EVADIDO';

export type CadastralStatus = 'OK' | 'PENDING_DOCS' | 'INCOMPLETE' | 'NEEDS_UPDATE';

export type RaceColorType =
  | 'BRANCA'
  | 'PARDA'
  | 'PRETA'
  | 'AMARELA'
  | 'INDIGENA'
  | 'NAO_DECLARADA'
  | 'BRANCO'
  | 'PARDO'
  | 'NEGRO'
  | 'AMARELO'
  | 'INDIGINA';

export type StudentColorRace = RaceColorType;

export type SpecialConditionType =
  | 'TEA'                       // Transtorno do Espectro Autista
  | 'TDAH'                      // Transtorno de Déficit de Atenção e Hiperatividade
  | 'DEFICIENCIA_INTELECTUAL'   // Deficiência Intelectual
  | 'DEFICIENCIA_FISICA'        // Deficiência Física / Motora
  | 'DEFICIENCIA_VISUAL'        // Cegueira / Baixa Visão
  | 'DEFICIENCIA_AUDITIVA'      // Surdez / Deficiência Auditiva
  | 'ALTAS_HABILIDADES'         // Altas Habilidades / Superdotação
  | 'SINDROME_DOWN'             // Síndrome de Down
  | 'MEDICACAO_CONTINUA'        // Uso de Medicamento Contínuo
  | 'ALERGIA_GRAVE'             // Alergia Grave / Restrição Alimentar
  | 'OUTRA';                    // Outras condições

export type LocationZone = 'ZONA_URBANA' | 'ZONA_RURAL' | 'URBANA' | 'RURAL';

export type ClassShift = 'MATUTINO' | 'VESPERTINO' | 'NOTURNO' | 'INTEGRAL' | 'MANHÃ' | 'TARDE' | 'NOITE';

export type EducationGradeLevel =
  | 'BERCARIO'
  | 'MATERNAL_I'
  | 'MATERNAL_II'
  | 'PRE_I'
  | 'PRE_II'
  | '1_ANO'
  | '2_ANO'
  | '3_ANO'
  | '4_ANO'
  | '5_ANO'
  | '6_ANO'
  | '7_ANO'
  | '8_ANO'
  | '9_ANO'
  | '1_ANO_MEDIO'
  | '2_ANO_MEDIO'
  | '3_ANO_MEDIO'
  | 'EJA';

export type EducationSegment =
  | 'EDUCACAO_INFANTIL'
  | 'ENSINO_FUNDAMENTAL_I'
  | 'ENSINO_FUNDAMENTAL_II'
  | 'ENSINO_FUNDAMENTAL'
  | 'ENSINO_MEDIO'
  | 'EJA'
  | 'TECNICO';

export type DropoutReasonKey =
  | 'MUDANCA_MUNICIPIO_ZONA'     // Mudança de Município/Zona Rural sem transferência formal
  | 'TRABALHO_INFANTIL_RENDA'     // Inserção no Mercado de Trabalho / Ajuda na Renda Familiar
  | 'TRANSPORTE_DISTANCIA'        // Dificuldades de Acesso / Falta de Transporte Escolar Rural
  | 'DESINTERESSE_DESEMPENHO'     // Desinteresse / Dificuldades de Aprendizagem Acumuladas
  | 'DESINTERESSE'                // Alias de desinteresse
  | 'GRAVIDEZ_CUIDADO_FAMILIAR'   // Gravidez Precoce / Cuidados com Irmãos ou Parentes
  | 'SAUDE_DOENCA_CRONICA'        // Problemas de Saúde / Doença Crônica do Aluno ou Familiar
  | 'VIOLENCIA_VULNERABILIDADE'   // Vulnerabilidade Social Extrema / Violência Comunitária
  | 'FALTA_DOCUMENTACAO'          // Impedimento por Documentação Civil Incompleta
  | 'OUTROS';                     // Outros motivos justificados

export type ActiveSearchStatus =
  | 'EM_BUSCA_ATIVA'              // Em processo de busca ativa pela equipe
  | 'RESGATADO_REINSERIDO'        // Aluno resgatado e reinserido na escola com sucesso
  | 'MUDANCA_CONFIRMADA'          // Família confirmou mudança de endereço/cidade
  | 'NAO_LOCALIZADO'              // Aluno/família não localizados no endereço
  | 'ENCAMINHADO_CONSELHO'        // Encaminhado ao Conselho Tutelar / CRAS / CREAS
  | 'ARQUIVADO';                  // Processo finalizado / arquivado

export interface ActiveSearchContactAttempt {
  id: string;
  date: string;
  type: 'TELEFONE' | 'WHATSAPP' | 'VISITA_DOMICILIAR' | 'CARTA_CONVOCACAO' | 'REUNIAO_SME';
  agentName: string;
  outcome: string;
  successful: boolean;
}

export interface DropoutIntervention {
  searchStatus: ActiveSearchStatus;
  responsibleAgent: string;
  caseOpenedDate: string;
  lastContactDate?: string;
  contactAttempts: ActiveSearchContactAttempt[];
  conselhoTutelarNotified: boolean;
  conselhoTutelarProtocol?: string;
  crasNotified: boolean;
  actionsTaken: string;
  resolutionDate?: string;
  resolutionNotes?: string;
}

export interface Student {
  id: string;
  name: string;
  enrollmentNumber: string; // Matrícula / RA
  cpf: string;
  rg?: string;
  birthDate: string;
  gender: 'M' | 'F' | 'OTHER';
  raceColor?: RaceColorType; // Cor / Raça / Etnia (Censo Escolar / IBGE)
  colorRace?: StudentColorRace;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  locationZone?: LocationZone; // Zona Urbana ou Rural de residência
  courseId: string;
  classId: string;
  gradeLevel?: string;
  schoolUnitId?: string; // Unidade Escolar onde está matriculado
  inepCode?: string; // Código INEP do Aluno (Censo Escolar)
  status: StudentStatus;
  cadastralStatus?: CadastralStatus; // Situação do Cadastro (OK, Pendência de Documentos, etc.)
  entryDate: string;
  photoUrl?: string;
  observations?: string;

  // Observações Médicas & Necessidades Especiais (Inclusão & Censo)
  medicalObservations?: string;
  medicalClassification?: string; // Classificação Médica / PCD (ex: 'Autismo', 'Baixa Visão', 'PCD')
  hasMedicalReport?: boolean; // Se tem laudo (true / false)
  medicalReportText?: string; // 'SIM' | 'NÃO' | 'PENDENTE' | '*****'
  cidCodes?: string[]; // Códigos CID (ex: ['F84.0', 'F90.0'])
  specialConditions?: SpecialConditionType[];
  specialNeeds?: string[];
  hasAEE?: boolean; // Atendimento Educacional Especializado / Sala de Recursos
  hasAeeSupport?: boolean;
  needsCaregiver?: boolean; // Necessita de Cuidador / Monitor Escolar
  bloodType?: string;

  // Informações de Polo / Unidade e Importação de Planilhas
  schoolOriginName?: string; // Nome da Escola da Planilha / Polo (ex: 'MARIA DA PRAIA')
  pendingFields?: string[]; // Lista de pendências cadastrais para o Censo (ex: ['CPF', 'Laudo', 'Endereço'])
  shift?: ClassShift | string; // Turno (Manhã, Tarde, Integral, Noite)
  series?: string; // Série de referência da planilha (ex: 'PRÉ II', '1º AO 5º')
  importedAt?: string; // Data da importação

  // Campos específicos para Evasão Escolar & Censo Educacional Municipal
  dropoutReason?: DropoutReasonKey;
  dropoutDate?: string;
  dropoutObservation?: string;
  dropoutIntervention?: DropoutIntervention;
  enrollmentYear?: number;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "1º Ano A - Ensino Fundamental"
  gradeLevel: string; // "1º Ano", "EDUCAÇÃO INFANTIL - Pré II", etc.
  segment: EducationSegment | string;
  shift: ClassShift;
  schoolYear: number;
  maxCapacity: number;
  capacity?: number;
  code?: string;
  roomNumber: string;
  classTeacher?: string;
  schoolUnitId?: string; // Unidade Escolar
}

/* ==========================================================================
   HABILIDADES BNCC (BASE NACIONAL COMUM CURRICULAR)
   ========================================================================== */

export interface BnccSkill {
  id: string;
  code: string; // Ex: "EF01LP01", "EF05MA03", "EI02TS01", "EF09CI04"
  educationLevel: string; // "Educação Infantil", "1º Ano", "2º Ano", ..., "9º Ano", "Ensino Médio"
  segment: EducationSegment | string;
  subject: string; // "Língua Portuguesa", "Matemática", "Ciências", "História", "Geografia", "Arte", "Educação Física", "Campos de Experiências"
  fieldOfExperience?: string; // Para Educação Infantil (ex: "Traços, sons, cores e formas")
  knowledgeObject?: string; // Objeto de conhecimento
  description: string;
  tags?: string[];
}

/** Níveis de desenvolvimento de uma habilidade BNCC (escala usada nos relatórios descritivos). */
export type BnccMasteryLevel = 1 | 2 | 3 | 4;

/** Lançamento de uma habilidade BNCC para um aluno em um bimestre. */
export interface BnccSkillAssessment {
  id: string;
  studentId: string;
  classId: string;
  schoolUnitId?: string;
  skillCode: string;
  subject: string;
  schoolYear: number;
  term: number; // 1 a 4 (bimestre)
  level: BnccMasteryLevel;
  notes?: string;
  teacherName?: string;
  updatedAt: string;
}

/* ==========================================================================
   NORMATIVAS DAS SECRETARIAS ESTADUAIS DE EDUCAÇÃO (SEDUC / SEE)
   ========================================================================== */

export interface StateEducationRegulation {
  id: string;
  stateCode: string; // "SP", "RJ", "MG", "BA", "CE", "PR", "RS", "GO", "PE", "MA", "PA", "PB", "NACIONAL"
  stateName: string;
  regulationTitle: string; // Ex: "Resolução SEDUC/SP nº 48/2023 - Normas Gerais da Educação Básica"
  legislationNumber: string; // Ex: "Resolução SEDUC 48/2023"
  minAttendancePercentage: number; // Ex: 75%
  minInfantileAttendancePercentage: number; // Ex: 60%
  termType: 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL';
  termsCount: number; // Ex: 4 bimestres
  minAnnualSchoolDays: number; // Ex: 200 dias letivos
  minAnnualWorkloadHours: number; // Ex: 800 horas
  consecutiveAbsencesAlert: number; // Alerta de faltas consecutivas (ex: 5 dias)
  alternateAbsencesAlertPercent: number; // Alerta de faltas alternadas (ex: 15% da carga horária)
  allowMedicalJustification: boolean;
  requiresBnccRegistrationInDiary: boolean;
  conselhoTutelarNotificationRule: string;
  customNotes?: string;
  isCustomImported?: boolean;
}

/* ==========================================================================
   DIÁRIO DE CLASSE & FREQUÊNCIA ESCOLAR
   ========================================================================== */

export type AttendanceStatus = 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';

export interface StudentAttendanceEntry {
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  status: AttendanceStatus;
  justificationReason?: string;
  medicalCertificateProtocol?: string;
}

export interface AttendanceSheet {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  schoolUnitId?: string;
  teacherName: string;
  lessonNumber: number; // 1ª aula, 2ª aula, etc.
  term: string; // "1º Bimestre", "2º Bimestre", etc.
  entries: StudentAttendanceEntry[];
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  attendanceRate: number; // %
  createdAt: string;
  updatedAt: string;
}

export interface LessonDiaryRegistry {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  schoolUnitId?: string;
  teacherName: string;
  lessonCount: number; // Quantidade de aulas dadas no dia
  term: string;
  contentTaught: string; // Conteúdo programático desenvolvido
  bnccSkillCodes: string[]; // Códigos de habilidades BNCC desenvolvidas
  methodology: string; // Metodologia / Estratégia didática
  homework?: string; // Tarefas / Atividades extraclasse
  pedagogicalObservations?: string; // Observações da turma
  occurrences?: string; // Ocorrências disciplinares ou individuais
  status: 'RASCUNHO' | 'HOMOLOGADO_PROFESSOR' | 'VALIDADO_COORDENACAO';
  signedByTeacherAt?: string;
  validatedByCoordinatorAt?: string;
  coordinatorName?: string;
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
  classId?: string;
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
  status: 'APROVADO' | 'REPROVADO_NOTA' | 'REPROVADO_FALTA' | 'EM_ANDAMENTO' | 'RECUPERACAO';
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
  subjectId?: string; // Chave estrangeira para Subject.id (ex: sub-mat)
  topic: string;
  gradeLevel: string;
  bnccSkill?: string; // Código(s) de habilidade BNCC; várias separadas por vírgula (ex.: "EF05MA01, EF05MA02")
  bnccSkills?: string[]; // Lista de habilidades da questão (bnccSkill guarda a mesma lista em texto)
  difficulty: QuestionDifficulty;
  type: QuestionType;
  stem: string; // Enunciado
  options?: QuestionOption[];
  essayKeywords?: (string | { keyword: string; points: number; required?: boolean })[]; // Palavras-chave para correção de discursivas
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
  subjectId?: string; // Chave estrangeira para Subject.id (ex: sub-mat)
  classId: string;
  teacherName: string;
  schoolYear: number;
  term: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre' | 'Recuperação' | 'Simulado Geral';
  totalPoints: number;
  totalScore?: number;
  passingScore: number;
  timeLimitMinutes: number; // Tempo total da prova em minutos (0 = sem limite)
  timePerQuestionSeconds?: number; // Tempo individual configurado
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: ExamQuestionConfig[];
  questionIds?: string[];
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
  schoolName?: string;
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
  directorName?: string;
  coordinatorName?: string;
  principalTitle: string;
  secretaryName: string;
  secretaryRegistration: string;
  logoUrl?: string;
  managementLogoUrl?: string;
  stampUrl?: string;
  systemVersion?: string;
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

export interface AutoBackupSnapshot {
  id: string;
  createdAt: string;
  reason: string;
  operatorName: string;
  version: string;
  checksum: string;
  stats: {
    studentsCount: number;
    classesCount: number;
    examsCount: number;
    submissionsCount: number;
    attendanceSheetsCount: number;
    lessonRegistriesCount: number;
    classGradeSheetsCount: number;
  };
  fileSizeBytes: number;
  data: any;
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
  developerName?: string;
  role?: string;
  roleTitle?: string;
  company?: string;
  cnpj?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  location?: string;
  supportAvailability?: string;
  license?: string;
  systemVersion?: string;
  companyLogoUrl?: string;
  customNotes?: string;
  changelog?: {
    version: string;
    date: string;
    highlights: string[];
  }[];
}

/* ==========================================================================
   CONTROLE DE ACESSO, SETORES & USUÁRIOS (CADASTRO MESTRE)
   ========================================================================== */

export type UserSector =
  | 'MASTER'
  | 'DIRETORIA'
  | 'COORDENACAO'
  | 'SECRETARIA'
  | 'PROFESSOR'
  | 'GESTOR_MUNICIPAL'
  | 'ALUNO'
  | 'RESPONSAVEL';

export interface ModulePermission {
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export type SystemModuleKey =
  | 'dashboard'
  | 'secretaria'
  | 'turmas'
  | 'diarioClasse'
  | 'portalProfessor'
  | 'documentos'
  | 'comunicacao'
  | 'questoes'
  | 'provas'
  | 'relatorios'
  | 'gestaoMunicipal'
  | 'usuarios'
  | 'configuracoes';

export interface UserAccount {
  id: string;
  name: string;
  login: string;
  username?: string;
  password?: string;
  email: string;
  phone?: string;
  role: UserRole;
  sector: UserSector;
  sectorTitle: string;
  department?: string;
  roleTitle?: string;
  schoolUnitId?: string;
  schoolUnitName?: string;
  isMaster: boolean;
  active: boolean;
  /** Conta recebida da tabela user_accounts do Supabase: exige login na nuvem no primeiro acesso. */
  cloudSynced?: boolean;
  avatarUrl?: string;
  permissions: Record<SystemModuleKey, ModulePermission>;
  createdAt: string;
  lastLogin?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const ROLES = {
  ADMIN: 'ADMIN' as UserRole,
  TEACHER: 'TEACHER' as UserRole,
  STUDENT: 'STUDENT' as UserRole,
  PARENT: 'PARENT' as UserRole,
  GUEST: 'GUEST' as UserRole,
} as const;

/* ==========================================================================
   SISTEMA DE NOTIFICAÇÕES & MÓDULO DE COMUNICAÇÃO
   ========================================================================== */

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'GUEST';

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
    [key: string]: any;
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

// =========================================================================
// GESTÃO MUNICIPAL, POLO REMOTO & CENSO EDUCACIONAL
// =========================================================================

export type SchoolUnitType =
  | 'SEDE_CENTRAL'
  | 'ESCOLA_POLO'
  | 'ESCOLA_SATELITE'
  | 'ESCOLA_RURAL'
  | 'CRECHE_INFANTIL';

export interface SchoolUnit {
  id: string;
  name: string;
  tradeName?: string;
  inepCode: string;
  cnpjOrDecree?: string;
  type: SchoolUnitType;
  locationZone: LocationZone; // ZONA URBANA ou ZONA RURAL
  zone?: LocationZone | string;
  district: string; // Bairro / Distrito
  address: string;
  zipCode?: string;
  city?: string;
  state?: string;
  directorName: string;
  coordinatorName?: string;
  secretaryName?: string;
  phone: string;
  email: string;
  totalClassrooms?: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  lastSyncDate?: string;
  syncStatus: 'SINCRONIZADO' | 'PENDENTE' | 'NUNCA_SINCRONIZADO';
  hasInternet: boolean;

  // Séries atendidas e situação cadastral
  gradesServed?: string[]; // Lista de séries atendidas (ex: ['PRÉ II', '1º ANO', '2º ANO', ..., '9º ANO'])
  gradesServedText?: string; // Texto descritivo (ex: 'PRÉ II – 1º AO 5º - 6º AO 9º')
  cadastralStatus?: CadastralStatus; // 'OK' | 'INCOMPLETE' | 'PENDING_DOCS'
  pendingFields?: string[]; // Lista de pendências para complementação cadastral
  createdViaImport?: boolean; // Se foi cadastrada automaticamente via importação de planilha
  isAnnex?: boolean; // Escola anexa (extensão) vinculada a uma escola principal
  parentUnitId?: string; // Escola principal da qual esta é anexa
  importSourceFileName?: string;

  // Identidade Visual & Logotipos da Unidade Escolar
  logoUrl?: string; // Logotipo oficial da Unidade Escolar (brasão/marca da escola)
  managementLogoUrl?: string; // Logotipo da Gestão / Mantenedora / SEMED associada

  // Etapas de Ensino, Séries, Turmas e Turnos Atendidos
  offeredStages?: EducationSegment[]; // ex: ['EDUCACAO_INFANTIL', 'ENSINO_FUNDAMENTAL_I', 'ENSINO_FUNDAMENTAL_II']
  offeredGrades?: string[]; // ex: ['Berçário', 'Maternal I', '1º Ano', '2º Ano', '6º Ano', '9º Ano']
  offeredShifts?: ClassShift[]; // ex: ['MATUTINO', 'VESPERTINO', 'INTEGRAL']
  operatingHours?: string; // Horário de funcionamento (ex: '07:00 às 17:30')
  maxCapacityStudents?: number; // Capacidade máxima de alunos
  maxCapacityClasses?: number; // Capacidade máxima de turmas autorizadas

  // Vínculo Central Oficial com a Secretaria Municipal de Educação
  municipalSecretaryId?: string; // ex: 'semed-cumaru-do-norte'
  municipalSecretaryName?: string; // ex: 'Secretaria Municipal de Educação – SEMED'
  municipalSecretaryCnpj?: string; // ex: '30.676.114/0001-17'
  isLinkedToSecretary?: boolean; // true se homologada e vinculada à SEMED
  linkageCode?: string; // Código de registro na SEMED (ex: 'VINC-SEMED-PA-001')
  linkageDate?: string; // Data da homologação do vínculo
  linkageDecree?: string; // Portaria / Decreto municipal de vinculação
}

// ==========================================
// CONFIGURAÇÃO DO GOOGLE DRIVE PARA ATUALIZAÇÕES (OTA)
// ==========================================
export interface GoogleDriveOTAConfig {
  googleAccountEmail: string;
  driveFolderId: string;
  driveFolderName: string;
  publicShareUrl?: string;
  isConfirmed: boolean;
  isDefaultSource: boolean;
  lastSyncCheck?: string;
  autoCheckUpdates: boolean;
  serviceAccountEmail?: string;
}

// ==========================================
// RELATÓRIOS PERSONALIZADOS UNIVERSAIS
// ==========================================
export type ReportModuleKey =
  | 'STUDENTS'
  | 'CLASSES'
  | 'CLASS_DIARY'
  | 'TEACHER_PORTAL'
  | 'EXAMS'
  | 'QUESTIONS'
  | 'DROPOUT_CENSUS'
  | 'MUNICIPAL_SYNC'
  | 'USER_CONTROL'
  | 'PEDAGOGICAL_DASHBOARD'
  | 'FINANCIAL';

export interface CustomReportColumnDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'badge' | 'boolean';
  defaultVisible: boolean;
  category?: string;
  width?: string;
}

export interface CustomReportFilterState {
  classId?: string;
  stage?: string;
  grade?: string;
  shift?: string;
  status?: string;
  locationZone?: string;
  specialCondition?: string;
  raceColor?: string;
  schoolUnitId?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  minAverage?: number;
  maxAbsences?: number;
  [key: string]: any;
}

export interface CustomReportConfig {
  id?: string;
  title: string;
  subtitle?: string;
  module: ReportModuleKey;
  columns: string[];
  filters: CustomReportFilterState;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  groupBy?: string;
  showSummary: boolean;
  showOfficialHeader: boolean;
  showSignatureLines: boolean;
  includeSchoolLogo: boolean;
  includeManagementLogo: boolean;
  paperOrientation: 'portrait' | 'landscape';
  signatureTitles?: string[];
}

export interface CustomReportTemplate {
  id: string;
  name: string;
  description?: string;
  module: ReportModuleKey;
  config: CustomReportConfig;
  createdAt: string;
  updatedAt?: string;
}

export interface MunicipalSecretaryInfo {
  id: string;
  name: string; // 'Secretaria Municipal de Educação – SEMED'
  shortName: string; // 'SEMED'
  cnpj: string; // '30.676.114/0001-17'
  email: string; // 'augustasec@pmcn.pa.gov.br'
  phone: string; // '(94) 98435-8694'
  address: string; // 'Rua Um, s/nº, Centro – Cumaru do Norte/PA'
  neighborhood: string; // 'Centro'
  city: string; // 'Cumaru do Norte'
  state: string; // 'PA'
  zipCode: string; // '68.398-000'
  secretaryDirector: string; // 'Augusta (Secretária Municipal de Educação)'
  secretaryDirectorRole?: string; // 'Secretária Titular de Educação'
  jurisdiction: string; // 'Rede Municipal de Ensino de Cumaru do Norte / PA'
  systemCode: string; // 'SEMED-PMCN-PA'
  officialDecree?: string; // 'Lei Orgânica Municipal / Decreto PMCN nº 104/1993'
  logoUrl?: string; // Logotipo da Secretaria Municipal de Educação (SEMED)
  managementLogoUrl?: string; // Logotipo da Gestão Municipal / Brasão Oficial da Prefeitura
  lastUpdateDate?: string;
  notes?: string;
}

export const RACE_COLOR_OPTIONS: { value: RaceColorType; label: string; description: string }[] = [
  { value: 'BRANCA', label: 'Branca', description: 'Pessoa que se autodeclara branca' },
  { value: 'PARDA', label: 'Parda', description: 'Pessoa que se autodeclara parda (mestiça/mulata/cabocla)' },
  { value: 'PRETA', label: 'Preta / Negra', description: 'Pessoa que se autodeclara preta / negra' },
  { value: 'AMARELA', label: 'Amarela', description: 'Pessoa de ascendência asiática / oriental' },
  { value: 'INDIGENA', label: 'Indígena', description: 'Pessoa de povos originários / indígenas' },
  { value: 'NAO_DECLARADA', label: 'Não Declarada', description: 'Informação não informada no ato da matrícula' },
];

export const SPECIAL_CONDITIONS_INFO: Record<
  SpecialConditionType,
  { label: string; shortLabel: string; defaultCid: string; color: string; bg: string; border: string; desc: string }
> = {
  TEA: {
    label: 'TEA - Transtorno do Espectro Autista',
    shortLabel: 'TEA / Autismo',
    defaultCid: 'F84.0',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    desc: 'Condição do neurodesenvolvimento com necessidade de plano educacional individualizado (PEI).',
  },
  TDAH: {
    label: 'TDAH - Transtorno de Déficit de Atenção e Hiperatividade',
    shortLabel: 'TDAH',
    defaultCid: 'F90.0',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    desc: 'Padrão persistente de desatenção e/ou hiperatividade-impulsividade com impacto acadêmico.',
  },
  DEFICIENCIA_INTELECTUAL: {
    label: 'Deficiência Intelectual',
    shortLabel: 'Def. Intelectual',
    defaultCid: 'F70',
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    desc: 'Limitações significativas no funcionamento intelectual e comportamento adaptativo.',
  },
  DEFICIENCIA_FISICA: {
    label: 'Deficiência Física / Motora',
    shortLabel: 'Def. Física',
    defaultCid: 'G80',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    desc: 'Comprometimento da função física ou motora com necessidade de acessibilidade.',
  },
  DEFICIENCIA_VISUAL: {
    label: 'Deficiência Visual (Cegueira / Baixa Visão)',
    shortLabel: 'Def. Visual',
    defaultCid: 'H54',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    desc: 'Perda total ou parcial da visão com necessidade de materiais ampliados ou Braille.',
  },
  DEFICIENCIA_AUDITIVA: {
    label: 'Deficiência Auditiva / Surdez (LIBRAS)',
    shortLabel: 'Def. Auditiva',
    defaultCid: 'H90',
    color: 'text-cyan-800',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    desc: 'Perda auditiva bilateral ou unilateral com necessidade de intérprete de LIBRAS.',
  },
  ALTAS_HABILIDADES: {
    label: 'Altas Habilidades / Superdotação',
    shortLabel: 'Superdotação',
    defaultCid: 'Z73.9',
    color: 'text-yellow-800',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    desc: 'Potencial elevado em áreas intelectuais, acadêmicas, liderança ou artes.',
  },
  SINDROME_DOWN: {
    label: 'Síndrome de Down (Trissomia 21)',
    shortLabel: 'Down (T21)',
    defaultCid: 'Q90',
    color: 'text-teal-800',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    desc: 'Condição genética com necessidade de estimulação cognitiva e AEE.',
  },
  MEDICACAO_CONTINUA: {
    label: 'Uso de Medicação Contínua na Escola',
    shortLabel: 'Medicação Contínua',
    defaultCid: 'Z76.8',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    desc: 'Requer administração ou acompanhamento de dosagem prescrita por médico.',
  },
  ALERGIA_GRAVE: {
    label: 'Alergias Graves / Restrição Alimentar Severa',
    shortLabel: 'Alergia Grave',
    defaultCid: 'T78.4',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    desc: 'Alergias alimentares, medicamentosas ou respiratórias graves com risco de anafilaxia.',
  },
  OUTRA: {
    label: 'Outras Condições Médicas com Laudo',
    shortLabel: 'Outra Condição',
    defaultCid: 'R69',
    color: 'text-slate-800',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    desc: 'Outro diagnóstico com laudo médico arquivado na secretaria escolar.',
  },
};

export const STANDARDIZED_GRADE_LEVELS = [
  // Educação Infantil
  { level: 'Educação Infantil - Berçário (0 a 1 ano)', segment: 'EDUCACAO_INFANTIL', short: 'Berçário' },
  { level: 'Educação Infantil - Maternal I (1 a 2 anos)', segment: 'EDUCACAO_INFANTIL', short: 'Maternal I' },
  { level: 'Educação Infantil - Maternal II (2 a 3 anos)', segment: 'EDUCACAO_INFANTIL', short: 'Maternal II' },
  { level: 'Educação Infantil - Pré I (4 anos)', segment: 'EDUCACAO_INFANTIL', short: 'Pré I' },
  { level: 'Educação Infantil - Pré II (5 anos)', segment: 'EDUCACAO_INFANTIL', short: 'Pré II' },
  // Ensino Fundamental - Anos Iniciais e Finais (1º ao 9º)
  { level: '1º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '1º Ano' },
  { level: '2º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '2º Ano' },
  { level: '3º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '3º Ano' },
  { level: '4º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '4º Ano' },
  { level: '5º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '5º Ano' },
  { level: '6º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '6º Ano' },
  { level: '7º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '7º Ano' },
  { level: '8º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '8º Ano' },
  { level: '9º Ano - Ensino Fundamental', segment: 'ENSINO_FUNDAMENTAL', short: '9º Ano' },
  // Ensino Médio & EJA
  { level: '1ª Série - Ensino Médio', segment: 'ENSINO_MEDIO', short: '1ª Série EM' },
  { level: '2ª Série - Ensino Médio', segment: 'ENSINO_MEDIO', short: '2ª Série EM' },
  { level: '3ª Série - Ensino Médio', segment: 'ENSINO_MEDIO', short: '3ª Série EM' },
  { level: 'EJA - Educação de Jovens e Adultos', segment: 'EJA', short: 'EJA' },
];

export interface MunicipalSyncPacket {
  version: string;
  packetId: string;
  schoolUnit: SchoolUnit;
  municipalityName: string;
  stateCode: string;
  exportedAt: string;
  operatorName: string;
  checksum: string;
  municipalSecretary?: MunicipalSecretaryInfo;
  summary: {
    studentsCount: number;
    classesCount: number;
    examsCount: number;
    submissionsCount: number;
    academicHistoriesCount: number;
  };
  data: {
    students: Student[];
    classes: SchoolClass[];
    exams: Exam[];
    submissions: ExamSubmission[];
    academicHistories: AcademicHistory[];
    censusExtra?: {
      specialNeedsCount: number;
      transportUsersCount: number;
      schoolFeedBeneficiariesCount: number;
      dropoutRiskCount: number;
    };
  };
}

export interface SyncAuditLog {
  id: string;
  schoolUnitId: string;
  schoolUnitName: string;
  importedAt: string;
  operatorName: string;
  recordsMerged: {
    students: number;
    classes: number;
    exams: number;
    submissions: number;
  };
  status: 'SUCESSO' | 'AVISO' | 'ERRO';
  notes: string;
}

/* ==========================================================================
   DICIONÁRIOS & CONFIGURAÇÕES VISUAIS DE EVASÃO, BUSCA ATIVA & CADASTRO
   ========================================================================== */

export const CADASTRAL_STATUS_INFO: Record<
  CadastralStatus,
  { label: string; color: string; bg: string; border: string; desc: string }
> = {
  OK: {
    label: 'Cadastro Regular / OK',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    desc: 'Documentação completa e dados cadastrais atualizados.',
  },
  PENDING_DOCS: {
    label: 'Pendência de Documentos',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    desc: 'Faltam certidão de nascimento, CPF, comprovante ou histórico escolar.',
  },
  INCOMPLETE: {
    label: 'Cadastro Incompleto',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    desc: 'Faltam dados essenciais do responsável ou endereço.',
  },
  NEEDS_UPDATE: {
    label: 'Necessita Atualização',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    desc: 'Cadastro desatualizado há mais de 1 ano letivo.',
  },
};

export const DROPOUT_REASON_INFO: Record<
  DropoutReasonKey,
  {
    label: string;
    shortLabel: string;
    category: 'SOCIOECONOMICO' | 'INFRAESTRUTURA' | 'PEDAGOGICO' | 'SAUDE' | 'OUTROS';
    color: string;
    bg: string;
    border: string;
    mecCode: string;
    description: string;
  }
> = {
  MUDANCA_MUNICIPIO_ZONA: {
    label: 'Mudança de Município ou Zona Rural sem Transferência',
    shortLabel: 'Mudança de Domicílio',
    category: 'SOCIOECONOMICO',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    mecCode: 'MEC-01',
    description: 'A família mudou-se de residência para outro município ou região sem solicitar a guia oficial de transferência escolar.',
  },
  TRABALHO_INFANTIL_RENDA: {
    label: 'Inserção no Mercado de Trabalho / Ajuda na Renda Familiar',
    shortLabel: 'Trabalho Precoce / Renda',
    category: 'SOCIOECONOMICO',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    mecCode: 'MEC-02',
    description: 'Estudante precisou trabalhar no comércio, agricultura ou trabalho informal para complementar a renda do lar.',
  },
  TRANSPORTE_DISTANCIA: {
    label: 'Dificuldades de Acesso / Falta de Transporte Escolar Rural',
    shortLabel: 'Transporte / Acesso',
    category: 'INFRAESTRUTURA',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    mecCode: 'MEC-03',
    description: 'Distância geográfica excessiva da residência até o ponto de ônibus ou intrafegabilidade de vias na zona rural.',
  },
  DESINTERESSE_DESEMPENHO: {
    label: 'Desinteresse / Dificuldades de Aprendizagem Acumuladas',
    shortLabel: 'Dificuldade / Desmotivação',
    category: 'PEDAGOGICO',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    mecCode: 'MEC-04',
    description: 'Desmotivação escolar decorrente de histórico de reprovações sucessivas ou distorção idade-série.',
  },
  DESINTERESSE: {
    label: 'Desinteresse / Desmotivação Escolar',
    shortLabel: 'Desinteresse Escolar',
    category: 'PEDAGOGICO',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    mecCode: 'MEC-04',
    description: 'Desmotivação escolar ou falta de interesse nos estudos.',
  },
  GRAVIDEZ_CUIDADO_FAMILIAR: {
    label: 'Gravidez Precoce / Cuidados com Filhos ou Familiares',
    shortLabel: 'Gravidez / Cuidados Familiares',
    category: 'SOCIOECONOMICO',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    mecCode: 'MEC-05',
    description: 'Aluna gestante/mãe ou estudante encarregado do cuidado integral de irmãos mais novos ou idosos.',
  },
  SAUDE_DOENCA_CRONICA: {
    label: 'Problemas de Saúde / Tratamento Médico Prolongado',
    shortLabel: 'Saúde / Doença Crônica',
    category: 'SAUDE',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    mecCode: 'MEC-06',
    description: 'Internações hospitalares ou comorbidades crônicas sem atendimento pedagógico domiciliar implementado.',
  },
  VIOLENCIA_VULNERABILIDADE: {
    label: 'Vulnerabilidade Social Extrema / Violência Comunitária',
    shortLabel: 'Vulnerabilidade / Violência',
    category: 'SOCIOECONOMICO',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    mecCode: 'MEC-07',
    description: 'Ameaças, conflitos no território ou extrema insegurança alimentar e desestruturação familiar.',
  },
  FALTA_DOCUMENTACAO: {
    label: 'Impedimentos por Falta de Documentação Civil Básica',
    shortLabel: 'Ausência de Documentos',
    category: 'OUTROS',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    mecCode: 'MEC-08',
    description: 'Ausência de registro civil de nascimento ou RG/CPF que dificultou a permanência ou emissão de benefícios.',
  },
  OUTROS: {
    label: 'Outros Motivos Justificados em Parecer',
    shortLabel: 'Outros Motivos',
    category: 'OUTROS',
    color: 'text-slate-800',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    mecCode: 'MEC-99',
    description: 'Outras razões registradas em relatório individual pela equipe multidisciplinar ou Conselho Tutelar.',
  },
};

export const ACTIVE_SEARCH_STATUS_INFO: Record<
  ActiveSearchStatus,
  { label: string; color: string; bg: string; border: string; badge: string }
> = {
  EM_BUSCA_ATIVA: {
    label: 'Em Busca Ativa',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  RESGATADO_REINSERIDO: {
    label: 'Resgatado & Reinserido',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  MUDANCA_CONFIRMADA: {
    label: 'Mudança de Cidade Confirmada',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  NAO_LOCALIZADO: {
    label: 'Não Localizado no Endereço',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800',
  },
  ENCAMINHADO_CONSELHO: {
    label: 'Encaminhado ao Conselho Tutelar',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
  },
  ARQUIVADO: {
    label: 'Processo Arquivado',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700',
  },
};

/* ==========================================================================
   GESTÃO DOCENTE & PAUTA DE NOTAS DO PROFESSOR
   ========================================================================== */

export interface StudentBimonthlyGradeEntry {
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  assessment1?: number | null; // Prova Parcial 1 / Teste
  assessment2?: number | null; // Trabalho em Grupo / Pesquisa
  activitiesScore?: number | null; // Atividades em Sala / Tarefas
  examScore?: number | null; // Prova Bimestral
  recoveryScore?: number | null; // Recuperação Paralela
  termAverage: number; // Média Final do Período
  status: 'APROVADO' | 'RECUPERACAO' | 'REPROVADO' | 'EM_ANDAMENTO';
  descriptiveFeedback?: string; // Parecer descritivo individual
}

export interface ClassGradeSheet {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  schoolYear: number;
  term: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre' | 'Recuperação Final';
  grades: StudentBimonthlyGradeEntry[];
  averagePassingGrade: number; // Meta/Média de corte (ex: 6.0 ou 7.0)
  weights?: {
    assessment1: number;
    assessment2: number;
    activities: number;
    exam: number;
  };
  status: 'RASCUNHO' | 'FECHADO_PROFESSOR' | 'HOMOLOGADO_SECRETARIA';
  updatedAt: string;
}

export interface TeacherLessonPlan {
  id: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  term: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre';
  schoolYear: number;
  title: string;
  generalObjective: string;
  bnccSkillCodes: string[];
  plannedLessonsCount: number;
  executedLessonsCount: number;
  methodologies: string;
  assessmentCriteria: string;
  resourcesNeeded?: string;
  status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherStudentPedagogicalNote {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  date: string;
  category: 'DESEMPENHO' | 'COMPORTAMENTO' | 'AEE_INCLUSAO' | 'EVOLUCAO' | 'ALERTA';
  note: string;
  actionPlan?: string;
  sharedWithCoordination?: boolean;
}

/* ==========================================================================
   INTEGRAÇÃO WHATSAPP BUSINESS & DISPAROS ADMINISTRATIVOS
   ========================================================================== */

export interface WhatsAppConfig {
  enabled?: boolean;
  instanceName: string;
  serverEndpoint: string;
  apiKeyOrToken?: string;
  apiKey?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'QR_READY' | 'CONNECTING';
  qrCodeBase64?: string;
  connectedPhone?: string;
  batteryLevel?: number;
  autoSendAbsenceAlerts?: boolean;
  autoSendGradeAlerts?: boolean;
  autoSendAnnouncements?: boolean;
  autoSendActiveSearchSummons?: boolean;
  autoNotifyGrades?: boolean;
  autoNotifyAttendance?: boolean;
  autoNotifyAnnouncements?: boolean;
  defaultCountryCode?: string;
  /** Envio assistido: faltas lançadas geram mensagem em "Aguardando envio" (padrão: sim). */
  queueAbsenceAlerts?: boolean;
  /** Envio assistido: notas fechadas geram mensagem em "Aguardando envio" (padrão: não). */
  queueGradeAlerts?: boolean;
}

export type WhatsAppRecipientRole = 'RESPONSAVEL' | 'PROFESSOR' | 'SECRETARIA' | 'DIRETORIA' | 'COORDENACAO' | 'ALUNO';

export type WhatsAppMessageType =
  | 'AVISO_FALTA'
  | 'BOLETIM_NOTAS'
  | 'CONVOCACAO_RESPONSAVEL'
  | 'COMUNICADO_INTERNO'
  | 'BUSCA_ATIVA'
  | 'EVENTO_REUNIAO'
  | 'AVISO_GERAL';

export interface WhatsAppMessageLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientRole: WhatsAppRecipientRole;
  messageType: WhatsAppMessageType;
  content: string;
  studentName?: string;
  studentClass?: string;
  /**
   * FILA = aguardando envio; ENVIADO = aberto no WhatsApp pelo operador;
   * DESCARTADO = removido da fila sem enviar. ENTREGUE/LIDO/ERRO só existem em
   * registros antigos (o envio assistido não recebe confirmação de entrega).
   */
  status: 'ENVIADO' | 'ENTREGUE' | 'LIDO' | 'ERRO' | 'FILA' | 'DESCARTADO';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  operatorName: string;
  studentId?: string;
  /** Origem: envio manual, aviso do mural, falta ou nota lançada pelo professor. */
  source?: 'MANUAL' | 'MURAL' | 'FALTA' | 'NOTA';
  /** Agrupa as mensagens de um mesmo envio em lote. */
  batchId?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  type: WhatsAppMessageType;
  body: string;
  variables: string[];
}

/* ==========================================================================
   ATUALIZAÇÕES WEB, REPOSITÓRIO EM NUVEM (OTA) & HISTÓRICO DE MELHORIAS
   ========================================================================== */

export type UpdateSeverity = 'PATCH' | 'MINOR' | 'MAJOR' | 'SECURITY';

export interface SystemUpdateImprovement {
  category: 'SEGURANCA' | 'PEDAGOGICO' | 'SECRETARIA' | 'PERFORMANCE' | 'SISTEMA';
  title: string;
  description: string;
}

export interface SystemUpdatePackage {
  id: string;
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  description: string;
  severity: UpdateSeverity;
  sizeFormatted: string;
  improvements: SystemUpdateImprovement[];
  isInstalled: boolean;
  installedAt?: string;
  installedBy?: string;
  downloadUrl?: string;
  sha256Checksum: string;
  cloudStorageUrl?: string;
  googleDriveFileId?: string;
  googleDriveFolder?: string;
  minCompatibleVersion?: string;
  author?: string;
  targetPlatform?: string;
  isCloudAvailable?: boolean;
}

export interface PreUpdateRestorePoint {
  id: string;
  timestamp: string;
  versionBefore: string;
  targetVersion: string;
  operatorName: string;
  reason: string;
  checksum: string;
  fileSizeBytes: number;
  recordsCount: {
    students: number;
    classes: number;
    exams: number;
    submissions: number;
  };
  googleDriveSyncStatus: 'SYNCED_TO_DRIVE' | 'LOCAL_ONLY' | 'PENDING';
  googleDriveBackupFileId?: string;
}

export interface CloudUpdateRepositoryItem {
  id: string;
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  severity: UpdateSeverity;
  sizeFormatted: string;
  sha256Checksum: string;
  downloadUrl: string;
  changelogCount: number;
  isLatest: boolean;
}

export interface UpdateExecutionLog {
  timestamp: string;
  step: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

/* ==========================================================================
   TRILHA DE AUDITORIA & SEGURANÇA (AUDIT LOGS)
   ========================================================================== */

export type AuditActionType =
  | 'LOGIN_SUCESSO'
  | 'LOGIN_FALHA'
  | 'LOGOUT'
  | 'CRIAR_REGISTRO'
  | 'EDITAR_REGISTRO'
  | 'EXCLUIR_REGISTRO'
  | 'ALTERAR_PERMISSOES'
  | 'EXPORTAR_DADOS'
  | 'SINCRONIZAR_REDE'
  | 'DISPARO_WHATSAPP'
  | 'APLICAR_ATUALIZACAO'
  | 'ACESSO_NEGADO';

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userLogin: string;
  userRole: UserRole;
  userSector: UserSector;
  actionType: AuditActionType;
  module: SystemModuleKey | string;
  details: string;
  ipAddress: string;
  status: 'SUCESSO' | 'ALERTA' | 'BLOQUEADO';
}

/* ==========================================================================
   CONFIGURAÇÃO DE INSTALAÇÃO UNIFICADA (SERVIDOR VS ESTAÇÃO)
   ========================================================================== */

export type InstallTargetType = 'SERVER' | 'WORKSTATION';

export interface UnifiedInstallerProfile {
  targetType: InstallTargetType;
  stationName: string;
  serverHost: string;
  serverPort: number;
  databaseEngine: 'POSTGRESQL' | 'LOCAL_SQLITE' | 'BROWSER_CACHE';
  schoolUnitId?: string;
  schoolUnitName?: string;
  autoSyncIntervalMinutes: number;
  enableOfflineCache: boolean;
  enableLanBroadcast: boolean;
}

/* ==========================================================================
   ALERTAS PREDITIVOS DA SECRETARIA & COORDENAÇÃO PEDAGÓGICA
   ========================================================================== */

export type PredictiveAlertType =
  | 'CONSECUTIVE_ABSENCES' // 3 ou mais faltas consecutivas (Risco de Evasão)
  | 'PERFORMANCE_DROP' // Redução de 20% ou mais no desempenho acadêmico
  | 'DUAL_RISK'; // Faltas consecutivas E queda de desempenho simultâneas

export type PredictiveAlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export type InterventionType =
  | 'CONVOCACAO_RESPONSAVEIS'
  | 'REFORCO_MONITORIA'
  | 'AEE_PSICOPEDAGOGICO'
  | 'BUSCA_ATIVA_ESCOLAR'
  | 'CONSELHO_CLASSE_EXTRA'
  | 'OUTRO';

export interface PredictiveAlert {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  cpf?: string;
  classId: string;
  className: string;
  schoolUnitId?: string;
  schoolUnitName?: string;
  shift?: string;
  photoUrl?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  alertType: PredictiveAlertType;
  severity: PredictiveAlertSeverity;
  
  // Detalhes de Faltas
  consecutiveAbsencesCount: number;
  absenceDates: string[]; // ex: ['2026-08-25', '2026-08-26', '2026-08-27']
  lastAbsenceDate?: string;
  
  // Detalhes de Desempenho
  performanceDropPercent: number; // ex: 28.5%
  previousAverage: number; // ex: 8.2
  currentAverage: number; // ex: 5.6
  subjectAffected?: string; // ex: 'Matemática e Suas Tecnologias'
  termOrEvaluation?: string; // ex: '2º Bimestre ➔ 3º Bimestre'
  
  // Notificação da Coordenação
  coordinationNotified: boolean;
  notifiedAt?: string;
  notifiedBy?: string;
  notificationId?: string;
  notificationNotes?: string;
  
  // Intervenção Pedagógica
  interventionStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  interventionType?: InterventionType;
  interventionNotes?: string;
  interventionResponsible?: string;
  interventionDate?: string;
  recommendedAction?: string;
  
  detectedAt: string;
}

// ==========================================
// OMNIDEPLOY - SISTEMA DE GESTÃO E INSTALAÇÃO HÍBRIDA
// ==========================================

export type OmniDeployTarget =
  | 'LOCAL_STANDALONE'
  | 'HYBRID_SERVER'
  | 'CLOUD_RUN'
  | 'SATELLITE_NODE';

export interface OmniDeployPathValidation {
  requestedPath: string;
  resolvedPath: string;
  isWritable: boolean;
  hasPreviousInstallation: boolean;
  autoRemapped: boolean;
  remappedReason?: string;
  freeSpaceBytesEstimate?: number;
}

export interface OmniDeployFolderStructure {
  rootDir: string;
  binDir: string;      // Executáveis, Node/PS runtimes, scripts (Sobrescrito em updates)
  assetsDir: string;   // Ícones, assets, estilos estáticos (Sobrescrito em updates)
  dataDir: string;     // Banco de dados local, SQLite/JSON (PRESERVADO EM UPDATES)
  configDir: string;   // config.ini, .env, certificados (PRESERVADO EM UPDATES)
  backupsDir: string;  // Snapshots de resguardo automáticos
  logsDir: string;     // Auditoria e telemetria de instalação
}

export interface OmniDeployVersionManifest {
  version: string;
  releaseDate: string;
  channel: 'STABLE' | 'LTS' | 'BETA';
  releaseNotes: string[];
  improvements: {
    title: string;
    description: string;
    category: 'FEATURE' | 'SECURITY' | 'PERFORMANCE' | 'UX';
    badge: string;
  }[];
  fileHashes: Record<string, string>; // path -> sha256
  storagePackageUrl?: string;
  requiresMandatoryPresentation: boolean;
}

export interface OmniDeployInstallationRecord {
  id: string;
  schoolId: string;
  installedVersion: string;
  targetType: OmniDeployTarget;
  installedAt: string;
  updatedAt: string;
  rootDir: string;
  lastIntegrityStatus: 'INTACT' | 'CORRUPTED' | 'NEEDS_SCAN';
  lastIntegrityScore: number;
  firebaseSynced: boolean;
  activePort: number;
}

export interface OmniDeployImportFilterState {
  startDate?: string;
  endDate?: string;
  selectedCategory?: string;
  minValue?: number;
  maxValue?: number;
  searchKeyword?: string;
  selectedColumns?: string[];
  targetEntity?: 'STUDENTS' | 'TEACHERS' | 'GRADES' | 'ATTENDANCE' | 'INVENTORY';
}

export interface OmniDeployPrintDevice {
  id: string;
  name: string;
  type: 'LOCAL' | 'NETWORK' | 'VIRTUAL_PDF' | 'THERMAL';
  dpi: number;
  paperSizes: ('A4' | 'A3' | 'CARTA' | 'TERMICA_80MM')[];
  isDefault: boolean;
  connectionStatus: 'ONLINE' | 'STANDBY' | 'OFFLINE';
}

export interface OmniDeployChartParametricConfig {
  xAxisKey: string;
  yAxisKey: string;
  chartType: 'BAR' | 'LINE' | 'PIE' | 'AREA';
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';
  sortBy: 'VALUE_DESC' | 'VALUE_ASC' | 'LABEL_ASC';
  title: string;
  subtitle?: string;
  showGrid: boolean;
  showLegend: boolean;
  colorScheme: 'GOOGLE_MD3' | 'INDIGO' | 'EMERALD' | 'AMBER';
}

// ==========================================
// NEXUS DEPLOYER - PROVISIONING & UPDATES
// ==========================================

export interface NexusFileSpec {
  name: string;
  path: string;
  purpose: string;
  isCritical: boolean;
  isSensitiveFromSecretManager?: boolean;
  sizeBytes?: number;
  checksumSha256?: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'ROLLED_BACK';
  writtenAt?: string;
}

export interface NexusProvisionResult {
  success: boolean;
  totalFiles: number;
  presentFiles: number;
  missingFiles: string[];
  files: NexusFileSpec[];
  rootDir: string;
  message: string;
  timestamp: string;
  iamElevationVerified: boolean;
  secretManagerInjected: boolean;
  rollbackExecuted: boolean;
  rollbackDetails?: string;
}

export interface NexusBundleMetadata {
  version: string;
  packageFilename: string;
  sizeBytes: number;
  sizeMb: string;
  sha256: string;
  downloadUrl: string;
  storageBucket: string;
  storagePath: string;
  firestoreDocId: string;
  createdAt: string;
  fileCount: number;
  status: 'PREPARED' | 'UPLOADING' | 'PUBLISHED' | 'ERROR';
  channel: 'STABLE' | 'BETA' | 'CANARY';
  verifiedIntegrity: boolean;
}

export interface NexusDeployerTelemetry {
  rootDir: string;
  exists: boolean;
  writable: boolean;
  iamElevated: boolean;
  secretManagerReady: boolean;
  firebaseStorageReady: boolean;
  firestoreReady: boolean;
  installedCount: number;
  totalRequired: number;
  latestRelease?: NexusBundleMetadata | null;
  lastProvisionResult?: NexusProvisionResult | null;
}

export type NexusAuditEventType =
  | 'INTEGRITY_SCAN'
  | 'PROVISION_EXEC'
  | 'CLOUD_UPDATE'
  | 'ROLLBACK_TEST'
  | 'SECRET_MANAGER_SYNC';

export type NexusAuditCategory =
  | 'INTEGRIDADE'
  | 'ATUALIZAÇÃO'
  | 'SEGURANÇA'
  | 'RESILIÊNCIA';

export type NexusAuditStatus =
  | 'CONFORME'
  | 'SUCESSO'
  | 'AVISO'
  | 'ROLLBACK_EXECUTADO'
  | 'FALHA';

export interface NexusAuditEntry {
  id: string;
  timestamp: string;
  eventType: NexusAuditEventType;
  category: NexusAuditCategory;
  version: string;
  targetDir: string;
  summary: string;
  details: string;
  status: NexusAuditStatus;
  filesCount: number;
  sha256Digest?: string;
  actor: string;
  cloudSyncStatus: 'SINCRONIZADO' | 'LOCAL';
}

export interface NexusAuditReportData {
  reportId: string;
  generatedAt: string;
  schoolName: string;
  systemVersion: string;
  targetDir: string;
  overallStatus: 'CONFORME' | 'ALERTA' | 'CRÍTICO';
  complianceRate: number;
  telemetry: NexusDeployerTelemetry;
  canonicalFiles: NexusFileSpec[];
  auditHistory: NexusAuditEntry[];
  updatesHistory: NexusBundleMetadata[];
  secretManagerKeysCount: number;
}

// ==========================================
// NEXUS INSTALL - GERENCIADOR DE DEPLOY & COMMIT ATÔMICO
// ==========================================

export type NexusInstallStage =
  | 'IDLE'
  | 'STAGING_BUFFER'
  | 'PERMISSIONS_CHECK'
  | 'ATOMIC_COMMIT'
  | 'POST_INSTALL_VERIFICATION'
  | 'TEMP_CLEANUP'
  | 'COMPLETED'
  | 'ERROR'
  | 'ROLLBACK';

export interface NexusInstallationRecord {
  id: string;
  installId: string;
  status: 'pending' | 'verified' | 'failed' | 'rolled_back';
  rootDir: string;
  tempBufferDir: string;
  totalFiles: number;
  totalBytes: number;
  essentialFiles: {
    name: 'index.js' | 'package.json' | '.env' | string;
    present: boolean;
    sizeBytes: number;
    path: string;
  }[];
  verifiedFiles: string[];
  missingFiles?: string[];
  secretManagerInjected: boolean;
  commitTimestamp: string;
  firestoreDocId: string;
  durationMs: number;
  message: string;
  rollbackExecuted: boolean;
  rollbackDetails?: string;
}

export interface NexusFileTransferProgress {
  stage: NexusInstallStage;
  percent: number;
  currentFile: string;
  filesTransferred: number;
  totalFiles: number;
  bytesTransferred: number;
  totalBytes: number;
  speedFormatted?: string;
  message: string;
}

export interface NexusFileSystemValidation {
  isValid: boolean;
  rootDir: string;
  exists: boolean;
  writable: boolean;
  hasWritePermissionW_OK: boolean;
  totalBytesOnDisk: number;
  hasEssentialFiles: boolean;
  essentialChecks: {
    indexJs: { present: boolean; sizeBytes: number; path: string };
    packageJson: { present: boolean; sizeBytes: number; path: string };
    env: { present: boolean; sizeBytes: number; path: string };
  };
  missingEssentialFiles: string[];
  allFilesPresentCount: number;
  totalRequiredCount: number;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export interface NexusInstallErrorLogRecord {
  id: string;
  timestamp: string;
  installId?: string;
  errorCode: string;
  errorMessage: string;
  targetDir: string;
  stage: NexusInstallStage;
  permissionCode?: string;
  temporaryBufferPreserved: boolean;
  rollbackExecuted: boolean;
  firestoreSynced: boolean;
  details?: string;
}
