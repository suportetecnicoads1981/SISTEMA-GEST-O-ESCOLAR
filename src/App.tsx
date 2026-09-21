import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  Course,
  AcademicHistory,
  Question,
  Exam,
  ExamSubmission,
  SchoolSettings,
  NotificationItem,
  CommunicationMessage,
  RoleNotificationPreferences,
  UserRole,
  UserAccount,
  DeveloperContact,
  SchoolUnit,
  SyncAuditLog,
  AttendanceSheet,
  LessonDiaryRegistry,
  StateEducationRegulation,
  BnccSkill,
  ClassGradeSheet,
  TeacherLessonPlan,
  TeacherStudentPedagogicalNote,
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
  SystemUpdatePackage,
} from './types';
import {
  getStoredData,
  saveStoredData,
  logSecurityAudit,
  sendWhatsAppMessage,
  performAutoBackup,
} from './data/storage';
import { DEFAULT_ROLE_PREFERENCES } from './data/defaultData';
import { getSupabaseClient } from './services/supabaseClient';
import { supabaseBatchQueue } from './services/supabaseBatchQueue';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainOverviewDashboard } from './components/dashboard/MainOverviewDashboard';
import { StudentList } from './components/secretaria/StudentList';
import { DropoutCensusReport } from './components/secretaria/DropoutCensusReport';
import { ClassManagement } from './components/secretaria/ClassManagement';
import { ClassDiaryModule } from './components/diario/ClassDiaryModule';
import { TeacherPortalModule } from './components/professor/TeacherPortalModule';
import { DocumentIssuer, DocumentType } from './components/documentos/DocumentIssuer';
import { QuestionBank } from './components/questoes/QuestionBank';
import { ExamManager } from './components/provas/ExamManager';
import { StudentExamRoom } from './components/provas/StudentExamRoom';
import { PedagogicalDashboard } from './components/relatorios/PedagogicalDashboard';
import { AssessmentResultsReport } from './components/relatorios/AssessmentResultsReport';
import { MunicipalSyncModule } from './components/municipal/MunicipalSyncModule';
import { CommunicationModule } from './components/comunicacao/CommunicationModule';
import { WhatsAppModule } from './components/comunicacao/WhatsAppModule';
import { UserAccessControl } from './components/usuarios/UserAccessControl';
import {
  NotificationCenterModal,
  INLINE_DEFAULT_ROLE_PREFERENCES,
} from './components/notificacoes/NotificationCenterModal';
import { FeedbackSuggestionsModal } from './components/common/FeedbackSuggestionsModal';
import { NetworkInstaller } from './components/config/NetworkInstaller';
import { SystemUpdateModule } from './components/config/SystemUpdateModule';
import { AboutSystem } from './components/sobre/AboutSystem';
import { LoginScreen } from './components/auth/LoginScreen';
import { TopOverviewBanner } from './components/layout/TopOverviewBanner';
import { WelcomeUpdateModal } from './components/common/WelcomeUpdateModal';
import { VersionControlModal } from './components/version/VersionControlModal';
import { ModulesArchitectureDiagramModal } from './components/config/ModulesArchitectureDiagramModal';
import { SystemArchitectureHub } from './components/architecture/SystemArchitectureHub';
import { UniversalDataImportModal } from './components/secretaria/UniversalDataImportModal';
import { OmniDeployHub } from './components/omnideploy/OmniDeployHub';
import { NexusDeployerHub } from './components/nexusdeployer/NexusDeployerHub';
import { NexusInstallHub } from './components/nexusinstall/NexusInstallHub';
import { NexusBuildHub } from './components/nexusbuild/NexusBuildHub';
import { CleanSlateHub } from './components/cleanslate/CleanSlateHub';
import { InstalaFlowHub } from './components/instalaflow/InstalaFlowHub';
import { DataSyncProHub } from './components/datasync/DataSyncProHub';
import { AdminTIHub } from './components/admin/AdminTIHub';
import { WorkspaceTabsBar } from './components/layout/WorkspaceTabsBar';
import { WindowsTitleBar } from './components/layout/WindowsTitleBar';
import { WindowsStartMenu } from './components/layout/WindowsStartMenu';
import { WindowsTaskbar } from './components/layout/WindowsTaskbar';
import { QuickJumpSearchModal } from './components/common/QuickJumpSearchModal';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { ShortcutToast } from './components/common/ShortcutToast';
import { GuidedTourModal } from './components/common/GuidedTourModal';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { startMessageQueueWorker, stopMessageQueueWorker } from './services/messageQueueService';
import { DatabaseAutomatorService } from './services/databaseAutomatorService';

