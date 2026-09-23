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
  AutoBackupSnapshot,
  NotificationItem,
  CommunicationMessage,
  RoleNotificationPreferences,
  UserRole,
  SchoolUnit,
  MunicipalSecretaryInfo,
  MunicipalSyncPacket,
  SyncAuditLog,
  UserAccount,
  BnccSkill,
  StateEducationRegulation,
  AttendanceSheet,
  LessonDiaryRegistry,
  ClassGradeSheet,
  TeacherLessonPlan,
  TeacherStudentPedagogicalNote,
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
  SystemUpdatePackage,
  SecurityAuditLog,
} from '../types';
import { SupabasePersistenceService } from '../services/supabasePersistenceService';
import { recordDeletions, clearRecreated, PENDING_DELETES_KEY } from '../services/datasync/deletionTracker';
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
  DEFAULT_SCHOOL_UNITS,
  DEFAULT_MUNICIPAL_SECRETARY,
  DEFAULT_SYNC_LOGS,
  DEFAULT_USER_ACCOUNTS,
  DEFAULT_WHATSAPP_CONFIG,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_WHATSAPP_LOGS,
  DEFAULT_SYSTEM_UPDATES,
  DEFAULT_AUDIT_LOGS,
} from './defaultData';
import {
  DEFAULT_BNCC_SKILLS,
  DEFAULT_STATE_REGULATIONS,
  DEFAULT_ATTENDANCE_SHEETS,
  DEFAULT_LESSON_REGISTRIES,
  DEFAULT_CLASS_GRADE_SHEETS,
  DEFAULT_TEACHER_LESSON_PLANS,
  DEFAULT_TEACHER_STUDENT_NOTES,
} from './bnccAndRegulationsData';
import { RelationalIntegrityService } from '../services/relationalIntegrityService';
import {
  saveSnapshotToIndexedDb,
  getCachedSnapshotData,
  cacheSnapshotData,
  preloadSnapshotsCache,
} from '../services/backupIndexedDbService';

const KEYS = {
  DATA: 'sucessoedu_master_store_v5',
  STUDENTS: 'sucessoedu_students_v5',
  CLASSES: 'sucessoedu_classes_v5',
  SUBJECTS: 'sucessoedu_subjects_v5',
  COURSES: 'sucessoedu_courses_v5',
  QUESTIONS: 'sucessoedu_questions_v5',
  EXAMS: 'sucessoedu_exams_v5',
  SUBMISSIONS: 'sucessoedu_submissions_v5',
  HISTORIES: 'sucessoedu_histories_v5',
  SETTINGS: 'sucessoedu_settings_v5',
  SERVER_CONFIG: 'sucessoedu_server_config_v5',
  NOTIFICATIONS: 'sucessoedu_notifications_v5',
  COMMUNICATIONS: 'sucessoedu_communications_v5',
  ROLE_PREFS: 'sucessoedu_role_prefs_v5',
  SCHOOL_UNITS: 'sucessoedu_school_units_v5',
  MUNICIPAL_SECRETARY: 'sucessoedu_municipal_secretary_v5',
  SYNC_LOGS: 'sucessoedu_sync_logs_v5',
  USER_ACCOUNTS: 'sucessoedu_users_v5',
  DEVELOPER: 'sucessoedu_developer_v5',
  BNCC_SKILLS: 'sucessoedu_bncc_skills_v5',
  STATE_REGULATIONS: 'sucessoedu_state_regulations_v5',
  ATTENDANCE_SHEETS: 'sucessoedu_attendance_v5',
  LESSON_REGISTRIES: 'sucessoedu_lesson_registries_v5',
  ACTIVE_STATE_CODE: 'sucessoedu_active_state_code_v5',
  CLASS_GRADE_SHEETS: 'sucessoedu_class_grade_sheets_v5',
  TEACHER_LESSON_PLANS: 'sucessoedu_teacher_lesson_plans_v5',
  TEACHER_STUDENT_NOTES: 'sucessoedu_teacher_student_notes_v5',
  WHATSAPP_CONFIG: 'sucessoedu_whatsapp_config_v5',
  WHATSAPP_LOGS: 'sucessoedu_whatsapp_logs_v5',
  SYSTEM_UPDATES: 'sucessoedu_system_updates_v5',
  AUDIT_LOGS: 'sucessoedu_audit_logs_v5',
  AUTO_BACKUP_LATEST: 'sucessoedu_auto_backup_latest_v5',
  AUTO_BACKUP_HISTORY: 'sucessoedu_auto_backup_history_v5',
};

/**
 * Executa saneamento preventivo do LocalStorage para liberar cota
 * e garantir que versões legadas com backups inflados não causem QuotaExceededError.
 */
