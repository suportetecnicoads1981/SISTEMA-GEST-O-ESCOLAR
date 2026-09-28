/**
 * Mapa das coleções do sistema para a nuvem (sincronização v2).
 *
 * Cada item diz em qual tabela a coleção fica, como o registro vira linha (colunas
 * usadas em consultas e relatórios) e como a linha volta a ser registro. O registro
 * completo vai sempre em `doc`, então nenhum campo se perde no caminho; as colunas
 * continuam preenchidas para consultas, o lote das escolas e versões antigas.
 */
import { toRemoteRow, fromRemoteRow } from '../datasync/supabaseRowMapper';
import { toIsoDateOrNull } from '../../utils/isoDate';

export type SyncKind = 'list' | 'single' | 'appList' | 'appSingle';

export interface SyncTable {
  /** Identificador do fluxo (tabela ou "app_records:<coleção>"). */
  stream: string;
  /** Tabela na nuvem. */
  table: string;
  /** Chave no estado local (AppStateData). */
  key: string;
  kind: SyncKind;
  /** Só administradores gravam (políticas RLS). */
  adminOnly?: boolean;
  /** Registro -> colunas da tabela (sem id/doc/base_version). null = registro incompleto, não enviado. */
  toColumns?: (rec: any) => Record<string, any> | null;
  /** Linha antiga (sem doc) -> registro. */
  fromLegacyRow?: (row: any) => any;
  /** Ajustes na volta, mesmo com doc (dados que a nuvem é dona, campos só deste computador). */
  afterPull?: (rec: any, row: any, local: any | undefined) => any;
  /** Limpa o que não deve ir para a nuvem (ex.: senha). */
  toDoc?: (rec: any) => any;
  /** Registros que não sobem (ex.: demonstração). */
  skip?: (rec: any) => boolean;
}

export const SETTINGS_ID = 'school_settings_main';
export const APP_TABLE = 'app_records';
export const SINGLETON_COLLECTION = '__singleton';

const generic = (table: string) => (rec: any) => {
  const row = toRemoteRow(table, { ...rec });
  if (!row) return null;
  delete row.id;
  delete row.created_at;
  return row;
};

const now = () => new Date().toISOString();

