/**
 * Supabase PostgreSQL Schema Definitions & TypeScript Mapping Bridge
 * Gerado para garantir tipagem estrita com as tabelas criadas via Supabase Dashboard.
 */

export interface SupabaseColumnMapping {
  table: string;
  column: string;
  frontendProperty: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  foreignKey?: {
    targetTable: string;
    targetColumn: string;
    relationshipType: '1:N' | 'N:1' | 'N:N';
  };
  status: 'MATCH' | 'TRANSFORMED' | 'OPTIONAL';
}

export interface SupabaseTableAudit {
  name: string;
  description: string;
  columnsCount: number;
  frontendEntity: string;
  rlsEnabled: boolean;
  rlsPolicies: {
    name: string;
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    roles: string[];
    enforcement: 'PERMISSIVE' | 'RESTRICTIVE';
  }[];
  relationships: {
    name: string;
    type: '1:N' | 'N:1' | 'N:N';
    from: string;
    to: string;
    onDelete?: string;
  }[];
  sampleStatus: 'SYNCED' | 'PENDING' | 'EMPTY';
}

export interface FullStackBackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  type: 'FULL_STACK' | 'DATABASE_ONLY' | 'FRONTEND_ASSETS';
  dbDumpFileName: string;
  frontendArchiveFileName: string;
  packageFileName: string;
  sizeBytes: number;
  tablesCount: number;
  totalRecordsCount: number;
  checksumSha256: string;
  storageBucket: string;
  storagePath: string;
  status: 'STORED_SUPABASE' | 'DOWNLOAD_LOCAL' | 'FAILED';
  author: string;
}

export interface BuildScanResult {
  scanId: string;
  timestamp: string;
  buildStatus: 'SUCCESS' | 'WARNING' | 'ERROR';
  typescriptErrorsCount: number;
  missingModulesCount: number;
  circularDepsCount: number;
  environmentStatus: {
    supabaseUrl: boolean;
    supabaseAnonKey: boolean;
    nodeEnv: string;
  };
  auditedFilesCount: number;
  details: {
    category: 'TYPESCRIPT' | 'MODULE_IMPORT' | 'SCHEMA_MISMATCH' | 'RLS_SECURITY' | 'STORAGE';
    severity: 'INFO' | 'WARNING' | 'ERROR';
    code?: string;
    file: string;
    line?: number;
    message: string;
    remediation: string;
  }[];
}

/**
 * Mapeamento canônico das tabelas do Dashboard Supabase
 */