export default function App() {
  const [data, setData] = useState(() => getStoredData());
  const [activeTab, setActiveTab] = useState('MAIN_DASHBOARD');
  const [openTabs, setOpenTabs] = useState<string[]>(['MAIN_DASHBOARD']);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const session = localStorage.getItem('sucessoedu_auth_session');
      return session === 'true';
    } catch {
      return false;
    }
  });
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [isUniversalImportModalOpen, setIsUniversalImportModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(() => {
    try {
      return localStorage.getItem('sucessoedu_show_welcome_modal') === 'true';
    } catch {
      return false;
    }
  });
  const [lastUpdatePackage, setLastUpdatePackage] = useState<SystemUpdatePackage | null>(null);
  const [isArchitectureDiagramModalOpen, setIsArchitectureDiagramModalOpen] = useState(false);
  const [isVersionControlModalOpen, setIsVersionControlModalOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      return localStorage.getItem('sucessoedu_tour_seen') !== 'true';
    } catch {
      return true;
    }
  });

  // Desktop Windows Keyboard Shortcuts Layer (Ctrl+Esc para Menu Iniciar, Alt+B para Sidebar)
  useEffect(() => {
    const handleDesktopWindowsKeys = (e: KeyboardEvent) => {
      // Ctrl+Esc para alternar o Menu Iniciar
      if (e.ctrlKey && e.key === 'Escape') {
        e.preventDefault();
        setIsStartMenuOpen((prev) => !prev);
      }
      // Alt+B para alternar a barra lateral
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleDesktopWindowsKeys);
    return () => window.removeEventListener('keydown', handleDesktopWindowsKeys);
  }, []);

  // Global Keyboard Shortcuts Layer (Alt+D, Alt+S, Alt+P, Alt+K, Ctrl+K, etc.)
  const {
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isQuickSearchOpen,
    setIsQuickSearchOpen,
    activeShortcutToast,
  } = useGlobalKeyboardShortcuts({
    onNavigate: (tabId) => handleNavigate(tabId),
    isEnabled: isAuthenticated,
  });

  // User Accounts & Active Session State
  const defaultMasterUser = (data.userAccounts && data.userAccounts.length > 0)
    ? (data.userAccounts.find((u) => u.isMaster) || data.userAccounts[0])
    : {
        id: 'usr-master-001',
        name: 'Administrador Master ADS',
        email: 'suportetecnicoads@gmail.com',
        login: 'master',
        role: 'ADMIN' as UserRole,
        sector: 'MASTER' as const,
        sectorTitle: 'Administrador de Infraestrutura & Engenheiro de Software',
        isMaster: true,
        active: true,
        createdAt: '2026-01-01T08:00:00Z',
        lastLogin: new Date().toISOString(),
        permissions: {} as any,
      };

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const savedUserId = localStorage.getItem('sucessoedu_logged_user_id');
      if (savedUserId && data.userAccounts) {
        const found = data.userAccounts.find((u) => u.id === savedUserId);
        if (found) return found;
      }
    } catch {}
    return defaultMasterUser;
  });
  const currentRole: UserRole = (currentUser?.role && ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(currentUser.role))
    ? (currentUser.role as UserRole)
    : 'ADMIN';

  // Sub-navigation state for document issuance and exam taking
  const [documentSelectedStudentId, setDocumentSelectedStudentId] = useState<string | undefined>();
  const [documentSelectedType, setDocumentSelectedType] = useState<DocumentType>('CERTIFICADO_CONCLUSAO');
  const [activeExamIdForTaking, setActiveExamIdForTaking] = useState<string | null>(null);
  const [pedagogicalInitialSection, setPedagogicalInitialSection] = useState<'DASHBOARD' | 'RESULTS_BY_SCHOOL_LEVEL' | 'EVOLUTION'>('DASHBOARD');

  // Notification modal & push toast banner
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<{ title: string; body: string } | null>(null);

  // Question Bank to Exam Builder bridging state
  const [preselectedQuestionIdsForExam, setPreselectedQuestionIdsForExam] = useState<string[]>([]);

  // Sync to storage on data change & Supabase Batched Queue Upsert
  useEffect(() => {
    saveStoredData(data);
    
    function syncTablesToSupabase() {
      try {
        if (data.students && data.students.length > 0) {
          supabaseBatchQueue.enqueue('students', data.students);
        }
        if (data.exams && data.exams.length > 0) {
          supabaseBatchQueue.enqueue('exams', data.exams);
        }
        if (data.notifications && data.notifications.length > 0) {
          supabaseBatchQueue.enqueue('notifications', data.notifications);
        }
      } catch (err) {
        console.warn('Supabase batch queue enqueue error:', err);
      }
    }
    syncTablesToSupabase();
  }, [data.students, data.exams, data.notifications]);

  // Load initial state from Supabase tables (students, exams, notifications)
  useEffect(() => {
    async function loadTablesFromSupabase() {
      try {
        const supabase = getSupabaseClient();
        const [studentsRes, examsRes, notifsRes] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('exams').select('*'),
          supabase.from('notifications').select('*'),
        ]);

        setData(prev => ({
          ...prev,
          students: studentsRes.data && studentsRes.data.length > 0 ? studentsRes.data : prev.students,
          exams: examsRes.data && examsRes.data.length > 0 ? examsRes.data : prev.exams,
          notifications: notifsRes.data && notifsRes.data.length > 0
            ? notifsRes.data.map((n: any) => ({
                ...n,
                targetRoles: Array.isArray(n.targetRoles)
                  ? n.targetRoles
                  : Array.isArray(n.target_roles)
                  ? n.target_roles
                  : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
                read: Boolean(n.read),
              }))
            : prev.notifications,
        }));
      } catch (err) {
        console.warn('Supabase initial select warning:', err);
      }
    }
    loadTablesFromSupabase();
  }, []);

  // Sincronizar estado global instantaneamente quando ocorrer limpeza de base ou restauração demo
  useEffect(() => {
    const handleDbChange = (e: any) => {
      if (e.detail) {
        setData({
          ...e.detail,
          rolePreferences: (e.detail?.rolePreferences && e.detail?.rolePreferences?.ADMIN)
            ? { ...DEFAULT_ROLE_PREFERENCES, ...e.detail.rolePreferences }
            : DEFAULT_ROLE_PREFERENCES,
        });
      } else {
        setData(getStoredData());
      }
    };
    const handleDbMigrated = () => {
      setData(getStoredData());
    };
    window.addEventListener('sucessoedu_db_changed', handleDbChange);
    window.addEventListener('sucessoedu_database_migrated', handleDbMigrated);
    return () => {
      window.removeEventListener('sucessoedu_db_changed', handleDbChange);
      window.removeEventListener('sucessoedu_database_migrated', handleDbMigrated);
    };
  }, []);

  // Automação na Inicialização do Banco de Dados
  useEffect(() => {
    try {
      const config = DatabaseAutomatorService.getConfig();
      const check = DatabaseAutomatorService.checkIfMigrationNeeded();
      if (config.autoMigrateOnStartup && check.needed) {
        DatabaseAutomatorService.executeAutomatedUpdate().then(() => {
          setData(getStoredData());
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Worker de segundo plano para fila de mensagens e notificações
  useEffect(() => {
    startMessageQueueWorker(15000);
    return () => {
      stopMessageQueueWorker();
    };
  }, []);

  // Audio cue helper for notifications
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext fallback
    }
  };

  // Push notification trigger
  const triggerPushNotification = (title: string, body: string) => {
    setToastNotification({ title, body });
    setTimeout(() => {
      setToastNotification(null);
    }, 5000);

    const userPrefs =
      data?.rolePreferences?.[currentRole] ||
      DEFAULT_ROLE_PREFERENCES?.[currentRole] ||
      DEFAULT_ROLE_PREFERENCES?.ADMIN ||
      INLINE_DEFAULT_ROLE_PREFERENCES?.[currentRole] ||
      INLINE_DEFAULT_ROLE_PREFERENCES?.ADMIN;
    if (userPrefs?.soundEnabled !== false) {
      playNotificationSound();
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icon.png',
          });
        } catch {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            try {
              new Notification(title, { body });
            } catch {}
          }
        });
      }
    }
  };

  // User Accounts Handlers
  const handleUpdateUsers = (updatedUsers: UserAccount[]) => {
    setData((prev) => ({
      ...prev,
      userAccounts: updatedUsers,
    }));
    // If the currently logged in user was modified, refresh their state
    const currentInList = updatedUsers.find((u) => u.id === currentUser?.id);
    if (currentInList) {
      setCurrentUser(currentInList);
    }
    triggerPushNotification(
      '🔐 Controle de Usuários',
      'Matriz de permissões e cadastros de usuários atualizados com sucesso.'
    );
  };

  const handleSwitchCurrentUser = (user: UserAccount) => {
    setCurrentUser(user);
    triggerPushNotification(
      '👤 Sessão Alternada',
      `Você agora está operando como: ${user.name} (${user.sector})`
    );
  };

  // Developer Contact & Settings Handlers
  const handleUpdateDeveloperContact = (updatedContact: DeveloperContact) => {
    setData((prev) => ({
      ...prev,
      developerContact: updatedContact,
    }));
    triggerPushNotification(
      '🛠️ Dados do Desenvolvedor Salvos',
      `Informações da empresa ${updatedContact.company} registradas com sucesso.`
    );
  };

  const handleUpdateSettings = (updatedSettings: SchoolSettings) => {
    setData((prev) => ({
      ...prev,
      settings: updatedSettings,
    }));
    triggerPushNotification(
      '🏫 Dados Institucionais Salvos',
      `Configurações da escola e logomarca atualizadas com sucesso.`
    );
  };

  // Auto-backup on window/tab unload or system finalization
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        performAutoBackup('Fechamento de Janela / Navegador', currentUser?.name || 'Sistema');
      } catch (err) {
        console.error('Erro ao executar backup automático de segurança no fechamento:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [currentUser]);

  // Logout Handler with Automatic Safety Backup
  const handleLogout = () => {
    // Executa cópia de segurança automática com todas as informações do sistema
    const autoBackup = performAutoBackup(
      'Encerramento de Sessão (Logout)',
      currentUser?.name || 'Administrador'
    );

    logSecurityAudit(
      'LOGOUT',
      currentUser?.id || 'usr-master-001',
      currentUser?.name || 'Administrador',
      currentUser?.role || 'ADMIN',
      currentUser?.sector || 'MASTER',
      `Sessão encerrada com sucesso. Cópia de segurança automática gerada (${autoBackup.stats.studentsCount} alunos, ${autoBackup.stats.classesCount} turmas, ${autoBackup.stats.examsCount} avaliações salvas).`
    );
    try {
      localStorage.removeItem('sucessoedu_auth_session');
      localStorage.removeItem('sucessoedu_logged_user_id');
    } catch {}
    setIsAuthenticated(false);
    setOpenTabs(['MAIN_DASHBOARD']);
    triggerPushNotification(
      '🔒 Sessão Encerrada com Cópia de Segurança',
      `Backup automático gerado com sucesso (${autoBackup.stats.studentsCount} alunos e ${autoBackup.stats.examsCount} avaliações salvos no snapshot).`
    );
  };

  // Students handlers with auto-notification
  const handleSaveStudent = (student: Student) => {
    setData((prev) => {
      const exists = prev.students.some((s) => s.id === student.id);
      const updated = exists
        ? prev.students.map((s) => (s.id === student.id ? student : s))
        : [student, ...prev.students];

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: exists ? 'Matrícula Atualizada' : 'Nova Matrícula Homologada',
        message: `A ficha cadastral de ${student.name} (RA ${student.enrollmentNumber}) foi registrada com sucesso.`,
        type: 'ENROLLMENT_STATUS',
        priority: 'NORMAL',
        targetRoles: ['ADMIN', 'PARENT', 'STUDENT'],
        targetUserId: student.id,
        actionTab: 'STUDENTS',
        actionLabel: 'Ver Ficha do Aluno',
        createdAt: new Date().toISOString(),
        read: false,
      };

      return {
        ...prev,
        students: updated,
        notifications: [newNotif, ...(prev.notifications || [])],
      };
    });

    triggerPushNotification(
      '📋 Matrícula Registrada',
      `Ficha cadastral de ${student.name} atualizada na secretaria escolar.`
    );
  };

  const handleDeleteStudent = (id: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
  };

  const handleBatchImportStudents = (
    imported: Student[],
    explicitUnits?: SchoolUnit[],
    explicitClasses?: SchoolClass[]
  ) => {
    setData((prev) => {
      const existingUnits = prev.schoolUnits || [];
      const newUnits: SchoolUnit[] = [];

      // Se explicitUnits foi passado (gerado pelo módulo de importação com detecção de séries atendidas)
      if (explicitUnits && explicitUnits.length > 0) {
        explicitUnits.forEach((u) => {
          if (
            !existingUnits.some(
              (eu) =>
                eu.id === u.id ||
                eu.name.toLowerCase().trim() === u.name.toLowerCase().trim()
            ) &&
            !newUnits.some((nu) => nu.id === u.id)
          ) {
            newUnits.push(u);
          }
        });
      }

      // Também verifica se algum aluno tem schoolOriginName que ainda não está nas unidades
      imported.forEach((s) => {
        if (s.schoolOriginName) {
          const cleanName = s.schoolOriginName.replace(/^ESCOLA:\s*/i, '').trim();
          const existing = existingUnits.find(
            (u) =>
              u.name.toLowerCase() === cleanName.toLowerCase() ||
              u.name.toLowerCase() === s.schoolOriginName?.toLowerCase()
          );
          if (
            !existing &&
            !newUnits.some(
              (u) =>
                u.name.toLowerCase() === cleanName.toLowerCase() ||
                u.name.toLowerCase() === s.schoolOriginName?.toLowerCase()
            )
          ) {
            newUnits.push({
              id: `unit-remote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: cleanName || s.schoolOriginName,
              tradeName: s.schoolOriginName,
              inepCode: 'Pendente Censo',
              type: 'ESCOLA_POLO',
              locationZone: 'ZONA_RURAL',
              district: 'Polo Remoto',
              address: 'Localidade do Polo Remoto (Aguardando Regularização Cadastral da Secretaria)',
              directorName: 'Diretoria / Coordenação (Pendente de Cadastro)',
              phone: '(00) Pendente',
              email: 'polo.remoto@educacao.gov.br',
              hasInternet: false,
              syncStatus: 'PENDENTE',
              cadastralStatus: 'INCOMPLETE',
              createdViaImport: true,
              gradesServed: s.series ? [s.series] : undefined,
              gradesServedText: s.series || undefined,
              pendingFields: [
                'Código INEP Escolar',
                'Nome do(a) Diretor(a)',
                'Telefone e Contato',
                'Endereço Completo',
                'Decreto de Criação / CNPJ',
              ],
              totalStudents: 1,
              totalTeachers: 0,
              totalClasses: 1,
              lastSyncDate: new Date().toISOString(),
            });
          }
        }
      });

      // Atualiza turmas se explicitClasses foram criadas
      const existingClasses = prev.classes || [];
      const newClasses: SchoolClass[] = [];
      if (explicitClasses && explicitClasses.length > 0) {
        explicitClasses.forEach((cls) => {
          if (!existingClasses.some((ec) => ec.id === cls.id)) {
            newClasses.push(cls);
          }
        });
      }

      return {
        ...prev,
        students: [...imported, ...prev.students],
        schoolUnits: [...existingUnits, ...newUnits],
        classes: [...existingClasses, ...newClasses],
      };
    });

    const incompleteCount = imported.filter((s) => s.cadastralStatus !== 'OK').length;
    const unitsCreatedCount = explicitUnits?.length || 0;
    triggerPushNotification(
      '📥 Importação Concluída com Sucesso',
      `${imported.length} estudantes integrados ao sistema. ${unitsCreatedCount > 0 ? `${unitsCreatedCount} unidade(s) escolar(es) e séries cadastradas com pendências a regularizar. ` : ''}${incompleteCount > 0 ? `${incompleteCount} cadastros com dados incompletos destacados na Dashbox de Pendências para regularização.` : ''}`
    );
  };

  const handleIssueDocument = (studentId: string, docType?: string) => {
    setDocumentSelectedStudentId(studentId);
    if (docType) {
      setDocumentSelectedType(docType as DocumentType);
    }
    setActiveTab('DOCUMENTS');
  };

  // Classes handler
  const handleSaveClass = (newClass: SchoolClass) => {
    setData((prev) => {
      const exists = prev.classes.some((c) => c.id === newClass.id);
      const updated = exists
        ? prev.classes.map((c) => (c.id === newClass.id ? newClass : c))
        : [...prev.classes, newClass];
      return { ...prev, classes: updated };
    });
  };

  const handleDeleteClass = (id: string) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
  };

  const handleSaveSchoolUnit = (unit: SchoolUnit) => {
    setData((prev) => {
      const exists = (prev.schoolUnits || []).some((u) => u.id === unit.id);
      const updated = exists
        ? (prev.schoolUnits || []).map((u) => (u.id === unit.id ? unit : u))
        : [unit, ...(prev.schoolUnits || [])];
      return { ...prev, schoolUnits: updated };
    });
    triggerPushNotification(
      '🏫 Unidade Escolar Registrada',
      `Unidade "${unit.name}" vinculada à rede municipal com sucesso.`
    );
  };

  // Question Bank handlers
  const handleSaveQuestion = (question: Question) => {
    setData((prev) => {
      const exists = prev.questions.some((q) => q.id === question.id);
      const updated = exists
        ? prev.questions.map((q) => (q.id === question.id ? question : q))
        : [question, ...prev.questions];
      return { ...prev, questions: updated };
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const handleBatchImportQuestions = (imported: Question[]) => {
    setData((prev) => ({
      ...prev,
      questions: [...imported, ...prev.questions],
    }));
  };

  const handleCreateExamFromQuestions = (questionIds: string[]) => {
    setPreselectedQuestionIdsForExam(questionIds);
    setActiveTab('EXAMS');
  };

  // Exams handlers with auto-notification
  const handleSaveExam = (exam: Exam) => {
    setData((prev) => {
      const exists = prev.exams.some((e) => e.id === exam.id);
      const updated = exists
        ? prev.exams.map((e) => (e.id === exam.id ? exam : e))
        : [exam, ...prev.exams];

      const notifs = [...(prev.notifications || [])];
      if (exam.status === 'PUBLISHED') {
        const examNotif: NotificationItem = {
          id: `notif-exam-${Date.now()}`,
          title: `Nova Avaliação Disponível: ${exam.title}`,
          message: `A avaliação de ${exam.subject} foi disponibilizada com prazo até ${new Date(
            exam.dueDateTime
          ).toLocaleDateString('pt-BR')}.`,
          type: 'EXAM_AVAILABLE',
          priority: 'HIGH',
          targetRoles: ['STUDENT', 'PARENT', 'TEACHER'],
          targetClassId: exam.classId,
          actionTab: 'STUDENT_ROOM',
          actionLabel: 'Iniciar Avaliação',
          createdAt: new Date().toISOString(),
          read: false,
          metadata: {
            examId: exam.id,
            examTitle: exam.title,
            deadlineDate: exam.dueDateTime,
          },
        };
        notifs.unshift(examNotif);

        triggerPushNotification(
          `📝 Nova Prova: ${exam.title}`,
          `Disponível para realização na Sala do Estudante.`
        );
      }

      return { ...prev, exams: updated, notifications: notifs };
    });
  };

  const handleDeleteExam = (id: string) => {
    setData((prev) => ({
      ...prev,
      exams: prev.exams.filter((e) => e.id !== id),
    }));
  };

  const handleTakeExam = (examId: string) => {
    setActiveExamIdForTaking(examId);
    setActiveTab('STUDENT_ROOM');
  };

  // Exam submission handler with auto-notification for results
  const handleFinishSubmission = (submission: ExamSubmission) => {
    setData((prev) => {
      const notifResult: NotificationItem = {
        id: `notif-sub-${Date.now()}`,
        title: `Resultado da Prova: ${submission.studentName}`,
        message: `Avaliação finalizada com aproveitamento de ${submission.percentage}% (Nota ${submission.totalScore.toFixed(
          1
        )}/${submission.maxScore}).`,
        type: 'EXAM_RESULT',
        priority: submission.status === 'REPROVADO' ? 'HIGH' : 'NORMAL',
        targetRoles: ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'],
        targetUserId: submission.studentId,
        actionTab: 'PEDAGOGICAL_DASHBOARD',
        actionLabel: 'Ver Espelho de Correção',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          studentId: submission.studentId,
          studentName: submission.studentName,
          score: submission.totalScore,
        },
      };

      return {
        ...prev,
        submissions: [submission, ...prev.submissions],
        notifications: [notifResult, ...(prev.notifications || [])],
      };
    });

    triggerPushNotification(
      '🎯 Prova Corrigida Instantaneamente',
      `Nota ${submission.totalScore.toFixed(1)} registrada para ${submission.studentName}.`
    );
  };

  const handleViewReport = (examId: string) => {
    setActiveTab('PEDAGOGICAL_DASHBOARD');
  };

  // Notification management handlers
  const handleMarkNotificationAsRead = (id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ),
    }));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        (n?.targetRoles?.includes(currentRole) || (Array.isArray(n?.targetRoles) && n.targetRoles.length === 0) || !n?.targetRoles)
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n
      ),
    }));
  };

  const handleDeleteNotification = (id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const handleSaveNotification = (newNotif: NotificationItem) => {
    setData((prev) => ({
      ...prev,
      notifications: [newNotif, ...(prev.notifications || [])],
    }));
    triggerPushNotification(newNotif.title, newNotif.message);
  };

  const handleBatchSaveNotifications = (newNotifs: NotificationItem[]) => {
    setData((prev) => ({
      ...prev,
      notifications: [...newNotifs, ...(prev.notifications || [])],
    }));
    triggerPushNotification(
      '🚨 Alertas Preditivos Despachados',
      `${newNotifs.length} notificações automáticas prioritárias foram enviadas à Coordenação Pedagógica.`
    );
  };

  const handleSaveNotificationPreferences = (
    role: UserRole,
    prefs: RoleNotificationPreferences
  ) => {
    setData((prev) => ({
      ...prev,
      rolePreferences: {
        ...DEFAULT_ROLE_PREFERENCES,
        ...(prev.rolePreferences || {}),
        [role]: prefs,
      },
    }));
    triggerPushNotification(
      '⚙️ Preferências Salvas',
      `Configurações de alerta para o perfil ${role} atualizadas.`
    );
  };

  // Communication message handlers
  const handleSendMessage = (
    newMsg: Omit<CommunicationMessage, 'id' | 'createdAt' | 'readConfirmations'>
  ) => {
    const messageId = `msg-${Date.now()}`;
    const fullMessage: CommunicationMessage = {
      ...newMsg,
      id: messageId,
      createdAt: new Date().toISOString(),
      readConfirmations: [],
    };

    const newNotification: NotificationItem = {
      id: `notif-msg-${Date.now()}`,
      title: `📢 ${newMsg.title}`,
      message: `${newMsg.content.substring(0, 120)}...`,
      type: newMsg.priority === 'URGENTE' ? 'IMPORTANT_ANNOUNCEMENT' : 'DIRECT_MESSAGE',
      priority: newMsg.priority === 'URGENTE' ? 'URGENT' : 'NORMAL',
      targetRoles: newMsg.targetRoles,
      targetClassId: newMsg.targetClassId,
      targetUserId: newMsg.targetStudentId,
      actionTab: 'COMMUNICATION',
      actionLabel: 'Ler Comunicado Completo',
      createdAt: new Date().toISOString(),
      read: false,
      metadata: {
        announcementId: messageId,
        senderName: newMsg.senderName,
      },
    };

    setData((prev) => ({
      ...prev,
      communications: [fullMessage, ...(prev.communications || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));
  };

  const handleConfirmRead = (
    messageId: string,
    userId: string,
    userName: string,
    userRole: UserRole
  ) => {
    setData((prev) => ({
      ...prev,
      communications: prev.communications.map((msg) => {
        if (msg.id === messageId) {
          const already = msg.readConfirmations.some((c) => c.userId === userId);
          if (!already) {
            return {
              ...msg,
              readConfirmations: [
                ...msg.readConfirmations,
                { userId, userName, userRole, confirmedAt: new Date().toISOString() },
              ],
            };
          }
        }
        return msg;
      }),
    }));

    triggerPushNotification(
      '✅ Leitura Confirmada',
      `Sua confirmação foi registrada nos autos institucionais.`
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setData((prev) => ({
      ...prev,
      communications: prev.communications.filter((m) => m.id !== messageId),
    }));
  };

  // Class Diary & Attendance handlers
  const handleSaveAttendanceSheet = (sheet: AttendanceSheet) => {
    setData((prev) => {
      const existing = (prev.attendanceSheets || []).findIndex((s) => s.id === sheet.id);
      let updated: AttendanceSheet[];
      if (existing >= 0) {
        updated = [...prev.attendanceSheets];
        updated[existing] = sheet;
      } else {
        updated = [sheet, ...(prev.attendanceSheets || [])];
      }
      return { ...prev, attendanceSheets: updated };
    });

    triggerPushNotification(
      '📋 Frequência Registrada',
      'Chamada salva com sucesso para a turma.'
    );
  };

  const handleSaveLessonRegistry = (registry: LessonDiaryRegistry) => {
    setData((prev) => {
      const existing = (prev.lessonRegistries || []).findIndex((r) => r.id === registry.id);
      let updated: LessonDiaryRegistry[];
      if (existing >= 0) {
        updated = [...prev.lessonRegistries];
        updated[existing] = registry;
      } else {
        updated = [registry, ...(prev.lessonRegistries || [])];
      }
      return { ...prev, lessonRegistries: updated };
    });

    triggerPushNotification(
      '📖 Registro de Aula Salvo',
      'Conteúdo e habilidades BNCC vinculados ao diário.'
    );
  };

  const handleDeleteLessonRegistry = (registryId: string) => {
    setData((prev) => ({
      ...prev,
      lessonRegistries: (prev.lessonRegistries || []).filter((r) => r.id !== registryId),
    }));
  };

  const handleUpdateStateRegulation = (regulation: StateEducationRegulation) => {
    setData((prev) => ({
      ...prev,
      stateRegulations: (prev.stateRegulations || []).map((r) =>
        r.id === regulation.id ? regulation : r
      ),
    }));
  };

  const handleSelectActiveStateRegulation = (stateCode: string) => {
    setData((prev) => ({
      ...prev,
      activeStateRegulationCode: stateCode,
    }));
  };

  const handleImportStateRegulation = (imported: StateEducationRegulation) => {
    setData((prev) => {
      const exists = (prev.stateRegulations || []).some((r) => r.id === imported.id || r.stateCode === imported.stateCode);
      const updated = exists
        ? (prev.stateRegulations || []).map((r) =>
            r.stateCode === imported.stateCode ? imported : r
          )
        : [...(prev.stateRegulations || []), imported];
      return {
        ...prev,
        stateRegulations: updated,
        activeStateRegulationCode: imported.stateCode,
      };
    });
  };

  const handleAddBnccSkill = (skill: BnccSkill) => {
    setData((prev) => ({
      ...prev,
      bnccSkills: [skill, ...(prev.bnccSkills || [])],
    }));
  };

  // Teacher Grade Sheets, Lesson Plans & Pedagogical Notes Handlers
  const handleSaveGradeSheet = (sheet: ClassGradeSheet) => {
    setData((prev) => {
      const existing = (prev.classGradeSheets || []).findIndex((g) => g.id === sheet.id);
      let updated: ClassGradeSheet[];
      if (existing >= 0) {
        updated = [...prev.classGradeSheets];
        updated[existing] = sheet;
      } else {
        updated = [sheet, ...(prev.classGradeSheets || [])];
      }
      return { ...prev, classGradeSheets: updated };
    });

    triggerPushNotification(
      '📊 Pauta de Notas Homologada',
      `Lançamento de notas de ${sheet.subjectName} (${sheet.className}) salvo no diário oficial.`
    );
  };

  const handleSaveLessonPlan = (plan: TeacherLessonPlan) => {
    setData((prev) => {
      const existing = (prev.teacherLessonPlans || []).findIndex((p) => p.id === plan.id);
      let updated: TeacherLessonPlan[];
      if (existing >= 0) {
        updated = [...prev.teacherLessonPlans];
        updated[existing] = plan;
      } else {
        updated = [plan, ...(prev.teacherLessonPlans || [])];
      }
      return { ...prev, teacherLessonPlans: updated };
    });

    triggerPushNotification(
      '🎯 Plano de Ensino Salvo',
      `Planejamento bimestral atualizado para ${plan.subjectName} - ${plan.className}.`
    );
  };

  const handleDeleteLessonPlan = (planId: string) => {
    setData((prev) => ({
      ...prev,
      teacherLessonPlans: (prev.teacherLessonPlans || []).filter((p) => p.id !== planId),
    }));
  };

  const handleSavePedagogicalNote = (note: TeacherStudentPedagogicalNote) => {
    setData((prev) => {
      const existing = (prev.teacherStudentNotes || []).findIndex((n) => n.id === note.id);
      let updated: TeacherStudentPedagogicalNote[];
      if (existing >= 0) {
        updated = [...prev.teacherStudentNotes];
        updated[existing] = note;
      } else {
        updated = [note, ...(prev.teacherStudentNotes || [])];
      }
      return { ...prev, teacherStudentNotes: updated };
    });

    triggerPushNotification(
      '📝 Anotação Pedagógica Registrada',
      `Prontuário do(a) estudante ${note.studentName} atualizado pelo docente.`
    );
  };

  // WhatsApp Handlers
  const handleUpdateWhatsAppConfig = (newConfig: WhatsAppConfig) => {
    setData((prev) => ({
      ...prev,
      whatsappConfig: newConfig,
    }));
    logSecurityAudit(
      'SISTEMA',
      currentUser?.id || 'usr-master-001',
      currentUser?.name || 'Administrador',
      currentUser?.role || 'ADMIN',
      currentUser?.sector || 'MASTER',
      `Configuração do WhatsApp atualizada. Status: ${newConfig.status}. Instância: ${newConfig.instanceName}`
    );
    triggerPushNotification(
      '📱 WhatsApp Notificações',
      `Configurações da instância ${newConfig.instanceName} atualizadas.`
    );
  };

  const handleSendWhatsAppMessage = (logData: Omit<WhatsAppMessageLog, 'id' | 'sentAt'>) => {
    const newLog = sendWhatsAppMessage(logData);
    setData((prev) => ({
      ...prev,
      whatsappLogs: [newLog, ...(prev.whatsappLogs || [])],
    }));
    logSecurityAudit(
      'COMUNICADO',
      currentUser?.id || 'usr-master-001',
      currentUser?.name || 'Administrador',
      currentUser?.role || 'ADMIN',
      currentUser?.sector || 'MASTER',
      `Disparo de WhatsApp para ${logData.recipientName} (${logData.recipientPhone}) - Tipo: ${logData.messageType}`
    );
    triggerPushNotification(
      '📱 WhatsApp Enviado',
      `Mensagem enviada com sucesso para ${logData.recipientName}.`
    );
  };

  const handleSaveWhatsAppTemplate = (tpl: WhatsAppTemplate) => {
    setData((prev) => {
      const existing = (prev.whatsappTemplates || []).findIndex((t) => t.id === tpl.id);
      let updated: WhatsAppTemplate[];
      if (existing >= 0) {
        updated = [...(prev.whatsappTemplates || [])];
        updated[existing] = tpl;
      } else {
        updated = [tpl, ...(prev.whatsappTemplates || [])];
      }
      return { ...prev, whatsappTemplates: updated };
    });
    triggerPushNotification(
      '📋 Modelo WhatsApp Salvo',
      `Modelo de mensagem "${tpl.title}" registrado.`
    );
  };

  const handleDeleteWhatsAppTemplate = (tplId: string) => {
    setData((prev) => ({
      ...prev,
      whatsappTemplates: (prev.whatsappTemplates || []).filter((t) => t.id !== tplId),
    }));
  };

  // System Update Handlers
  const handleApplySystemUpdate = (pkg: SystemUpdatePackage) => {
    try {
      localStorage.setItem('sucessoedu_active_version', pkg.version);
      localStorage.setItem(
        'sucessoedu_last_downloaded_version',
        JSON.stringify({
          version: pkg.version,
          title: pkg.title,
          date: new Date().toISOString(),
          checksum: pkg.sha256Checksum,
          size: pkg.sizeFormatted,
        })
      );
    } catch {}

    setData((prev) => {
      const existing = (prev.systemUpdatePackages || []).findIndex((p) => p.id === pkg.id);
      let updated: SystemUpdatePackage[];
      if (existing >= 0) {
        updated = [...(prev.systemUpdatePackages || [])];
        updated[existing] = { ...pkg, isInstalled: true, installedAt: new Date().toISOString() };
      } else {
        updated = [{ ...pkg, isInstalled: true, installedAt: new Date().toISOString() }, ...(prev.systemUpdatePackages || [])];
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          systemVersion: pkg.version,
        },
        developerContact: {
          ...(prev.developerContact || {} as any),
          systemVersion: pkg.version,
        },
        systemUpdatePackages: updated,
      };
    });
    logSecurityAudit(
      'SISTEMA',
      currentUser?.id || 'usr-master-001',
      currentUser?.name || 'Administrador',
      currentUser?.role || 'ADMIN',
      currentUser?.sector || 'MASTER',
      `Pacote de Atualização ${pkg.version} instalado no sistema por ${currentUser?.name || 'Administrador'}.`
    );
    setLastUpdatePackage(pkg);
    setIsWelcomeModalOpen(true);
    try {
      localStorage.setItem('sucessoedu_show_welcome_modal', 'true');
    } catch {}
    triggerPushNotification(
      '🚀 Atualização Instalada',
      `O sistema foi atualizado com sucesso para a versão ${pkg.version}.`
    );
  };

  const handleCloseWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
    try {
      localStorage.removeItem('sucessoedu_show_welcome_modal');
    } catch {}
  };

  const handleNavigate = (tab: string, payload?: any) => {
    let target = tab;
    if (tab === 'USER_ACCESS') target = 'USER_CONTROL';
    if (tab === 'PEDAGOGICAL_EVOLUTION') {
      target = 'PEDAGOGICAL_DASHBOARD';
      setPedagogicalInitialSection('EVOLUTION');
    }
    if (tab === 'CENSUS') target = 'DROPOUT_CENSUS';
    if (tab === 'ASSESSMENT_RESULTS') target = 'ASSESSMENT_REPORT';
    if (tab === 'QUESTIONS') target = 'QUESTION_BANK';
    if (tab === 'DIARY' || tab === 'ATTENDANCE') target = 'CLASS_DIARY';
    if (tab === 'INSTALLER') target = 'NETWORK_INSTALLER';
    if (tab === 'ABOUT_SYSTEM') target = 'ABOUT';
    if (tab === 'STUDENT_LIST') target = 'STUDENTS';
    if (tab === 'CLASS_MANAGEMENT') target = 'CLASSES';
    if (tab === 'DOCUMENT_ISSUER') target = 'DOCUMENTS';
    if (tab === 'MESSAGES' || tab === 'COMMUNICATIONS') target = 'COMMUNICATION';
    if (
      tab === 'WHATSAPP_NOTIFICATIONS' ||
      tab === 'WHATSAPP_MODULE' ||
      tab === 'WHATSAPP_MESSAGES' ||
      tab === 'WHATSAPP_SETTINGS' ||
      tab === 'ZAP' ||
      tab === 'MESSAGES_WHATSAPP' ||
      tab === 'NOTIFICACOES_WHATSAPP'
    )
      target = 'WHATSAPP';
    if (tab === 'STUDENT_EXAM_ROOM') target = 'STUDENT_ROOM';
    if (tab === 'EXAM_BUILDER' || tab === 'EXAM_MANAGER') target = 'EXAMS';
    if (tab === 'UPDATES' || tab === 'SYSTEM_UPDATE') target = 'SYSTEM_UPDATES';
    if (tab === 'OMNIDEPLOY' || tab === 'OMNI_DEPLOY' || tab === 'DEPLOY') target = 'OMNI_DEPLOY';
    if (tab === 'NEXUS' || tab === 'NEXUS_DEPLOYER' || tab === 'NEXUS_DEPLOY') target = 'NEXUS_DEPLOYER';
    if (tab === 'NEXUS_INSTALL' || tab === 'NEXUSINSTALL' || tab === 'INSTALL_MANAGER' || tab === 'MODULE_INSTALLER') target = 'NEXUS_INSTALL';
    if (tab === 'NEXUS_BUILD' || tab === 'NEXUSBUILD' || tab === 'BUILD_EXE' || tab === 'PACKAGER_EXE') target = 'NEXUS_BUILD';
    if (
      tab === 'ARCHITECTURE' ||
      tab === 'DIAGRAM' ||
      tab === 'DIAGRAMA' ||
      tab === 'MODULES_DIAGRAM' ||
      tab === 'ENGENHARIA' ||
      tab === 'SOLICITACOES' ||
      tab === 'AI_PROMPTS'
    ) {
      target = 'ARCHITECTURE_DIAGRAM';
    }

    if (tab === 'PEDAGOGICAL_DASHBOARD' && payload?.section) {
      setPedagogicalInitialSection(payload.section);
    } else if (tab === 'PEDAGOGICAL_DASHBOARD' && !payload?.section) {
      setPedagogicalInitialSection('DASHBOARD');
    }

    if (payload?.studentId) {
      setDocumentSelectedStudentId(payload.studentId);
    }
    if (payload?.docType) {
      setDocumentSelectedType(payload.docType);
    }
    if (payload?.examId) {
      setActiveExamIdForTaking(payload.examId);
    }

    if (target === 'FEEDBACK' || target === 'FEEDBACK_MODAL' || target === 'SUGESTOES') {
      setIsFeedbackModalOpen(true);
      return;
    }

    if (target === 'IMPORT_DATA' || target === 'UNIVERSAL_IMPORT' || target === 'IMPORT_STUDENTS') {
      setIsUniversalImportModalOpen(true);
      return;
    }

    if (target === 'NOTIFICATIONS') {
      setIsNotificationModalOpen(true);
    } else {
      if (activeTab !== target) {
        setNavigationHistory((prev) => [...prev, activeTab]);
      }
      setActiveTab(target);
      setOpenTabs((prev) => (prev.includes(target) ? prev : [...prev, target]));
      if (target === 'STUDENT_ROOM' && !activeExamIdForTaking && (data.exams?.length || 0) > 0) {
        setActiveExamIdForTaking(data.exams[0].id);
      }
    }
  };

  const handleCloseTab = (tabId: string) => {
    if (tabId === 'MAIN_DASHBOARD') {
      setActiveTab('MAIN_DASHBOARD');
      return;
    }
    const nextTabs = openTabs.filter((t) => t !== tabId);
    const safeTabs = nextTabs.length > 0 ? nextTabs : ['MAIN_DASHBOARD'];
    setOpenTabs(safeTabs);
    if (activeTab === tabId) {
      const fallback = safeTabs[safeTabs.length - 1] || 'MAIN_DASHBOARD';
      setActiveTab(fallback);
    }
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const prev = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((h) => h.slice(0, -1));
      setActiveTab(prev);
    } else {
      setActiveTab('MAIN_DASHBOARD');
    }
  };

  const examForStudentRoom =
    data.exams?.find((e) => e.id === activeExamIdForTaking) || data.exams?.[0];

  const unreadNotificationCount = (data.notifications || []).filter(
    (n) => !n?.read && (
      n?.targetRoles?.includes(currentRole) ||
      (Array.isArray(n?.targetRoles) && n.targetRoles.length === 0) ||
      !n?.targetRoles
    )
  ).length;

  if (!isAuthenticated) {
    return (
      <LoginScreen
        userAccounts={data.userAccounts || []}
        schoolUnits={data.schoolUnits || []}
        systemVersion={data.settings?.systemVersion || 'v5.4.0-ENTERPRISE'}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          setOpenTabs(['MAIN_DASHBOARD']);
          try {
            localStorage.setItem('sucessoedu_auth_session', 'true');
            localStorage.setItem('sucessoedu_logged_user_id', user.id);
          } catch {}
          logSecurityAudit(
            'LOGIN',
            user.id,
            user.name,
            user.role,
            user.sector,
            `Login efetuado com sucesso via formulário moderno de autenticação.`
          );
          triggerPushNotification(
            '🔐 Sessão Iniciada',
            `Bem-vindo(a) ${user.name} (${user.sectorTitle || user.sector})`
          );
        }}
        companyLogoUrl={data.developerContact?.companyLogoUrl}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-white">{toastNotification.title}</h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {toastNotification.body}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra de Título Superior Estilo Windows (Titlebar & Janela Desktop) */}
      <WindowsTitleBar
        activeTab={activeTab}
        schoolName={data.settings?.name}
        onNavigate={handleNavigate}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
        onOpenArchitectureDiagram={() => setIsArchitectureDiagramModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={handleLogout}
      />

      {/* Top Header */}
      <Header
        schoolName={data.settings?.name}
        activeTab={activeTab}
        onSelectTab={(tab, payload) => handleNavigate(tab, payload)}
        onGoBack={handleGoBack}
        navigationHistory={navigationHistory}
        notifications={data.notifications || []}
        currentRole={currentRole}
        onChangeRole={(role) => {
          const matchingAccount = data.userAccounts?.find((u) => u.role === role);
          if (matchingAccount) {
            setCurrentUser(matchingAccount);
          }
        }}
        userAccounts={data.userAccounts || []}
        currentUser={currentUser}
        onSelectUserAccount={handleSwitchCurrentUser}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenArchitectureDiagram={() => setIsArchitectureDiagramModalOpen(true)}
        onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
        currentVersion={data.settings?.systemVersion || 'v5.4.1-ENTERPRISE'}
        onLogout={handleLogout}
        onToggleStartMenu={() => setIsStartMenuOpen((prev) => !prev)}
        isStartMenuOpen={isStartMenuOpen}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* Main Layout Shell */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          onLogout={handleLogout}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
          onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
          currentVersion={data.settings?.systemVersion || 'v5.4.1-ENTERPRISE'}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          counts={{
            students: data.students.length,
            exams: data.exams.length,
            questions: data.questions.length,
            submissions: data.submissions.length,
            schoolUnits: data.schoolUnits?.length || 0,
            userAccounts: data.userAccounts?.length || 0,
            unreadNotifications: unreadNotificationCount,
            unreadMessages: (data.communications || []).length,
          }}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 flex flex-col">
          <div className="max-w-7xl mx-auto space-y-4 w-full flex-1 flex flex-col">
            {/* Workspace Navigation Tabs Bar (Abas, Fechar, Voltar, Histórico) */}
            <WorkspaceTabsBar
              openTabs={openTabs}
              activeTab={activeTab}
              onSelectTab={handleNavigate}
              onCloseTab={handleCloseTab}
              onGoBack={handleGoBack}
              canGoBack={navigationHistory.length > 0}
              onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
            />

            {/* TAB: DASHBOX PRINCIPAL (VISÃO EXECUTIVA & NOTIFICAÇÕES) */}
            {activeTab === 'MAIN_DASHBOARD' && (
              <MainOverviewDashboard
                students={data.students}
                classes={data.classes}
                exams={data.exams}
                submissions={data.submissions}
                settings={data.settings}
                schoolUnits={data.schoolUnits || []}
                syncLogs={data.syncLogs || []}
                userAccounts={data.userAccounts || []}
                currentUser={currentUser}
                notifications={data.notifications || []}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                onOpenImportModal={() => setIsUniversalImportModalOpen(true)}
                onEditStudent={() => setActiveTab('STUDENTS')}
              />
            )}

            {/* TAB: PORTAL DO PROFESSOR (GESTÃO COMPLETA DE TURMAS, DIÁRIO, NOTAS, FREQUÊNCIA & PROVAS) */}
            {(activeTab === 'TEACHER_PORTAL' || activeTab === 'PROFESSOR_DASHBOARD' || activeTab === 'PROFESSOR') && (
              <TeacherPortalModule
                students={data.students}
                classes={data.classes}
                subjects={data.subjects}
                schoolUnits={data.schoolUnits || []}
                settings={data.settings}
                bnccSkills={data.bnccSkills || []}
                stateRegulations={data.stateRegulations || []}
                activeStateRegulationCode={data.activeStateRegulationCode || 'SP'}
                attendanceSheets={data.attendanceSheets || []}
                lessonRegistries={data.lessonRegistries || []}
                classGradeSheets={data.classGradeSheets || []}
                exams={data.exams}
                questions={data.questions}
                submissions={data.submissions}
                teacherLessonPlans={data.teacherLessonPlans || []}
                teacherStudentNotes={data.teacherStudentNotes || []}
                currentUserTeacherName={currentUser?.role === 'TEACHER' ? currentUser?.name : undefined}
                onSaveAttendanceSheet={handleSaveAttendanceSheet}
                onSaveLessonRegistry={handleSaveLessonRegistry}
                onDeleteLessonRegistry={handleDeleteLessonRegistry}
                onSaveGradeSheet={handleSaveGradeSheet}
                onSaveExam={handleSaveExam}
                onDeleteExam={handleDeleteExam}
                onSaveLessonPlan={handleSaveLessonPlan}
                onDeleteLessonPlan={handleDeleteLessonPlan}
                onSavePedagogicalNote={handleSavePedagogicalNote}
                onAddBnccSkill={handleAddBnccSkill}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: SECRETARIA / ESTUDANTES */}
            {activeTab === 'STUDENTS' && (
              <StudentList
                students={data.students}
                classes={data.classes}
                schoolUnits={data.schoolUnits || []}
                histories={data.academicHistories || []}
                attendanceSheets={data.attendanceSheets || []}
                classGradeSheets={data.classGradeSheets || []}
                notifications={data.notifications || []}
                onSaveNotification={handleSaveNotification}
                onBatchSaveNotifications={handleBatchSaveNotifications}
                onSaveSchoolUnit={handleSaveSchoolUnit}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onBatchImportStudents={handleBatchImportStudents}
                onIssueDocument={handleIssueDocument}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: CENSO DE EVASÃO ESCOLAR & BUSCA ATIVA MUNICIPAL */}
            {activeTab === 'DROPOUT_CENSUS' && (
              <DropoutCensusReport
                students={data.students}
                classes={data.classes}
                schoolUnits={data.schoolUnits || []}
                onUpdateStudent={handleSaveStudent}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: DIÁRIO DE CLASSE, FREQUÊNCIA & NORMATIVAS ESTADUAIS */}
            {activeTab === 'CLASS_DIARY' && (
              <ClassDiaryModule
                students={data.students}
                classes={data.classes}
                subjects={data.subjects}
                schoolUnits={data.schoolUnits || []}
                settings={data.settings}
                bnccSkills={data.bnccSkills || []}
                stateRegulations={data.stateRegulations || []}
                activeStateRegulationCode={data.activeStateRegulationCode || 'SP'}
                attendanceSheets={data.attendanceSheets || []}
                lessonRegistries={data.lessonRegistries || []}
                onSaveAttendanceSheet={handleSaveAttendanceSheet}
                onSaveLessonRegistry={handleSaveLessonRegistry}
                onDeleteLessonRegistry={handleDeleteLessonRegistry}
                onUpdateStateRegulation={handleUpdateStateRegulation}
                onSelectActiveStateRegulation={handleSelectActiveStateRegulation}
                onImportStateRegulation={handleImportStateRegulation}
                onAddBnccSkill={handleAddBnccSkill}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: TURMAS E MATRIZES */}
            {activeTab === 'CLASSES' && (
              <ClassManagement
                classes={data.classes}
                courses={data.courses}
                subjects={data.subjects}
                students={data.students}
                schoolUnits={data.schoolUnits || []}
                onSaveClass={handleSaveClass}
                onDeleteClass={handleDeleteClass}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: EMISSÃO DE DOCUMENTOS E CERTIFICADOS */}
            {activeTab === 'DOCUMENTS' && (
              <DocumentIssuer
                students={data.students}
                classes={data.classes}
                histories={data.academicHistories}
                settings={data.settings}
                preSelectedStudentId={documentSelectedStudentId}
                preSelectedDocType={documentSelectedType}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: EVOLUÇÃO PEDAGÓGICA DO ALUNO E TURMA COM GRÁFICOS */}
            {activeTab === 'PEDAGOGICAL_DASHBOARD' && (
              <PedagogicalDashboard
                initialSection={pedagogicalInitialSection}
                exams={data.exams}
                questions={data.questions}
                students={data.students}
                classes={data.classes}
                submissions={data.submissions}
                schoolUnits={data.schoolUnits || []}
                subjects={data.subjects || []}
                settings={data.settings}
                academicHistories={data.academicHistories || []}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: RELATÓRIO OFICIAL DE AVALIAÇÕES POR NÍVEL E POR ESCOLA */}
            {activeTab === 'ASSESSMENT_REPORT' && (
              <AssessmentResultsReport
                exams={data.exams}
                questions={data.questions}
                students={data.students}
                classes={data.classes}
                submissions={data.submissions}
                schoolUnits={data.schoolUnits || []}
                subjects={data.subjects || []}
                settings={data.settings}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: BANCO DE QUESTÕES BNCC */}
            {activeTab === 'QUESTION_BANK' && (
              <QuestionBank
                questions={data.questions}
                subjects={data.subjects}
                onSaveQuestion={handleSaveQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onBatchImport={handleBatchImportQuestions}
                onCreateExamWithQuestions={handleCreateExamFromQuestions}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: GERENCIADOR DE PROVAS & EXAMES */}
            {activeTab === 'EXAMS' && (
              <ExamManager
                exams={data.exams}
                questions={data.questions}
                classes={data.classes}
                subjects={data.subjects}
                submissions={data.submissions}
                settings={data.settings}
                onSaveExam={handleSaveExam}
                onDeleteExam={handleDeleteExam}
                onTakeExamAsStudent={handleTakeExam}
                onViewReport={handleViewReport}
                initialSelectedQuestionIds={preselectedQuestionIdsForExam}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: SALA DO ALUNO (AVALIAÇÃO DIGITAL COM CORREÇÃO INSTANTÂNEA) */}
            {activeTab === 'STUDENT_ROOM' && (
              <div>
                {examForStudentRoom ? (
                  <StudentExamRoom
                    exam={examForStudentRoom}
                    questions={data.questions}
                    students={data.students}
                    onFinishSubmission={handleFinishSubmission}
                    onExit={() => handleNavigate('EXAMS')}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <p className="text-slate-500 text-sm">Nenhuma prova cadastrada para realização.</p>
                    <button
                      onClick={() => handleNavigate('MAIN_DASHBOARD')}
                      className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: GESTÃO MUNICIPAL & POLOS REMOTOS FORA DA REDE (.edusync) */}
            {activeTab === 'MUNICIPAL_SYNC' && (
              <MunicipalSyncModule
                schoolUnits={data.schoolUnits || []}
                syncLogs={data.syncLogs || []}
                students={data.students}
                classes={data.classes}
                exams={data.exams}
                submissions={data.submissions}
                academicHistories={data.academicHistories}
                settings={data.settings}
                municipalSecretary={data.municipalSecretary}
                onUpdateSchoolUnits={(units) =>
                  setData((prev) => ({ ...prev, schoolUnits: units }))
                }
                onUpdateSyncLogs={(logs) =>
                  setData((prev) => ({ ...prev, syncLogs: logs }))
                }
                onUpdateMunicipalSecretary={(secretary) =>
                  setData((prev) => ({ ...prev, municipalSecretary: secretary }))
                }
                onRefreshData={() => setData(getStoredData())}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: MURAL DE COMUNICADOS */}
            {activeTab === 'COMMUNICATION' && (
              <CommunicationModule
                messages={data.communications || []}
                classes={data.classes}
                students={data.students}
                settings={data.settings}
                currentRole={currentRole}
                onSendMessage={handleSendMessage}
                onConfirmRead={handleConfirmRead}
                onDeleteMessage={handleDeleteMessage}
                onTriggerPushNotification={triggerPushNotification}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: WHATSAPP NOTIFICAÇÕES & COMUNICADOS ADMINISTRATIVOS */}
            {activeTab === 'WHATSAPP' && (
              <WhatsAppModule
                config={data.whatsappConfig || {
                  instanceName: 'sucessoedu-instancia-oficial',
                  phoneNumber: '+55 (11) 98765-4321',
                  status: 'DISCONNECTED',
                  apiKey: '',
                  webhookUrl: 'https://api.sucessoedu.edu.br/webhook/whatsapp',
                  autoNotifyGrades: true,
                  autoNotifyAttendance: true,
                  autoNotifyAnnouncements: true,
                  serverEndpoint: 'https://whatsapp-api.sucessoedu.com.br',
                }}
                logs={data.whatsappLogs || []}
                messageLogs={data.whatsappLogs || []}
                templates={data.whatsappTemplates || []}
                students={data.students}
                classes={data.classes}
                userAccounts={data.userAccounts || []}
                currentUser={currentUser}
                onUpdateConfig={handleUpdateWhatsAppConfig}
                onSendMessage={handleSendWhatsAppMessage}
                onSaveTemplate={handleSaveWhatsAppTemplate}
                onDeleteTemplate={handleDeleteWhatsAppTemplate}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: ATUALIZAÇÕES WEB & HISTÓRICO DO SISTEMA */}
            {activeTab === 'SYSTEM_UPDATES' && (
              <SystemUpdateModule
                currentVersion={data.settings?.systemVersion || 'v5.4.1-ENTERPRISE'}
                updatePackages={data.systemUpdates || []}
                onApplyUpdate={handleApplySystemUpdate}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
                onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
                currentUser={currentUser}
              />
            )}

            {/* TAB: CONTROLE DE USUÁRIOS & NÍVEIS DE ACESSO POR SETOR */}
            {activeTab === 'USER_CONTROL' && (
              <UserAccessControl
                users={data.userAccounts || []}
                currentUser={currentUser}
                schoolUnits={data.schoolUnits || []}
                auditLogs={data.auditLogs || []}
                onUpdateUsers={handleUpdateUsers}
                onSwitchCurrentUser={handleSwitchCurrentUser}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: CENTRAL DE ADMINISTRAÇÃO & TI (PAINEL GERAL E HUB DE NAVEGAÇÃO RÁPIDA) */}
            {activeTab === 'ADMIN_TI' && (
              <AdminTIHub
                schoolName={data.settings?.name || 'SucessoEdu Gestão Educacional'}
                onNavigate={handleNavigate}
                onBack={handleGoBack}
                userAccountsCount={data.userAccounts?.length || 0}
              />
            )}

            {/* TAB: OMNIDEPLOY - SISTEMA DE GESTÃO E INSTALAÇÃO HÍBRIDA (GOOGLE MATERIAL 3) */}
            {activeTab === 'OMNI_DEPLOY' && (
              <OmniDeployHub
                schoolName={data.settings?.name || 'SucessoEdu Gestão Educacional'}
                onNavigate={handleNavigate}
                onBack={handleGoBack}
              />
            )}

            {/* TAB: NEXUS DEPLOYER - PROVISIONAMENTO E UPDATES NA NUVEM */}
            {activeTab === 'NEXUS_DEPLOYER' && (
              <NexusDeployerHub
                schoolName={data.settings?.name || 'SucessoEdu Gestão Educacional'}
                onNavigate={handleNavigate}
                onBack={handleGoBack}
              />
            )}

            {/* TAB: NEXUS INSTALL - GERENCIADOR DE MÓDULOS, REDE DINÂMICA E INSTALADOR COMPACTO */}
            {activeTab === 'NEXUS_INSTALL' && (
              <NexusInstallHub
                onNavigate={handleNavigate}
                onBack={handleGoBack}
              />
            )}

            {/* TAB: SUCESSOEDU SISTEMA - SISTEMA DE DIAGNÓSTICO, INSTALAÇÃO E EMPACOTAMENTO TOTAL (C:\SucessoEduSistema) */}
            {activeTab === 'NEXUS_BUILD' && (
              <NexusBuildHub
                onNavigate={handleNavigate}
                onBack={handleGoBack}
              />
            )}

            {/* TAB: CLEANSLATE ENTERPRISE HUB - ELECTRON, REACT & SUPABASE */}
            {activeTab === 'CLEANSLATE_HUB' && (
              <CleanSlateHub
                schoolName={data.settings?.name || 'SucessoEdu Gestão Educacional'}
                onNavigate={handleNavigate}
                onBack={handleGoBack}
              />
            )}

            {/* TAB: INSTALAFLOW - SISTEMA DE GESTÃO DE DEPLOY E INSTALAÇÃO HÍBRIDA (SUPABASE EDITION) */}
            {activeTab === 'INSTALAFLOW' && (
              <InstalaFlowHub onNavigate={handleNavigate} />
            )}

            {/* TAB: DATASYNC PRO - SISTEMA INTEGRADO SUPABASE (SCHEMA DDL + WEBP + RECOVERY ZIP) */}
            {activeTab === 'DATASYNC_PRO' && (
              <DataSyncProHub />
            )}

            {/* TAB: INSTALADOR DE REDE LOCAL, NUVEM E BACKUP */}
            {activeTab === 'NETWORK_INSTALLER' && (
              <NetworkInstaller
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: DIAGRAMA DE ARQUITETURA & CENTRAL DE SOLICITAÇÕES PARA IA */}
            {activeTab === 'ARCHITECTURE_DIAGRAM' && (
              <SystemArchitectureHub
                onNavigateToTab={handleNavigate}
              />
            )}

            {/* TAB: SOBRE O SISTEMA & DADOS DO DESENVOLVEDOR */}
            {activeTab === 'ABOUT' && (
              <AboutSystem
                settings={data.settings}
                developerContact={data.developerContact}
                onUpdateDeveloperContact={handleUpdateDeveloperContact}
                onUpdateSettings={handleUpdateSettings}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
                onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* BARRA DE TAREFAS DO WINDOWS NO RODAPÉ (TASKBAR & STATUS BAR) */}
      <WindowsTaskbar
        activeTab={activeTab}
        openTabs={openTabs}
        onSelectTab={handleNavigate}
        onCloseTab={handleCloseTab}
        onToggleStartMenu={() => setIsStartMenuOpen((prev) => !prev)}
        isStartMenuOpen={isStartMenuOpen}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        unreadNotificationsCount={unreadNotificationCount}
        schoolName={data.settings?.name}
        totalStudents={data.students.length}
        totalClasses={data.classes.length}
      />

      {/* MENU INICIAR DO WINDOWS 11 (START MENU) */}
      <WindowsStartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        schoolName={data.settings?.name}
        onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
        onOpenArchitectureDiagram={() => setIsArchitectureDiagramModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* CENTRAL DE NOTIFICAÇÕES MODAL */}
      {isNotificationModalOpen && (
        <NotificationCenterModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          notifications={data?.notifications || []}
          currentRole={currentRole}
          onChangeRole={(role) => {
            const matchingAccount = data?.userAccounts?.find((u) => u.role === role);
            if (matchingAccount) {
              setCurrentUser(matchingAccount);
            }
          }}
          preferences={
            (data?.rolePreferences && data.rolePreferences?.ADMIN)
              ? data.rolePreferences
              : (DEFAULT_ROLE_PREFERENCES && DEFAULT_ROLE_PREFERENCES?.ADMIN)
              ? DEFAULT_ROLE_PREFERENCES
              : INLINE_DEFAULT_ROLE_PREFERENCES
          }
          onSavePreferences={handleSaveNotificationPreferences}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onDeleteNotification={handleDeleteNotification}
          onNavigateTab={(tab, payload) => {
            setActiveTab(tab);
            if (tab === 'DOCUMENTS' && payload?.studentId) {
              setDocumentSelectedStudentId(payload.studentId);
            }
            if (tab === 'STUDENT_ROOM' && payload?.examId) {
              setActiveExamIdForTaking(payload.examId);
            }
          }}
          onTriggerTestPush={() => {
            triggerPushNotification(
              '🔔 Teste de Notificação Push',
              'O canal de notificações está 100% operacional no SucessoEdu.'
            );
          }}
        />
      )}

      {/* CANAL DIRETO COM O DESENVOLVEDOR (FEEDBACK & SUGESTÕES WHATSAPP) */}
      <FeedbackSuggestionsModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        developerContact={data.developerContact || {
          name: 'AD SUCESSO SISTEMA',
          phone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          company: 'ADS Tecnologia e Inovação Educacional',
          email: 'suportetecnicoads@gmail.com',
          website: 'https://sucessoedu.com.br',
          roleTitle: 'Engenheiro de Software & Arquiteto Líder',
        }}
        settings={data.settings}
        currentUser={currentUser}
      />

      {/* TELA DE BOAS-VINDAS PÓS-ATUALIZAÇÃO COM NOVIDADES */}
      <WelcomeUpdateModal
        isOpen={isWelcomeModalOpen}
        onClose={handleCloseWelcomeModal}
        onNavigate={handleNavigate}
        currentVersion={data.settings?.systemVersion || 'v5.4.1-ENTERPRISE'}
        updatePackage={lastUpdatePackage}
        onOpenManual={() => handleNavigate('SYSTEM_UPDATES')}
        onOpenDiagram={() => setIsArchitectureDiagramModalOpen(true)}
        onOpenVersionControl={() => setIsVersionControlModalOpen(true)}
      />

      {/* MODAL OFICIAL DE CONTROLE DE VERSÕES E APRESENTAÇÃO DE MELHORIAS */}
      <VersionControlModal
        isOpen={isVersionControlModalOpen}
        onClose={() => setIsVersionControlModalOpen(false)}
        currentVersion={data.settings?.systemVersion || 'v5.4.1-ENTERPRISE'}
        packages={data.systemUpdates || []}
        onNavigateToModule={handleNavigate}
      />

      {/* DIAGRAMA OFICIAL DE ARQUITETURA DOS 17 MÓDULOS & CENTRAL DE SOLICITAÇÕES IA */}
      <ModulesArchitectureDiagramModal
        isOpen={isArchitectureDiagramModalOpen}
        onClose={() => setIsArchitectureDiagramModalOpen(false)}
        version={data.settings?.systemVersion || 'v5.4.1-ENTERPRISE'}
        onNavigateToTab={handleNavigate}
      />

      {/* MÓDULO UNIVERSAL DE IMPORTAÇÃO DE DADOS & POLOS REMOTOS */}
      <UniversalDataImportModal
        isOpen={isUniversalImportModalOpen}
        onClose={() => setIsUniversalImportModalOpen(false)}
        classes={data.classes}
        schoolUnits={data.schoolUnits || []}
        studentsCount={data.students.length}
        onImportStudents={handleBatchImportStudents}
        onUpdateStudent={handleSaveStudent}
        onNavigateToPendencias={() => {
          setActiveTab('STUDENTS');
        }}
        onNavigateToSchoolUnits={() => {
          setActiveTab('MUNICIPAL_SYNC');
        }}
      />

      {/* BUSCA RÁPIDA GLOBAL DE MÓDULOS (CTRL+K OU ALT+J) */}
      <QuickJumpSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onNavigate={handleNavigate}
        currentActiveTab={activeTab}
      />

      {/* GUIA DE ATALHOS DE TECLADO GLOBAIS (ALT+D, ALT+S, ALT+P, ETC.) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onNavigate={handleNavigate}
        currentActiveTab={activeTab}
      />

      {/* FEEDBACK VISUAL FLUTUANTE DE ATALHO EXECUTADO */}
      <ShortcutToast toast={activeShortcutToast} />

      {/* TOUR GUIADO (ONBOARDING) PARA NOVOS USUÁRIOS */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('sucessoedu_tour_seen', 'true');
          } catch {}
        }}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