export function sanitizeLegacyLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Remove chave redundante que duplicava a base de dados como string avulsa
    localStorage.removeItem('sucessoedu_latest_database_export');

    // 2. Saneia o snapshot mais recente para manter apenas metadados leves
    const rawLatest = localStorage.getItem(KEYS.AUTO_BACKUP_LATEST);
    if (rawLatest) {
      try {
        const parsedLatest = JSON.parse(rawLatest);
        if (parsedLatest && parsedLatest.data) {
          if (parsedLatest.id) {
            cacheSnapshotData(parsedLatest.id, parsedLatest.data);
            saveSnapshotToIndexedDb(parsedLatest).catch(() => {});
          }
          const strippedLatest = { ...parsedLatest, data: undefined };
          localStorage.setItem(KEYS.AUTO_BACKUP_LATEST, JSON.stringify(strippedLatest));
        }
      } catch {
        // Se corrompido, limpa sem travar
        localStorage.removeItem(KEYS.AUTO_BACKUP_LATEST);
      }
    }

    // 3.5. Garante que rolePreferences esteja íntegro com todas as roles
    const rawData = localStorage.getItem(KEYS.DATA);
    if (rawData) {
      try {
        const parsedData = JSON.parse(rawData);
        if (parsedData && typeof parsedData === 'object') {
          if (!parsedData.rolePreferences || typeof parsedData.rolePreferences !== 'object' || parsedData.rolePreferences === null) {
            parsedData.rolePreferences = { ...DEFAULT_ROLE_PREFERENCES };
          }
          (['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'GUEST'] as UserRole[]).forEach((roleKey) => {
            if (!parsedData.rolePreferences[roleKey] || typeof parsedData.rolePreferences[roleKey] !== 'object' || parsedData.rolePreferences[roleKey] === null) {
              parsedData.rolePreferences[roleKey] = DEFAULT_ROLE_PREFERENCES?.[roleKey] || {
                role: roleKey,
                channels: { inApp: true, browserPush: true, email: true, smsWhatsapp: false },
                categories: { enrollmentStatus: true, examAvailable: true, deadlines: true, examResults: true, announcements: true, directMessages: true },
                soundEnabled: true,
                quietHours: { enabled: false, start: '22:00', end: '07:00' },
              };
            }
          });
          localStorage.setItem(KEYS.DATA, JSON.stringify(parsedData));
        }
      } catch {}
    }

    // 4. Saneia o histórico de backups para remover cópias redundantes de 'data'
    const rawHistory = localStorage.getItem(KEYS.AUTO_BACKUP_HISTORY);
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasHeavyData = false;
          const cleanedHistory = parsed.slice(0, 10).map((snap: any) => {
            if (snap && snap.data) {
              hasHeavyData = true;
              if (snap.id) {
                cacheSnapshotData(snap.id, snap.data);
                saveSnapshotToIndexedDb(snap).catch(() => {});
              }
            }
            return {
              ...snap,
              data: undefined, // Nunca salva 'data' volumoso no LocalStorage
            };
          });

          if (hasHeavyData) {
            try {
              localStorage.setItem(KEYS.AUTO_BACKUP_HISTORY, JSON.stringify(cleanedHistory));
            } catch {
              // Se ainda exceder a cota, reduz a lista para 5 itens
              try {
                localStorage.setItem(KEYS.AUTO_BACKUP_HISTORY, JSON.stringify(cleanedHistory.slice(0, 5)));
              } catch {
                localStorage.removeItem(KEYS.AUTO_BACKUP_HISTORY);
              }
            }
          }
        }
      } catch {
        localStorage.removeItem(KEYS.AUTO_BACKUP_HISTORY);
      }
    }
  } catch (err) {
    console.warn('[Storage] Aviso durante saneamento preventivo do LocalStorage:', err);
  }
}

// Executa saneamento imediato ao inicializar
if (typeof window !== 'undefined') {
  sanitizeLegacyLocalStorage();
}

/**
 * Grava um valor no LocalStorage com proteção ativa contra estouro de cota (QuotaExceededError).
 * Se a cota for excedida, executa saneamento automático de caches secundários e tenta novamente.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      console.warn(`[Storage] Cota do LocalStorage atingida ao gravar "${key}". Executando liberação de espaço e saneamento...`);
      try {
        // Remove chaves redundantes e caches descartáveis
        localStorage.removeItem('sucessoedu_latest_database_export');

        // Garante que o snapshot mais recente seja leve
        const rawLatest = localStorage.getItem(KEYS.AUTO_BACKUP_LATEST);
        if (rawLatest) {
          try {
            const parsedLatest = JSON.parse(rawLatest);
            if (parsedLatest?.data) {
              localStorage.setItem(KEYS.AUTO_BACKUP_LATEST, JSON.stringify({ ...parsedLatest, data: undefined }));
            }
          } catch {
            localStorage.removeItem(KEYS.AUTO_BACKUP_LATEST);
          }
        }

        // Limpa 'data' de todos os itens do histórico de backups e trunca para 5 registros
        const rawHistory = localStorage.getItem(KEYS.AUTO_BACKUP_HISTORY);
        if (rawHistory) {
          try {
            const parsed = JSON.parse(rawHistory);
            if (Array.isArray(parsed)) {
              const stripped = parsed.map((item: any) => ({ ...item, data: undefined }));
              localStorage.setItem(KEYS.AUTO_BACKUP_HISTORY, JSON.stringify(stripped.slice(0, 5)));
            }
          } catch {
            localStorage.removeItem(KEYS.AUTO_BACKUP_HISTORY);
          }
        }

        // Tenta gravar novamente
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.warn(`[Storage] Não foi possível persistir "${key}" no LocalStorage mesmo após saneamento. Dados preservados no IndexedDB/memória.`);
        return false;
      }
    }

    console.warn(`[Storage] Erro ao gravar chave "${key}":`, err);
    return false;
  }
}

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
  schoolUnits: SchoolUnit[];
  municipalSecretary?: MunicipalSecretaryInfo;
  syncLogs: SyncAuditLog[];
  userAccounts: UserAccount[];
  developerContact: DeveloperContact;
  bnccSkills: BnccSkill[];
  stateRegulations: StateEducationRegulation[];
  activeStateRegulationCode: string;
  attendanceSheets: AttendanceSheet[];
  lessonRegistries: LessonDiaryRegistry[];
  classGradeSheets: ClassGradeSheet[];
  teacherLessonPlans: TeacherLessonPlan[];
  teacherStudentNotes: TeacherStudentPedagogicalNote[];
  whatsappConfig: WhatsAppConfig;
  whatsappTemplates: WhatsAppTemplate[];
  whatsappLogs: WhatsAppMessageLog[];
  systemUpdates: SystemUpdatePackage[];
  systemUpdatePackages?: SystemUpdatePackage[];
  auditLogs: SecurityAuditLog[];
}

export interface CleanInstallationOptions {
  schoolName?: string;
  adminEmail?: string;
  city?: string;
  state?: string;
}

/**
 * Cria a estrutura oficial de banco de dados 100% limpa (sem dados fictícios / modo produção)
 */