export const SUPABASE_DASHBOARD_TABLES: SupabaseTableAudit[] = [
  {
    name: 'students',
    description: 'Cadastro geral de discentes, dados demográficos, filiação e censo',
    columnsCount: 16,
    frontendEntity: 'Student',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'students_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'students_insert', action: 'INSERT', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
      { name: 'students_update', action: 'UPDATE', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
      { name: 'students_delete', action: 'DELETE', roles: ['service_role'], enforcement: 'RESTRICTIVE' },
    ],
    relationships: [
      { name: 'fk_students_class', type: 'N:1', from: 'students.class_id', to: 'school_classes.id', onDelete: 'SET NULL' },
      { name: 'fk_students_unit', type: 'N:1', from: 'students.unit_id', to: 'school_units.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'school_classes',
    description: 'Turmas escolares, grade horária, capacidade e turnos',
    columnsCount: 11,
    frontendEntity: 'SchoolClass',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'classes_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'classes_upsert', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [
      { name: 'fk_classes_unit', type: 'N:1', from: 'school_classes.unit_id', to: 'school_units.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'subjects',
    description: 'Disciplinas e componentes curriculares por segmento BNCC',
    columnsCount: 6,
    frontendEntity: 'Subject',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'subjects_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'subjects_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'courses',
    description: 'Cursos, itinerários formativos e etapas da educação básica',
    columnsCount: 5,
    frontendEntity: 'Course',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'courses_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'courses_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'questions',
    description: 'Banco de itens, questões avaliativas e habilidades BNCC',
    columnsCount: 11,
    frontendEntity: 'Question',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'questions_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'questions_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'exams',
    description: 'Instrumentos avaliativos, simulados e provas com pesos',
    columnsCount: 9,
    frontendEntity: 'Exam',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'exams_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'exams_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'exam_submissions',
    description: 'Respostas de discentes, gabaritos, pontuações e correções',
    columnsCount: 10,
    frontendEntity: 'ExamSubmission',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'submissions_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'submissions_insert', action: 'INSERT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'submissions_update', action: 'UPDATE', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [
      { name: 'fk_subm_exam', type: 'N:1', from: 'exam_submissions.exam_id', to: 'exams.id', onDelete: 'CASCADE' },
      { name: 'fk_subm_student', type: 'N:1', from: 'exam_submissions.student_id', to: 'students.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'attendance_sheets',
    description: 'Diário de frequência e chamadas diárias por aula',
    columnsCount: 7,
    frontendEntity: 'AttendanceSheet',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'attendance_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'attendance_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [
      { name: 'fk_att_class', type: 'N:1', from: 'attendance_sheets.class_id', to: 'school_classes.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'lesson_registries',
    description: 'Registro de conteúdo ministrado e habilidades desenvolvidas',
    columnsCount: 8,
    frontendEntity: 'LessonRegistry',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'lessons_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'lessons_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [
      { name: 'fk_lesson_class', type: 'N:1', from: 'lesson_registries.class_id', to: 'school_classes.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'class_grade_sheets',
    description: 'Mapas de notas bimestrais/trimestrais consolidadas',
    columnsCount: 6,
    frontendEntity: 'ClassGradeSheet',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'grades_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'grades_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [
      { name: 'fk_grades_class', type: 'N:1', from: 'class_grade_sheets.class_id', to: 'school_classes.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'academic_histories',
    description: 'Histórico acadêmico de vida escolar com anotações e transferências',
    columnsCount: 5,
    frontendEntity: 'AcademicHistory',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'histories_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'histories_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [
      { name: 'fk_history_student', type: 'N:1', from: 'academic_histories.student_id', to: 'students.id', onDelete: 'CASCADE' },
    ],
  },
  {
    name: 'school_units',
    description: 'Polos municipais, escolas parceiras e filiais da rede',
    columnsCount: 11,
    frontendEntity: 'SchoolUnit',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'units_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'units_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'user_accounts',
    description: 'Contas com perfil e controle de acesso RBAC',
    columnsCount: 9,
    frontendEntity: 'UserAccount',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'users_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'users_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'communications',
    description: 'Comunicados internos, avisos para responsáveis e recados',
    columnsCount: 7,
    frontendEntity: 'CommunicationMessage',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'comms_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'comms_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'notifications',
    description: 'Notificações push/in-app do sistema',
    columnsCount: 6,
    frontendEntity: 'AppNotification',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'notifs_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'notifs_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'school_settings',
    description: 'Parâmetros institucionais, médias de aprovação e dados gerais',
    columnsCount: 15,
    frontendEntity: 'SchoolSettings',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'settings_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'settings_manage', action: 'ALL', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'sync_audit_logs',
    description: 'Trilha de auditoria append-only de sincronizações entre nós e rede',
    columnsCount: 9,
    frontendEntity: 'SyncAuditLog',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'sync_logs_select', action: 'SELECT', roles: ['anon', 'authenticated'], enforcement: 'PERMISSIVE' },
      { name: 'sync_logs_insert', action: 'INSERT', roles: ['anon', 'authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
  {
    name: 'system_backups',
    description: 'Histórico e manifesto de backups full-stack gravados no Supabase Storage',
    columnsCount: 8,
    frontendEntity: 'FullStackBackupMetadata',
    rlsEnabled: true,
    sampleStatus: 'SYNCED',
    rlsPolicies: [
      { name: 'backups_select', action: 'SELECT', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
      { name: 'backups_insert', action: 'INSERT', roles: ['authenticated', 'service_role'], enforcement: 'PERMISSIVE' },
    ],
    relationships: [],
  },
];