export const SYNC_TABLES: SyncTable[] = [
  {
    stream: 'school_units',
    table: 'school_units',
    key: 'schoolUnits',
    kind: 'list',
    adminOnly: true,
    toColumns: (u) =>
      u?.name
        ? {
            name: u.name,
            code: u.code || u.inepCode || String(u.id),
            type: u.type || 'ESCOLA_SEDE',
            inep_code: u.inepCode || null,
            city: u.city || null,
            state: u.state || null,
            principal_name: u.directorName || u.principalName || null,
            phone: u.phone || null,
            email: u.email || null,
            active: u.active !== undefined ? u.active : true,
            logo_url: u.logoUrl || null,
            management_logo_url: u.managementLogoUrl || null,
            updated_at: u.updatedAt || now(),
          }
        : null,
  },
  {
    stream: 'school_classes',
    table: 'school_classes',
    key: 'classes',
    kind: 'list',
    toColumns: (c) =>
      c?.name
        ? {
            name: c.name,
            grade_level: c.gradeLevel || 'Ensino Fundamental',
            segment: c.segment || 'ENSINO_FUNDAMENTAL',
            shift: c.shift || 'MATUTINO',
            school_year: c.schoolYear || 2026,
            capacity: c.maxCapacity || c.capacity || 35,
            room_number: c.roomNumber || null,
            class_teacher: c.classTeacher || null,
            school_unit_id: c.schoolUnitId || null,
            updated_at: c.updatedAt || now(),
          }
        : null,
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      if (row.capacity) m.maxCapacity = row.capacity;
      return m;
    },
  },
  {
    stream: 'students',
    table: 'students',
    key: 'students',
    kind: 'list',
    toColumns: (s) =>
      s?.name && String(s.name).trim()
        ? {
            name: s.name,
            registration_number: s.enrollmentNumber || `REG-${s.id}`,
            cpf: s.cpf || null,
            rg: s.rg || null,
            birth_date: toIsoDateOrNull(s.birthDate),
            school_unit_id: s.schoolUnitId || null,
            gender: s.gender || 'OTHER',
            email: s.email || null,
            phone: s.phone || null,
            guardian_name: s.guardianName || null,
            guardian_phone: s.guardianPhone || null,
            address: s.address || null,
            city: s.city || null,
            state: s.state || null,
            class_id: s.classId || null,
            status: s.status || 'ACTIVE',
            cadastral_status: s.cadastralStatus || 'OK',
            medical_observations: s.medicalObservations || null,
            has_aee: Boolean(s.hasAEE || s.hasAeeSupport),
            location_zone: s.locationZone || 'URBANA',
            updated_at: s.updatedAt || now(),
          }
        : null,
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      if (row.registration_number) m.enrollmentNumber = row.registration_number;
      if (typeof row.has_aee === 'boolean') m.hasAEE = row.has_aee;
      delete m.registrationNumber;
      delete m.hasAee;
      return m;
    },
  },
  {
    stream: 'subjects',
    table: 'subjects',
    key: 'subjects',
    kind: 'list',
    toColumns: (s) =>
      s?.name
        ? { name: s.name, code: s.code || `COD-${s.id}`, segment: s.segment || 'ENSINO_FUNDAMENTAL', teacher_name: s.teacherName || null, workload_hours: s.workloadHours || 80 }
        : null,
  },
  {
    stream: 'courses',
    table: 'courses',
    key: 'courses',
    kind: 'list',
    toColumns: (c) =>
      c?.name ? { name: c.name, segment: c.segment || 'ENSINO_FUNDAMENTAL', duration_years: c.durationYears || 1, description: c.description || null } : null,
  },
  {
    stream: 'questions',
    table: 'questions',
    key: 'questions',
    kind: 'list',
    toColumns: (q) => ({
      code: q.code || `Q-${q.id}`,
      subject: q.subject || q.subjectId || 'Geral',
      topic: q.topic || null,
      grade_level: q.gradeLevel || null,
      bncc_skill: q.bnccSkill || null,
      difficulty: q.difficulty || 'MEDIO',
      type: q.type || 'MULTIPLE_CHOICE',
      stem: q.statement || q.stem || q.text || 'Enunciado da questão',
      options: q.options || [],
      explanation: q.explanation || null,
    }),
  },
  {
    stream: 'exams',
    table: 'exams',
    key: 'exams',
    kind: 'list',
    toColumns: (e) => ({
      title: e.title || 'Avaliação',
      description: e.description || null,
      subject: e.subject || e.subjectId || 'Geral',
      class_id: e.classId || null,
      teacher_name: e.teacherName || null,
      school_year: e.schoolYear || 2026,
      term: e.term || '1º Bimestre',
      total_points: e.totalPoints || 10,
      passing_score: e.passingScore || 6,
      time_limit_minutes: e.timeLimitMinutes || 60,
      questions: e.questions || [],
      status: e.status || 'PUBLISHED',
      scheduled_date: toIsoDateOrNull(e.scheduledDate),
      due_date_time: e.dueDateTime || null,
    }),
  },
  { stream: 'exam_submissions', table: 'exam_submissions', key: 'submissions', kind: 'list', toColumns: generic('exam_submissions') },
  { stream: 'attendance_sheets', table: 'attendance_sheets', key: 'attendanceSheets', kind: 'list', toColumns: generic('attendance_sheets') },
  { stream: 'lesson_registries', table: 'lesson_registries', key: 'lessonRegistries', kind: 'list', toColumns: generic('lesson_registries') },
  { stream: 'class_grade_sheets', table: 'class_grade_sheets', key: 'classGradeSheets', kind: 'list', toColumns: generic('class_grade_sheets') },
  { stream: 'academic_histories', table: 'academic_histories', key: 'academicHistories', kind: 'list', toColumns: generic('academic_histories') },
  {
    stream: 'bncc_skills',
    table: 'bncc_skills',
    key: 'bnccSkills',
    kind: 'list',
    toColumns: generic('bncc_skills'),
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      delete m.createdAt;
      delete m.updatedAt;
      return m;
    },
  },
  {
    stream: 'bncc_skill_assessments',
    table: 'bncc_skill_assessments',
    key: 'bnccAssessments',
    kind: 'list',
    toColumns: generic('bncc_skill_assessments'),
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      m.level = Number(row.level);
      m.term = Number(row.term);
      m.schoolYear = Number(row.school_year);
      delete m.createdAt;
      return m;
    },
  },
  {
    stream: 'user_accounts',
    table: 'user_accounts',
    key: 'userAccounts',
    kind: 'list',
    adminOnly: true,
    toColumns: (u) =>
      u?.name && u?.email
        ? {
            name: u.name,
            login: u.login || String(u.email).split('@')[0],
            email: u.email,
            role: u.role || 'TEACHER',
            sector: u.sector || 'SECRETARIA',
            sector_title: u.sectorTitle || null,
            active: u.active !== undefined ? u.active : true,
            permissions: u.permissions || {},
            phone: u.phone || null,
            school_unit_id: u.schoolUnitId || null,
          }
        : null,
    // Senha e marca de Master ficam só neste computador.
    toDoc: (u) => {
      const { password, isMaster, ...rest } = u || {};
      void password;
      void isMaster;
      return rest;
    },
    afterPull: (u, row, local) => ({
      ...u,
      password: local?.password,
      isMaster: Boolean(local?.isMaster),
      cloudSynced: true,
      // Papel desconhecido recebe o menor privilégio.
      role: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(row?.role || u?.role) ? row?.role || u?.role : 'STUDENT',
    }),
  },
  {
    stream: 'communications',
    table: 'communications',
    key: 'communications',
    kind: 'list',
    toColumns: generic('communications'),
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      m.targetRoles = Array.isArray(row.targetRoles) ? row.targetRoles : Array.isArray(row.target_roles) ? row.target_roles : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
      return m;
    },
  },
  {
    stream: 'notifications',
    table: 'notifications',
    key: 'notifications',
    kind: 'list',
    toColumns: generic('notifications'),
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      m.targetRoles = Array.isArray(row.targetRoles) ? row.targetRoles : Array.isArray(row.target_roles) ? row.target_roles : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
      m.read = Boolean(row.read);
      return m;
    },
  },
  {
    stream: 'whatsapp_messages',
    table: 'whatsapp_messages',
    key: 'whatsappLogs',
    kind: 'list',
    toColumns: generic('whatsapp_messages'),
    skip: (l) => /^wpp-\d{3}$/.test(String(l?.id || '')),
  },
  {
    stream: 'system_updates',
    table: 'system_updates',
    key: 'systemUpdates',
    kind: 'list',
    adminOnly: true,
    toColumns: (u) =>
      u?.title && u?.version
        ? {
            version: u.version,
            title: u.title,
            summary: u.summary || u.description || '',
            description: u.description || u.summary || '',
            release_date: toIsoDateOrNull(u.releaseDate) || new Date().toISOString().slice(0, 10),
            severity: u.severity || 'MAJOR',
            improvements: u.improvements || [],
          }
        : null,
  },
  {
    stream: 'school_settings',
    table: 'school_settings',
    key: 'settings',
    kind: 'single',
    adminOnly: true,
    toColumns: (s) => ({
      name: s?.name || 'Secretaria Municipal de Educação',
      trade_name: s?.tradeName || s?.name || null,
      inep_code: s?.inepCode || null,
      cnpj: s?.cnpj || null,
      address: s?.address || null,
      city: s?.city || null,
      state: s?.state || null,
      phone: s?.phone || null,
      email: s?.email || null,
      principal_name: s?.principalName || null,
      secretary_name: s?.secretaryName || null,
      logo_url: s?.logoUrl || null,
      management_logo_url: s?.managementLogoUrl || null,
    }),
    fromLegacyRow: (row) => {
      const m = fromRemoteRow(row);
      delete m.id;
      delete m.createdAt;
      delete m.updatedAt;
      return m;
    },
    // Logo vazia na nuvem não apaga a que este computador já tem.
    afterPull: (s, _row, local) => ({
      ...(local || {}),
      ...s,
      logoUrl: s?.logoUrl || local?.logoUrl,
      managementLogoUrl: s?.managementLogoUrl || local?.managementLogoUrl,
    }),
  },
  // Coleções sem tabela própria (app_records).
  ...(['teacherLessonPlans', 'teacherStudentNotes', 'stateRegulations', 'whatsappTemplates'] as const).map(
    (key): SyncTable => ({ stream: `${APP_TABLE}:${key}`, table: APP_TABLE, key, kind: 'appList' })
  ),
  ...(['municipalSecretary', 'whatsappConfig', 'rolePreferences', 'activeStateRegulationCode', 'developerContact'] as const).map(
    (key): SyncTable => ({ stream: `${APP_TABLE}:${SINGLETON_COLLECTION}:${key}`, table: APP_TABLE, key, kind: 'appSingle' })
  ),
];

/** Chave no estado local -> definição (para achar a tabela de um registro). */
export const SYNC_BY_KEY = new Map(SYNC_TABLES.map((t) => [t.key, t]));