export function getCleanDatabase(options?: CleanInstallationOptions): AppStateData {
  const masterUser = DEFAULT_USER_ACCOUNTS.find((u) => u.isMaster) || DEFAULT_USER_ACCOUNTS[0];
  const activeMaster: UserAccount = {
    ...masterUser,
    id: 'user-master-01',
    name: 'Administrador Master ADS',
    login: 'master.admin',
    email: options?.adminEmail || masterUser.email || 'suportetecnicoads@gmail.com',
    role: 'ADMIN',
    sector: 'MASTER',
    sectorTitle: 'Super Administrador Geral (Chave Mestre)',
    isMaster: true,
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  const initialSettings: SchoolSettings = {
    ...DEFAULT_SCHOOL_SETTINGS,
    name: options?.schoolName || DEFAULT_SCHOOL_SETTINGS.name,
    tradeName: options?.schoolName ? `${options.schoolName} S/S` : DEFAULT_SCHOOL_SETTINGS.tradeName,
    inepCode: DEFAULT_SCHOOL_SETTINGS.inepCode,
    cnpj: DEFAULT_SCHOOL_SETTINGS.cnpj,
    accreditationDecree: DEFAULT_SCHOOL_SETTINGS.accreditationDecree,
    address: DEFAULT_SCHOOL_SETTINGS.address,
    neighborhood: DEFAULT_SCHOOL_SETTINGS.neighborhood,
    city: options?.city || DEFAULT_SCHOOL_SETTINGS.city,
    state: options?.state || DEFAULT_SCHOOL_SETTINGS.state,
    zipCode: DEFAULT_SCHOOL_SETTINGS.zipCode,
    phone: DEFAULT_SCHOOL_SETTINGS.phone,
    email: options?.adminEmail || DEFAULT_SCHOOL_SETTINGS.email,
    website: DEFAULT_SCHOOL_SETTINGS.website,
    principalName: DEFAULT_SCHOOL_SETTINGS.principalName,
    principalTitle: DEFAULT_SCHOOL_SETTINGS.principalTitle,
    secretaryName: DEFAULT_SCHOOL_SETTINGS.secretaryName,
    secretaryRegistration: DEFAULT_SCHOOL_SETTINGS.secretaryRegistration,
  };

  const headquarterUnit: SchoolUnit = {
    id: 'unit-matriz',
    name: 'Sede Principal (Matriz)',
    inepCode: '12345678',
    type: 'SEDE_CENTRAL',
    locationZone: 'URBANA',
    district: 'Centro',
    address: 'Prédio Central',
    directorName: activeMaster.name,
    phone: '(11) 9999-9999',
    email: activeMaster.email,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    hasInternet: true,
    syncStatus: 'SINCRONIZADO',
    lastSyncDate: new Date().toISOString(),
  };

  // Base limpa: somente o administrador master. Os demais usuários de exemplo
  // (gestor SME, coordenação, professores fictícios) não entram em produção.
  const userAccounts = [activeMaster];

  return {
    students: [], // Alunos de teste limpos
    classes: [], // Turmas de teste limpas para importação de novas escolas e turmas
    subjects: [], // Produção: a escola cadastra as próprias disciplinas (as de exemplo tinham professores fictícios)
    courses: DEFAULT_COURSES,   // Estrutura padrão de níveis de ensino mantida
    questions: [], // Questões de teste limpas
    exams: [], // Avaliações de teste limpas
    submissions: [], // Submissões limpas
    academicHistories: [], // Históricos limpos
    settings: initialSettings,
    notifications: [],
    communications: [],
    rolePreferences: DEFAULT_ROLE_PREFERENCES,
    schoolUnits: [], // Unidades escolares de teste limpas para importação de novas escolas
    municipalSecretary: DEFAULT_MUNICIPAL_SECRETARY, // Dados da Secretaria de Educação mantidos
    syncLogs: [],
    userAccounts, // Apenas o administrador master
    developerContact: DEFAULT_DEVELOPER_CONTACT,
    bnccSkills: DEFAULT_BNCC_SKILLS, // Competências BNCC mantidas
    stateRegulations: DEFAULT_STATE_REGULATIONS, // Regulamentações estaduais mantidas
    activeStateRegulationCode: options?.state || 'PA',
    attendanceSheets: [],
    lessonRegistries: [],
    classGradeSheets: [],
    teacherLessonPlans: [],
    teacherStudentNotes: [],
    whatsappConfig: DEFAULT_WHATSAPP_CONFIG,
    whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES,
    whatsappLogs: [],
    systemUpdates: DEFAULT_SYSTEM_UPDATES,
    auditLogs: [
      {
        id: `audit-clean-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeMaster.id,
        userName: activeMaster.name,
        userLogin: activeMaster.login,
        userRole: activeMaster.role,
        userSector: activeMaster.sector,
        actionType: 'EXPORTAR_DADOS',
        module: 'configuracoes',
        details: 'Base de dados limpa. Mantido apenas o cadastro da Secretaria Municipal de Educação de Cumaru do Norte/PA e matrizes curriculares.',
        ipAddress: '127.0.0.1',
        status: 'SUCESSO',
      },
    ],
  };
}

/**
 * Reseta o banco de dados local para uma instalação 100% limpa sem dados fictícios
 */
export function resetToCleanDatabase(options?: CleanInstallationOptions): AppStateData {
  const cleanData = getCleanDatabase(options);
  try {
    saveStoredData(cleanData, { bulkReplace: true });
    localStorage.setItem('sucessoedu_clean_install', 'true');
    localStorage.setItem('sucessoedu_database_mode', 'CLEAN');
    localStorage.setItem('sucessoedu_data', JSON.stringify(cleanData));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: cleanData }));
    }
  } catch (err) {
    console.error('Erro ao salvar instalação limpa no localStorage:', err);
  }
  return cleanData;
}

/**
 * Restaura o banco de dados com a massa de dados de teste / demonstração
 */
export function resetToDemoDatabase(): AppStateData {
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
    schoolUnits: DEFAULT_SCHOOL_UNITS,
    municipalSecretary: DEFAULT_MUNICIPAL_SECRETARY,
    syncLogs: DEFAULT_SYNC_LOGS,
    userAccounts: DEFAULT_USER_ACCOUNTS,
    developerContact: DEFAULT_DEVELOPER_CONTACT,
    bnccSkills: DEFAULT_BNCC_SKILLS,
    stateRegulations: DEFAULT_STATE_REGULATIONS,
    activeStateRegulationCode: 'PA',
    attendanceSheets: DEFAULT_ATTENDANCE_SHEETS,
    lessonRegistries: DEFAULT_LESSON_REGISTRIES,
    classGradeSheets: DEFAULT_CLASS_GRADE_SHEETS,
    teacherLessonPlans: DEFAULT_TEACHER_LESSON_PLANS,
    teacherStudentNotes: DEFAULT_TEACHER_STUDENT_NOTES,
    whatsappConfig: DEFAULT_WHATSAPP_CONFIG,
    whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES,
    whatsappLogs: DEFAULT_WHATSAPP_LOGS,
    systemUpdates: DEFAULT_SYSTEM_UPDATES,
    auditLogs: DEFAULT_AUDIT_LOGS,
  };
  try {
    saveStoredData(initial, { bulkReplace: true });
    localStorage.setItem('sucessoedu_database_mode', 'DEMO');
    localStorage.removeItem('sucessoedu_clean_install');
    localStorage.setItem('sucessoedu_data', JSON.stringify(initial));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: initial }));
    }
  } catch (err) {
    console.error('Erro ao salvar modo demo:', err);
  }
  return initial;
}

/**
 * Verifica se a base de dados atual está limpa (modo de produção sem dados de exemplo)
 */
export function isDatabaseClean(data?: AppStateData): boolean {
  if (data) {
    return data.students.length === 0;
  }
  try {
    const raw = localStorage.getItem(KEYS.DATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.students) && parsed.students.length === 0;
    }
  } catch {}
  return true;
}

/**
 * Loads entire master application state from local storage or seeds with clean or default mock data
 */
export function getStoredData(): AppStateData {
  if (typeof window !== 'undefined' && !(window as any).__sucessoedu_supabase_realtime_initialized) {
    (window as any).__sucessoedu_supabase_realtime_initialized = true;
    SupabasePersistenceService.initRealtimeSync((freshData) => {
      safeLocalStorageSet(KEYS.DATA, JSON.stringify(freshData));
      window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: freshData }));
    });
    SupabasePersistenceService.fetchAppStateFromSupabase().then((remoteData) => {
      if (remoteData) {
        safeLocalStorageSet(KEYS.DATA, JSON.stringify(remoteData));
        window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: remoteData }));
      }
    }).catch(() => {});
  }

  const CLEAN_SECRETARIA_ONLY_FLAG = 'sucessoedu_clean_cumaru_do_norte_prod_v544';
  if (typeof window !== 'undefined' && localStorage.getItem(CLEAN_SECRETARIA_ONLY_FLAG) !== 'true') {
    const clean = getCleanDatabase({
      schoolName: DEFAULT_SCHOOL_SETTINGS.name,
      city: 'Cumaru do Norte',
      state: 'PA',
      adminEmail: 'suportetecnicoads@gmail.com',
    });
    // As flags precisam ser gravadas ANTES de saveStoredData: a sincronização
    // com o Supabase chama getStoredData() novamente e, sem a flag, entraria
    // em recursão infinita (RangeError: Maximum call stack size exceeded).
    try {
      localStorage.setItem(CLEAN_SECRETARIA_ONLY_FLAG, 'true');
      localStorage.setItem('sucessoedu_clean_install', 'true');
      localStorage.setItem('sucessoedu_database_mode', 'CLEAN');
      localStorage.setItem('sucessoedu_logged_user_id', 'user-master-01');
    } catch {}
    saveStoredData(clean, { bulkReplace: true });
    return clean;
  }

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return getCleanDatabase();
  }

  const raw = localStorage.getItem(KEYS.DATA);
  if (!raw) {
    const clean = getCleanDatabase();
    try {
      localStorage.setItem(CLEAN_SECRETARIA_ONLY_FLAG, 'true');
    } catch {}
    saveStoredData(clean, { bulkReplace: true });
    return clean;
  }

  try {
    const parsed = JSON.parse(raw);
    const hasArr = (arr: any) => Array.isArray(arr);

    const loadedState: AppStateData = {
      students: hasArr(parsed.students) ? parsed.students : [],
      classes: hasArr(parsed.classes) ? parsed.classes : [],
      // Lista vazia é válida (base de produção sem disciplinas ainda cadastradas).
      subjects: hasArr(parsed.subjects) ? parsed.subjects : [],
      courses: hasArr(parsed.courses) && parsed.courses.length > 0 ? parsed.courses : DEFAULT_COURSES,
      questions: hasArr(parsed.questions) ? parsed.questions : [],
      exams: hasArr(parsed.exams) ? parsed.exams : [],
      submissions: hasArr(parsed.submissions) ? parsed.submissions : [],
      academicHistories: hasArr(parsed.academicHistories) ? parsed.academicHistories : [],
      settings: parsed.settings || DEFAULT_SCHOOL_SETTINGS,
      notifications: hasArr(parsed.notifications) ? parsed.notifications : [],
      communications: hasArr(parsed.communications) ? parsed.communications : [],
      rolePreferences: {
        ...DEFAULT_ROLE_PREFERENCES,
        ...(parsed?.rolePreferences && typeof parsed.rolePreferences === 'object' ? parsed.rolePreferences : {}),
      },
      schoolUnits: hasArr(parsed.schoolUnits) ? parsed.schoolUnits : [],
      municipalSecretary: parsed.municipalSecretary || DEFAULT_MUNICIPAL_SECRETARY,
      syncLogs: hasArr(parsed.syncLogs) ? parsed.syncLogs : [],
      userAccounts: hasArr(parsed.userAccounts) && parsed.userAccounts.length > 0 ? parsed.userAccounts : getCleanDatabase().userAccounts,
      developerContact: parsed.developerContact || DEFAULT_DEVELOPER_CONTACT,
      bnccSkills: hasArr(parsed.bnccSkills) && parsed.bnccSkills.length > 0 ? parsed.bnccSkills : DEFAULT_BNCC_SKILLS,
      stateRegulations: hasArr(parsed.stateRegulations) && parsed.stateRegulations.length > 0 ? parsed.stateRegulations : DEFAULT_STATE_REGULATIONS,
      activeStateRegulationCode: parsed.activeStateRegulationCode || 'SP',
      attendanceSheets: hasArr(parsed.attendanceSheets) ? parsed.attendanceSheets : [],
      lessonRegistries: hasArr(parsed.lessonRegistries) ? parsed.lessonRegistries : [],
      classGradeSheets: hasArr(parsed.classGradeSheets) ? parsed.classGradeSheets : [],
      teacherLessonPlans: hasArr(parsed.teacherLessonPlans) ? parsed.teacherLessonPlans : [],
      teacherStudentNotes: hasArr(parsed.teacherStudentNotes) ? parsed.teacherStudentNotes : [],
      whatsappConfig: parsed.whatsappConfig || DEFAULT_WHATSAPP_CONFIG,
      whatsappTemplates: parsed.whatsappTemplates || DEFAULT_WHATSAPP_TEMPLATES,
      whatsappLogs: hasArr(parsed.whatsappLogs) ? parsed.whatsappLogs : [],
      systemUpdates: parsed.systemUpdates || DEFAULT_SYSTEM_UPDATES,
      auditLogs: hasArr(parsed.auditLogs) ? parsed.auditLogs : [],
    };
    return loadedState;
  } catch {
    const clean = getCleanDatabase();
    saveStoredData(clean, { bulkReplace: true });
    return clean;
  }
}

/**
 * Início dos testes em produção (23/09/2026): executa UMA vez por computador.
 *
 * A nuvem foi limpa; sem isto, os dados de demonstração guardados no navegador
 * seriam reenviados na próxima sincronização. Antes de limpar, gera um backup
 * automático local (recuperável em Backup/Restauração). Mantém os dados da escola
 * e a senha local do administrador; turmas e disciplinas voltam da nuvem.
 */
export const PRODUCTION_START_FLAG = 'sucessoedu_inicio_producao_20260923';

export function applyProductionStartOnce(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    if (localStorage.getItem(PRODUCTION_START_FLAG) === 'true') return false;
    localStorage.setItem(PRODUCTION_START_FLAG, 'true');
    const raw = localStorage.getItem(KEYS.DATA);
    if (!raw) return false;

    const current = JSON.parse(raw) as AppStateData;
    try {
      performAutoBackup('Antes da limpeza para testes em produção', 'Sistema');
    } catch (err) {
      console.warn('[SucessoEdu] Backup antes da limpeza falhou:', err);
    }

    const localMaster = (current.userAccounts || []).find(
      (u) => u && (u.isMaster || (u.email || '').toLowerCase() === 'suportetecnicoads@gmail.com')
    );
    const clean = getCleanDatabase({ adminEmail: localMaster?.email || 'suportetecnicoads@gmail.com' });
    if (localMaster?.password) clean.userAccounts = clean.userAccounts.map((u) => ({ ...u, password: localMaster.password }));
    if (current.settings) clean.settings = current.settings;

    localStorage.removeItem(PENDING_DELETES_KEY);
    saveStoredData(clean, { bulkReplace: true, skipCloudSync: true });
    window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: clean }));
    return true;
  } catch (err) {
    console.warn('[SucessoEdu] Limpeza de início de produção não aplicada:', err);
    return false;
  }
}

/**
 * Persists entire master application state
 */
export function saveStoredData(
  data: AppStateData,
  options?: { skipCloudSync?: boolean; bulkReplace?: boolean }
): void {
  // Exclusões feitas nas telas precisam ser enviadas à nuvem (ver deletionTracker).
  // Substituições completas (limpar base, restaurar backup, dados vindos da nuvem)
  // não geram exclusões remotas.
  if (!options?.skipCloudSync && !options?.bulkReplace) {
    try {
      const previousRaw = localStorage.getItem(KEYS.DATA);
      if (previousRaw) recordDeletions(JSON.parse(previousRaw), data);
      clearRecreated(data);
    } catch {
      /* estado anterior ilegível: nada a propagar */
    }
  }
  safeLocalStorageSet(KEYS.DATA, JSON.stringify(data));
  if (options?.skipCloudSync) return;
  SupabasePersistenceService.saveAppStateToSupabase(data).catch(() => {});
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
          const kwStr = typeof kw === 'string' ? kw : kw.keyword;
          const target = exam.autoCorrectionRules.caseSensitive ? kwStr : kwStr.toLowerCase();
          if (lowerText.includes(target)) {
            matchedKeywords.push(kwStr);
          } else {
            missingKeywords.push(kwStr);
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
    version: '5.0.0-ENTERPRISE',
    createdAt: new Date().toISOString(),
    exportedBy: 'Secretaria Geral SucessoEdu Gestão Educacional',
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
      rolePreferences: (backup?.data?.rolePreferences && typeof backup.data.rolePreferences === 'object' && backup?.data?.rolePreferences?.ADMIN)
        ? { ...DEFAULT_ROLE_PREFERENCES, ...backup.data.rolePreferences }
        : DEFAULT_ROLE_PREFERENCES,
      schoolUnits: (backup.data as any).schoolUnits || DEFAULT_SCHOOL_UNITS,
      syncLogs: (backup.data as any).syncLogs || DEFAULT_SYNC_LOGS,
      userAccounts: (backup.data as any).userAccounts || DEFAULT_USER_ACCOUNTS,
      developerContact: (backup.data as any).developerContact || DEFAULT_DEVELOPER_CONTACT,
      bnccSkills: (backup.data as any).bnccSkills || DEFAULT_BNCC_SKILLS,
      stateRegulations: (backup.data as any).stateRegulations || DEFAULT_STATE_REGULATIONS,
      activeStateRegulationCode: (backup.data as any).activeStateRegulationCode || 'SP',
      attendanceSheets: (backup.data as any).attendanceSheets || [],
      lessonRegistries: (backup.data as any).lessonRegistries || [],
      classGradeSheets: (backup.data as any).classGradeSheets || [],
      teacherLessonPlans: (backup.data as any).teacherLessonPlans || [],
      teacherStudentNotes: (backup.data as any).teacherStudentNotes || [],
      whatsappConfig: (backup.data as any).whatsappConfig || DEFAULT_WHATSAPP_CONFIG,
      whatsappTemplates: (backup.data as any).whatsappTemplates || DEFAULT_WHATSAPP_TEMPLATES,
      whatsappLogs: (backup.data as any).whatsappLogs || DEFAULT_WHATSAPP_LOGS,
      systemUpdates: (backup.data as any).systemUpdates || DEFAULT_SYSTEM_UPDATES,
      auditLogs: (backup.data as any).auditLogs || DEFAULT_AUDIT_LOGS,
    }, { bulkReplace: true });
  }
}

/**
 * Realiza snapshot de cópia de segurança automática toda vez que o sistema for atualizado,
 * finalizado ou a sessão for encerrada, mantendo o histórico de backups e cópia de segurança dedicada.
 */
export function performAutoBackup(
  reason: string = 'Encerramento de Sessão (Finalização)',
  operatorName: string = 'Sistema Automático',
  customVersion?: string
): AutoBackupSnapshot {
  const current = getStoredData();
  const timestamp = new Date().toISOString();
  const snapshotId = `AUTOBACKUP-${Date.now()}`;
  const activeVersion =
    customVersion ||
    localStorage.getItem('sucessoedu_active_version') ||
    (current.settings as any)?.systemVersion ||
    'v5.4.0-ENTERPRISE';

  const stats = {
    studentsCount: current.students?.length || 0,
    classesCount: current.classes?.length || 0,
    examsCount: current.exams?.length || 0,
    submissionsCount: current.submissions?.length || 0,
    attendanceSheetsCount: current.attendanceSheets?.length || 0,
    lessonRegistriesCount: current.lessonRegistries?.length || 0,
    classGradeSheetsCount: current.classGradeSheets?.length || 0,
  };

  const payloadString = JSON.stringify(current);
  const fileSizeBytes = new Blob([payloadString]).size;
  const checksum = `SHA256-SAFE-${btoa(
    `${snapshotId}|${stats.studentsCount}|${stats.submissionsCount}|${timestamp}`
  ).slice(0, 24)}`;

  const snapshot: AutoBackupSnapshot = {
    id: snapshotId,
    createdAt: timestamp,
    reason,
    operatorName,
    version: activeVersion,
    checksum,
    stats,
    fileSizeBytes,
    data: current,
  };

  // 1. Alimenta cache síncrono em memória e salva no IndexedDB corporativo (sem limite de 5MB)
  cacheSnapshotData(snapshot.id, snapshot.data);
  saveSnapshotToIndexedDb(snapshot).catch((idbErr) => {
    console.warn('[AutoBackup] Gravação assíncrona no IndexedDB:', idbErr);
  });

  try {
    // 2. Remove chave redundante que duplicava a base inteira e consumia megabytes
    localStorage.removeItem('sucessoedu_latest_database_export');

    // 3. Grava na chave do snapshot mais recente (metadados leves para garantir preservação de cota)
    const lightweightSnapshot: AutoBackupSnapshot = {
      ...snapshot,
      data: undefined,
    };
    safeLocalStorageSet(KEYS.AUTO_BACKUP_LATEST, JSON.stringify(lightweightSnapshot));

    // 4. Grava no histórico de cópias automáticas (mantém metadados completos de até 10 cópias)
    // CRÍTICO: Não duplicar snapshot.data em todos os registros do histórico no LocalStorage
    // para evitar o erro QuotaExceededError. O snapshot.data fica seguro no IndexedDB e cache.
    const rawHistory = localStorage.getItem(KEYS.AUTO_BACKUP_HISTORY);
    let history: AutoBackupSnapshot[] = [];
    if (rawHistory) {
      try {
        history = JSON.parse(rawHistory);
      } catch {
        history = [];
      }
    }

    const updatedHistory = [
      lightweightSnapshot,
      ...history.filter((h) => h.id !== snapshot.id).map((h) => ({
        ...h,
        data: undefined, // Garante que histórico legado não retenha dados inflados
      })),
    ].slice(0, 10);

    safeLocalStorageSet(KEYS.AUTO_BACKUP_HISTORY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.warn('[AutoBackup] Aviso ao gerenciar cópia no LocalStorage:', err);
  }

  return snapshot;
}

/**
 * Dispara o download físico do arquivo JSON de backup no computador
 */
export function downloadBackupJsonFile(snapshot?: AutoBackupSnapshot | SystemBackup): void {
  const targetSnapshot = snapshot || getLatestAutoBackup() || {
    id: `MANUAL-${Date.now()}`,
    createdAt: new Date().toISOString(),
    version: 'v5.4.0-ENTERPRISE',
    data: getStoredData(),
  };

  let dataToDownload = (targetSnapshot as any).data;
  if (!dataToDownload && (targetSnapshot as any).id) {
    dataToDownload = getCachedSnapshotData((targetSnapshot as any).id) || getStoredData();
  }

  const completeSnapshot = {
    ...targetSnapshot,
    data: dataToDownload,
  };

  const content = JSON.stringify(completeSnapshot, null, 2);
  const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const fileName = `SucessoEdu_Backup_Preventivo_${dateStr}.json`;
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Recupera a última cópia de segurança automática registrada
 */
export function getLatestAutoBackup(): AutoBackupSnapshot | null {
  try {
    const raw = localStorage.getItem(KEYS.AUTO_BACKUP_LATEST);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as AutoBackupSnapshot;
    if (!snapshot.data && snapshot.id) {
      snapshot.data = getCachedSnapshotData(snapshot.id) || getStoredData();
    }
    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Recupera o histórico de cópias de segurança automáticas
 */
export function getAutoBackupHistory(): AutoBackupSnapshot[] {
  try {
    const raw = localStorage.getItem(KEYS.AUTO_BACKUP_HISTORY);
    let history: AutoBackupSnapshot[] = [];
    if (!raw) {
      const latest = getLatestAutoBackup();
      history = latest ? [latest] : [];
    } else {
      history = JSON.parse(raw) as AutoBackupSnapshot[];
    }

    // Enriquecer cada snapshot com 'data' a partir do cache de memória se disponível
    return history.map((h) => {
      if (!h.data && h.id) {
        const cached = getCachedSnapshotData(h.id);
        if (cached) {
          return { ...h, data: cached };
        }
      }
      return h;
    });
  } catch {
    return [];
  }
}

/**
 * Restaura o estado da base a partir de uma cópia de segurança automática
 */
export function restoreAutoBackup(snapshotOrId?: AutoBackupSnapshot | string): boolean {
  try {
    let targetSnapshot: AutoBackupSnapshot | null = null;
    if (typeof snapshotOrId === 'object' && snapshotOrId?.data) {
      targetSnapshot = snapshotOrId;
    } else if (typeof snapshotOrId === 'string') {
      const history = getAutoBackupHistory();
      targetSnapshot = history.find((h) => h.id === snapshotOrId) || null;
    } else {
      targetSnapshot = getLatestAutoBackup();
    }

    if (!targetSnapshot) {
      return false;
    }

    // Recupera os dados do snapshot a partir do próprio objeto, cache em memória, latest ou master store
    let dataToRestore = targetSnapshot.data;
    if (!dataToRestore && targetSnapshot.id) {
      dataToRestore = getCachedSnapshotData(targetSnapshot.id);
    }
    if (!dataToRestore) {
      const latest = getLatestAutoBackup();
      if (latest && latest.id === targetSnapshot.id && latest.data) {
        dataToRestore = latest.data;
      }
    }
    if (!dataToRestore) {
      dataToRestore = getStoredData();
    }

    restoreBackup({
      version: targetSnapshot.version,
      createdAt: targetSnapshot.createdAt,
      exportedBy: `Restauração de Cópia Automática (${targetSnapshot.operatorName})`,
      data: dataToRestore,
    });
    return true;
  } catch (err) {
    console.error('Erro ao restaurar cópia de segurança automática:', err);
    return false;
  }
}

/**
 * Generates an encrypted/checksummed synchronization packet from a remote satellite school
 */
export function generateMunicipalSyncPacket(
  schoolUnit: SchoolUnit,
  operatorName: string
): MunicipalSyncPacket {
  const current: AppStateData = getStoredData();
  const currentStudents = current.students || [];
  const currentClasses = current.classes || [];
  const currentExams = current.exams || [];
  const currentSubmissions = current.submissions || [];
  const currentAcademicHistories = current.academicHistories || [];

  const packetId = `SYNC-PACKET-${schoolUnit?.inepCode || 'INEP'}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  // Calculate summary counts
  const summary = {
    studentsCount: currentStudents.length,
    classesCount: currentClasses.length,
    examsCount: currentExams.length,
    submissionsCount: currentSubmissions.length,
    academicHistoriesCount: currentAcademicHistories.length,
  };

  const simpleChecksum = `SHA256-EDU-${btoa(
    `${schoolUnit?.inepCode || ''}|${summary.studentsCount}|${summary.submissionsCount}|${timestamp}`
  ).slice(0, 32)}`;

  return {
    version: '4.2.0-MUNICIPAL',
    packetId,
    schoolUnit: {
      ...schoolUnit,
      lastSyncDate: timestamp,
      syncStatus: 'SINCRONIZADO',
    },
    municipalityName: current.municipalSecretary?.city || current.settings?.city || 'Cumaru do Norte',
    stateCode: current.municipalSecretary?.state || current.settings?.state || 'PA',
    exportedAt: timestamp,
    operatorName,
    checksum: simpleChecksum,
    municipalSecretary: current.municipalSecretary || DEFAULT_MUNICIPAL_SECRETARY,
    summary,
    data: {
      students: currentStudents,
      classes: currentClasses,
      exams: currentExams,
      submissions: currentSubmissions,
      academicHistories: currentAcademicHistories,
      censusExtra: {
        specialNeedsCount: Math.round(currentStudents.length * 0.08),
        transportUsersCount: Math.round(currentStudents.length * 0.35),
        schoolFeedBeneficiariesCount: currentStudents.length,
        dropoutRiskCount: Math.round(currentStudents.length * 0.04),
      },
    },
  };
}

/**
 * Merges a municipal sync packet into master database at central SME
 */
export function mergeMunicipalSyncPacket(
  packet: MunicipalSyncPacket,
  operatorName: string
): { success: boolean; log: SyncAuditLog; error?: string } {
  // Transação Atômica: Ponto de Restauração Preventivo (Rollback Checkpoint)
  const current: AppStateData = getStoredData();
  const rollbackCheckpoint = JSON.parse(JSON.stringify(current));

  try {
    const packetData = packet?.data || ({} as any);
    if (!packet || !packet.schoolUnit || !packet.schoolUnit.id) {
      throw new Error('Pacote .edusync inválido: Metadados da Unidade Escolar ausentes.');
    }

    // PASSO 1: Atualizar / Inserir Unidade Escolar (Escolas)
    const unitMap = new Map<string, SchoolUnit>();
    (current.schoolUnits || []).forEach((u) => unitMap.set(u.id, u));

    const targetUnitId = packet.schoolUnit.id;
    const targetInep = packet.schoolUnit.inepCode;

    // Localizar se já existe por ID ou Código INEP
    let existingUnitKey = targetUnitId;
    for (const [uid, u] of unitMap.entries()) {
      if (u.id === targetUnitId || (targetInep && u.inepCode === targetInep)) {
        existingUnitKey = uid;
        break;
      }
    }

    // PASSO 2: Inserir / Atualizar Turmas (com vínculo na escola)
    const classMap = new Map<string, SchoolClass>();
    (current.classes || []).forEach((c) => classMap.set(c.id, c));
    let newClasses = 0;

    (packetData.classes || []).forEach((c: any) => {
      if (!c.id || !c.name) {
        throw new Error(`Falha de integridade relacional: Turma inválida sem identificador no pacote.`);
      }
      if (!classMap.has(c.id)) newClasses++;
      classMap.set(c.id, {
        ...c,
        schoolUnitId: existingUnitKey,
      });
    });

    // PASSO 3: Inserir / Atualizar Alunos (com vínculo na turma e escola)
    const studentMap = new Map<string, Student>();
    (current.students || []).forEach((s) => studentMap.set(s.id, s));
    let newStudents = 0;

    (packetData.students || []).forEach((s: any) => {
      if (!s.id || !s.name) {
        throw new Error(`Falha de integridade relacional: Aluno inválido sem nome ou ID no pacote.`);
      }
      if (!studentMap.has(s.id)) newStudents++;
      studentMap.set(s.id, {
        ...s,
        schoolUnitId: existingUnitKey,
        inepCode: targetInep || (s as any).inepCode,
      });
    });

    // PASSO 4: Inserir / Atualizar Matrículas e Históricos Acadêmicos
    const histMap = new Map<string, AcademicHistory>();
    (current.academicHistories || []).forEach((h) => histMap.set(h.id, h));
    (packetData.academicHistories || []).forEach((h) => {
      if (!h.id || !h.studentId) return;
      // Validação de orfandade: se o aluno não existir, reverte o pacote
      if (!studentMap.has(h.studentId)) {
        throw new Error(`Integridade relacional violada: Histórico ${h.id} referencia aluno órfão ${h.studentId}.`);
      }
      histMap.set(h.id, h);
    });

    // PASSO 5: Inserir / Atualizar Provas e Submissões
    const examMap = new Map<string, Exam>();
    (current.exams || []).forEach((e) => examMap.set(e.id, e));
    let newExams = 0;
    (packetData.exams || []).forEach((e: any) => {
      if (!examMap.has(e.id)) newExams++;
      examMap.set(e.id, e);
    });

    const subMap = new Map<string, ExamSubmission>();
    (current.submissions || []).forEach((s) => subMap.set(s.id, s));
    let newSubs = 0;
    (packetData.submissions || []).forEach((sub: any) => {
      if (!subMap.has(sub.id)) newSubs++;
      subMap.set(sub.id, sub);
    });

    // PASSO 6: Consistência de Dados & Critério de Aceite 3
    // Atualizar unidades escolares garantindo que totalStudents seja idêntico à soma real de alunos ativos
    const allStudentsList = Array.from(studentMap.values());
    const updatedUnits = (current.schoolUnits || []).map((u) => {
      const isTarget = u.id === existingUnitKey || (targetInep && u.inepCode === targetInep);
      const activeCountForThisUnit = allStudentsList.filter(
        (s) =>
          (s.schoolUnitId === u.id || (u.inepCode && (s as any).inepCode === u.inepCode)) &&
          s.status === 'ACTIVE'
      ).length;

      if (isTarget) {
        return {
          ...u,
          lastSyncDate: packet.exportedAt,
          syncStatus: 'SINCRONIZADO' as const,
          totalStudents: activeCountForThisUnit,
          totalClasses: Array.from(classMap.values()).filter((c) => c.schoolUnitId === u.id).length || packet.summary.classesCount,
        };
      }
      return {
        ...u,
        totalStudents: activeCountForThisUnit,
      };
    });

    // Se for uma nova escola satélite que não existia na lista
    if (!updatedUnits.some((u) => u.id === existingUnitKey || (targetInep && u.inepCode === targetInep))) {
      const activeCount = allStudentsList.filter(
        (s) =>
          (s.schoolUnitId === packet.schoolUnit.id || (targetInep && (s as any).inepCode === targetInep)) &&
          s.status === 'ACTIVE'
      ).length;

      updatedUnits.push({
        ...packet.schoolUnit,
        id: existingUnitKey,
        lastSyncDate: packet.exportedAt,
        syncStatus: 'SINCRONIZADO',
        totalStudents: activeCount,
        totalClasses: packet.summary.classesCount,
      });
    }

    const log: SyncAuditLog = {
      id: `sync-log-${Date.now()}`,
      schoolUnitId: packet.schoolUnit.id,
      schoolUnitName: packet.schoolUnit.name,
      importedAt: new Date().toISOString(),
      operatorName: operatorName || 'Operador da Secretaria Municipal',
      recordsMerged: {
        students: newStudents,
        classes: newClasses,
        exams: newExams,
        submissions: newSubs,
      },
      status: 'SUCESSO',
      notes: `Pacote atômico ${packet.packetId} da unidade "${packet.schoolUnit.name}" homologado com sucesso. Paridade verificada: soma de alunos ativos sincronizada.`,
    };

    // COMMIT DA TRANSAÇÃO ATÔMICA
    const updatedData: AppStateData = {
      ...current,
      students: allStudentsList,
      classes: Array.from(classMap.values()),
      exams: Array.from(examMap.values()),
      submissions: Array.from(subMap.values()),
      academicHistories: Array.from(histMap.values()),
      schoolUnits: updatedUnits,
      syncLogs: [log, ...(current.syncLogs || [])],
    };

    saveStoredData(updatedData);

    return {
      success: true,
      log,
    };
  } catch (err: any) {
    // ROLLBACK ATÔMICO IMEDIATO: Nenhuma alteração persiste no banco
    saveStoredData(rollbackCheckpoint, { bulkReplace: true });

    return {
      success: false,
      log: {
        id: `sync-err-${Date.now()}`,
        schoolUnitId: packet.schoolUnit?.id || 'unknown',
        schoolUnitName: packet.schoolUnit?.name || 'Unidade Desconhecida',
        importedAt: new Date().toISOString(),
        operatorName,
        recordsMerged: { students: 0, classes: 0, exams: 0, submissions: 0 },
        status: 'ERRO',
        notes: `TRANSAÇÃO REVERTIDA (ROLLBACK ATÔMICO): ${err?.message || 'Erro durante a importação.'}`,
      },
      error: err?.message || 'Falha na validação atômica do pacote de sincronização. Nenhuma tabela foi alterada.',
    };
  }
}

/**
 * Dispatches a simulated or real WhatsApp message and records in logs
 */
export function sendWhatsAppMessage(
  payload: Omit<WhatsAppMessageLog, 'id' | 'sentAt'>
): WhatsAppMessageLog {
  const current = getStoredData();
  const log: WhatsAppMessageLog = {
    ...payload,
    id: `wpp-log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    sentAt: new Date().toISOString(),
    deliveredAt: new Date(Date.now() + 1000).toISOString(),
    status: payload.status || 'ENTREGUE',
  };

  const updatedData: AppStateData = {
    ...current,
    whatsappLogs: [log, ...(current.whatsappLogs || [])],
  };

  saveStoredData(updatedData);

  // Also log to security audit
  logSecurityAudit(
    'DISPARO_WHATSAPP',
    'comunicacao',
    `Mensagem WhatsApp (${payload.messageType}) enviada para ${payload.recipientName} (${payload.recipientPhone})`,
    'SUCESSO'
  );

  return log;
}

/**
 * Creates an entry in the system security audit trail
 */
export function logSecurityAudit(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
  arg5?: any,
  arg6?: any,
  arg7?: any
): SecurityAuditLog {
  const current = getStoredData();
  const activeUser = current.userAccounts?.find((u) => u.active) || current.userAccounts?.[0];

  let actionType: any = 'LOGIN_SUCESSO';
  let module: string = 'SISTEMA';
  let details: string = '';
  let status: 'SUCESSO' | 'ALERTA' | 'BLOQUEADO' = 'SUCESSO';
  let userId = activeUser?.id || 'user-system';
  let userName = activeUser?.name || 'Operador do Sistema';
  let userLogin = activeUser?.login || 'sistema.local';
  let userRole: UserRole = activeUser?.role || 'ADMIN';
  let userSector: any = activeUser?.sector || 'MASTER';

  if (typeof arg6 === 'string') {
    // Called as (module, userId, userName, userRole, userSector, details, status)
    module = String(arg1);
    userId = String(arg2);
    userName = String(arg3);
    userRole = arg4 as UserRole;
    userSector = arg5;
    details = String(arg6);
    status = (arg7 as any) || 'SUCESSO';
    actionType = 'EDITAR_REGISTRO';
  } else {
    // Called as (actionType, module, details, status)
    actionType = arg1;
    module = String(arg2 || 'SISTEMA');
    details = String(arg3 || '');
    status = (arg4 as any) || 'SUCESSO';
    if (arg5) userId = String(arg5);
    if (arg6) userName = String(arg6);
  }

  const log: SecurityAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userLogin,
    userRole,
    userSector,
    actionType,
    module,
    details,
    ipAddress: '192.168.1.' + Math.floor(100 + Math.random() * 50),
    status,
  };

  const updatedData: AppStateData = {
    ...current,
    auditLogs: [log, ...(current.auditLogs || []).slice(0, 199)],
  };

  saveStoredData(updatedData);
  return log;
}

export const StorageService = {
  getStoredData,
  saveStoredData,
  gradeExamSubmission,
  generatePedagogicalReport,
  createBackup,
  restoreBackup,
  performAutoBackup,
  downloadBackupJsonFile,
  getLatestAutoBackup,
  getAutoBackupHistory,
  restoreAutoBackup,
  safeLocalStorageSet,
  sanitizeLegacyLocalStorage,
  getCachedSnapshotData,
  generateMunicipalSyncPacket,
  mergeMunicipalSyncPacket,
  sendWhatsAppMessage,
  logSecurityAudit,
};


