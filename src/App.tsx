import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
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
  WhatsAppMessageType,
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
  BnccSkillAssessment,
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
  performAutoBackup,
} from './data/storage';
import {
  DEFAULT_ROLE_PREFERENCES,
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_MUNICIPAL_SECRETARY,
  DEFAULT_DEVELOPER_CONTACT,
} from './data/defaultData';
import { getSupabaseClient } from './services/supabaseClient';
import { startCloudSync, syncNow as syncCloudNow } from './services/sync/cloudSync';
import { shouldKeepCloudSession } from './services/offline/cloudSessionPreference';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BnccSkillsModule } from './components/bncc/BnccSkillsModule';
import { upsertAssessments, removeAssessments, mergeSkills } from './services/bncc/bnccAssessmentService';
import { replaceSubmissions, studentsForExam } from './services/bncc/examSkillService';
import { HelpCenterModal } from './components/common/HelpCenterModal';
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
import { AssessmentResultsReport } from './components/relatorios/AssessmentResultsReport';
import { PedagogicalDashboard } from './components/relatorios/PedagogicalDashboard';
import { CommunicationModule } from './components/comunicacao/CommunicationModule';
import { WhatsAppModule } from './components/comunicacao/WhatsAppModule';
import { UserAccessControl } from './components/usuarios/UserAccessControl';
import {
  NotificationCenterModal,
  INLINE_DEFAULT_ROLE_PREFERENCES,
} from './components/notificacoes/NotificationCenterModal';
import { normalizeRole, getRolePreferenceSafely } from './utils/roleNormalizer';
import { AuthBarrier } from './components/auth/AuthBarrier';
import { FeedbackSuggestionsModal } from './components/common/FeedbackSuggestionsModal';
import { DevBacklogModule, isDevBacklogOwner } from './components/admin/DevBacklogModule';
import { AboutSystem } from './components/sobre/AboutSystem';
import { LoginScreen } from './components/auth/LoginScreen';
import { UniversalDataImportModal } from './components/secretaria/UniversalDataImportModal';
import { WorkspaceTabsBar } from './components/layout/WorkspaceTabsBar';
import { WindowsTitleBar } from './components/layout/WindowsTitleBar';
import { WindowsStartMenu } from './components/layout/WindowsStartMenu';
import { WindowsTaskbar } from './components/layout/WindowsTaskbar';
import { QuickJumpSearchModal } from './components/common/QuickJumpSearchModal';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { ShortcutToast } from './components/common/ShortcutToast';
import { GuidedTourModal, isTourDismissedAsync, dismissTourForever } from './components/common/GuidedTourModal';
import { ModuleLoadingFallback } from './components/common/ModuleLoadingFallback';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { drainMessageQueue, subscribeToMessageQueue } from './services/messageQueueService';
import { isDemoLog } from './services/whatsapp/whatsappAssist';
import type { WhatsAppPrefill } from './components/comunicacao/WhatsAppModule';
import { DatabaseAutomatorService } from './services/databaseAutomatorService';

import { lazyModule } from './utils/lazyModule';
import { appVersionLabel } from './config/appVersion';
// Módulos de TI pesados (geradores de instaladores e do app offline) só carregam quando abertos.
const NetworkInstaller = lazyModule(() => import('./components/config/NetworkInstaller').then((m) => ({ default: m.NetworkInstaller })));
const SystemUpdateModule = lazyModule(() => import('./components/config/SystemUpdateModule').then((m) => ({ default: m.SystemUpdateModule })));
const MunicipalSyncModule = lazyModule(() => import('./components/municipal/MunicipalSyncModule').then((m) => ({ default: m.MunicipalSyncModule })));
const AdminTIHub = lazyModule(() => import('./components/admin/AdminTIHub').then((m) => ({ default: m.AdminTIHub })));
import { isTabAvailable } from './config/features';
import { notify, confirmDialog } from './utils/dialogs';
import { getLocalServerInfo } from './services/offline/localServerSync';
import { setDocumentBranding } from './services/documentBranding';
import { runCloudSyncNow } from './services/offline/cloudAutoSync';
import { normalizeSchoolLinks } from './utils/schoolDataNormalizer';
import { isProvisionalRa, resolveProvisionalRas } from './services/raService';
import { clearLocalServerSession } from './services/offline/localServerSync';
import { computeDropoutRisk, describeDropoutCriterion } from './utils/dropoutRiskEngine';
import { DropoutRiskAlertModal } from './components/common/DropoutRiskAlertModal';
import { can as canAccess, canOpenTab, deniedTabMessage, describeDenials, enforceDataPermissions } from './services/rbac/accessControl';
import { scopeDataToSchool, userSchoolScope } from './services/rbac/schoolScope';
import { annexesOf } from './utils/schoolAnnexes';
import { focusSchoolIds, readStoredFocus, restoreHiddenRecords, scopeDataToFocus, storeFocus, type SchoolFocus } from './services/rbac/schoolFocus';
import { moduleName } from './config/moduleNames';

export default function App() {
  // setDataRaw: gravação sem checagem (dados vindos da nuvem, restauração, rotinas do sistema).
  // setData: gravação feita pelo operador — passa pelos privilégios do usuário (accessControl).
  const [data, setDataRaw] = useState(() => getStoredData());
  const accessActorRef = useRef<any>(null);
  // Escolas da "escola em foco" (usuário da rede que escolheu uma escola no topo da tela)
  const focusIdsRef = useRef<string[]>([]);
  const lastDeniedNoticeRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const setData = useCallback((action: React.SetStateAction<ReturnType<typeof getStoredData>>) => {
    setDataRaw((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      const checked = enforceDataPermissions(prev as any, next as any, accessActorRef.current);
      const denied = checked.denied;
      // Com escola em foco, a tela não conhece os registros das outras escolas: nada delas é apagado.
      const allowed = restoreHiddenRecords(prev as any, checked.next as any, focusIdsRef.current);
      if (denied.length) {
        const text = describeDenials(denied);
        const last = lastDeniedNoticeRef.current;
        if (last.text !== text || Date.now() - last.at > 1500) {
          lastDeniedNoticeRef.current = { text, at: Date.now() };
          setTimeout(() => notify(text, 'Permissão negada'), 0);
        }
      }
      return allowed as any;
    });
  }, []);
  // Estado que acabou de chegar do Supabase: é gravado apenas localmente, sem ser
  // reenviado à nuvem (evita o ciclo upsert → evento realtime → recarga → upsert).
  const remoteOriginDataRef = useRef<unknown>(null);
  // Estado mais recente (para ações disparadas por eventos, ex.: revisar vínculos).
  const dataRef = useRef(data);
  dataRef.current = data;
  const [activeTab, setActiveTab] = useState('MAIN_DASHBOARD');
  const [openTabs, setOpenTabs] = useState<string[]>(['MAIN_DASHBOARD']);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const session = localStorage.getItem('sucessoedu_auth_session');
      // A sessão só é restaurada se a conta que fez login ainda existir e estiver ativa;
      // antes, uma conta removida caía no usuário Master padrão.
      const savedUserId = localStorage.getItem('sucessoedu_logged_user_id');
      const account = (data.userAccounts || []).find((u) => u.id === savedUserId);
      return session === 'true' && Boolean(account) && account?.active !== false;
    } catch {
      return false;
    }
  });
  // Conta que efetivamente se autenticou (a troca de operador no cabeçalho não altera este valor).
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sucessoedu_logged_user_id');
    } catch {
      return null;
    }
  });
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [isUniversalImportModalOpen, setIsUniversalImportModalOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Tira-dúvidas (botão no alto da tela e tecla F1)
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [whatsappPrefill, setWhatsappPrefill] = useState<WhatsAppPrefill | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // O Tour só abre depois de conferir todas as reservas da escolha "Não mostrar mais"
  // (navegador, cookie, IndexedDB e cadastro do usuário). Antes abria na hora e reaparecia
  // quando o armazenamento do navegador estava cheio.
  const [isTourOpen, setIsTourOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    let userDismissed = false;
    try {
      const uid = localStorage.getItem('sucessoedu_logged_user_id');
      const me = uid ? (data.userAccounts || []).find((u: any) => u?.id === uid) : null;
      userDismissed = !!(me as any)?.tourDismissed;
    } catch {
      /* sem armazenamento */
    }
    if (userDismissed) {
      dismissTourForever();
      return;
    }
    isTourDismissedAsync().then((d) => {
      if (alive && !d) setIsTourOpen(true);
    });
    return () => {
      alive = false;
    };
    // Somente ao abrir o sistema.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Papel desconhecido recebe o menor privilégio (antes caía em ADMIN).
  const currentRole: UserRole = (currentUser?.role && ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(currentUser.role))
    ? (currentUser.role as UserRole)
    : 'STUDENT';

  const authenticatedAccount = (data.userAccounts || []).find((u) => u.id === authenticatedUserId);
  // Operador em uso, com as permissões mais recentes do cadastro (vale para toda gravação).
  const accessActor = isAuthenticated
    ? (data.userAccounts || []).find((u) => u.id === currentUser?.id) || currentUser
    : null;
  accessActorRef.current = accessActor;

  // ---- Escola de lotação: quem está lotado numa escola vê só os dados dela ----
  // O estado completo (data) continua inteiro para gravação e sincronização; as telas recebem viewData.
  const schoolScope = userSchoolScope(accessActor as any);
  // Transferências: lotado numa escola só transfere para ela e as anexas; a rede inteira é da Secretaria.
  const transferScopeIds = useMemo(
    () => (schoolScope ? [schoolScope, ...annexesOf(schoolScope, data?.schoolUnits || []).map((u) => u.id)] : null),
    [schoolScope, data?.schoolUnits]
  );
  const transferStudentsPool = useMemo(() => {
    const all = data?.students || [];
    if (!transferScopeIds) return all;
    const ids = new Set(transferScopeIds);
    // Lotado: além dos próprios alunos, só os que SAÍRAM da escola dele (para o filtro "enviados").
    return all.filter(
      (st) => ids.has(st.schoolUnitId || '') || (st.transfers || []).some((t) => t.fromUnitId && ids.has(t.fromUnitId))
    );
  }, [data?.students, transferScopeIds]);

  // ---- Escola em foco: quem vê a rede inteira escolhe no topo com qual escola quer trabalhar ----
  const [schoolFocus, setSchoolFocusState] = useState<SchoolFocus | null>(null);
  const focusUserId = (accessActor as any)?.id || null;
  useEffect(() => {
    setSchoolFocusState(readStoredFocus(focusUserId));
  }, [focusUserId]);
  const handleChangeSchoolFocus = useCallback(
    (focus: SchoolFocus | null) => {
      setSchoolFocusState(focus);
      storeFocus(focusUserId, focus);
    },
    [focusUserId]
  );
  const canChooseSchoolFocus = isAuthenticated && !schoolScope;
  const focusIds = useMemo(() => {
    if (!canChooseSchoolFocus || !schoolFocus) return [] as string[];
    // Escola que não existe mais (ex.: apagada) volta para a rede inteira
    if (!(data.schoolUnits || []).some((u) => u.id === schoolFocus.unitId)) return [] as string[];
    return focusSchoolIds(schoolFocus, data.schoolUnits || []);
  }, [canChooseSchoolFocus, schoolFocus, data.schoolUnits]);
  focusIdsRef.current = focusIds;

  const viewData = useMemo(
    () => (schoolScope ? scopeDataToSchool(data, schoolScope) : scopeDataToFocus(data, focusIds)),
    [data, schoolScope, focusIds]
  );

  // ---- Risco de evasão por faltas sem justificativa (gatilho configurável no Censo) ----
  // Usuário lotado numa escola vê só os alunos dela; o Master e a rede veem todos.
  const riskScopeUnit = schoolScope || undefined;
  const dropoutRisk = useMemo(
    () =>
      computeDropoutRisk((focusIds.length ? viewData.students : data.students) || [], data.attendanceSheets || [], (data as any).dropoutAlertConfig, {
        classes: data.classes || [],
        schoolUnitId: riskScopeUnit,
      }),
    [data.students, viewData.students, focusIds.length, data.attendanceSheets, (data as any).dropoutAlertConfig, data.classes, riskScopeUnit]
  );
  const canSeeDropoutRisk = isAuthenticated && canOpenTab(accessActor, 'DROPOUT_CENSUS');
  const riskAckKey = `sucessoedu_risco_evasao_ciente_${accessActor?.id || 'anon'}`;
  const [riskAck, setRiskAck] = useState<Record<string, number>>({});
  const [riskPopupDismissed, setRiskPopupDismissed] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(riskAckKey);
      setRiskAck(raw ? JSON.parse(raw) || {} : {});
    } catch {
      setRiskAck({});
    }
    setRiskPopupDismissed(false);
  }, [riskAckKey]);
  // Alunos no limite que este usuário ainda não viu (ou que somaram faltas depois do "Ciente").
  const pendingRiskStudents = dropoutRisk.atLimit.filter((r) => (riskAck[r.studentId] ?? -1) < r.absences);
  // Um aluno novo no limite reabre a janela, mesmo que ela tenha sido fechada nesta sessão.
  const pendingRiskKey = pendingRiskStudents.map((r) => `${r.studentId}:${r.absences}`).join('|');
  useEffect(() => {
    if (pendingRiskKey) setRiskPopupDismissed(false);
  }, [pendingRiskKey]);
  const acknowledgeRisk = () => {
    const next = { ...riskAck };
    dropoutRisk.atLimit.forEach((r) => {
      next[r.studentId] = r.absences;
    });
    setRiskAck(next);
    setRiskPopupDismissed(true);
    try {
      localStorage.setItem(riskAckKey, JSON.stringify(next));
    } catch {
      /* sem armazenamento: a janela volta na próxima abertura */
    }
  };
  // Central de Notificações: um aviso por aluno que atinge o limite (mesmo código em todas as estações).
  const riskNotifKey = dropoutRisk.atLimit.map((r) => r.studentId).join('|');
  useEffect(() => {
    if (!isAuthenticated || !riskNotifKey) return;
    setDataRaw((prev: any) => {
      const list: any[] = Array.isArray(prev?.notifications) ? prev.notifications : [];
      const have = new Set(list.filter((n) => n?.metadata?.kind === 'DROPOUT_RISK').map((n) => n.id));
      const fresh = dropoutRisk.atLimit
        .filter((r) => !have.has(`notif-risco-evasao-${r.studentId}`))
        .map((r) => ({
          id: `notif-risco-evasao-${r.studentId}`,
          title: `Risco de evasão: ${r.studentName}`,
          message: `${r.studentName}${r.className ? ` (${r.className})` : ''} atingiu ${r.absences} ${
            dropoutRisk.config.countMode === 'AULAS' ? 'faltas' : 'dias com falta'
          } sem justificativa. Critério: ${describeDropoutCriterion(dropoutRisk.config)}. Procure a família e abra a busca ativa.`,
          type: 'DROPOUT_RISK',
          priority: 'URGENT',
          targetRoles: ['ADMIN', 'TEACHER'],
          actionTab: 'DROPOUT_CENSUS',
          actionLabel: 'Abrir Censo & Busca Ativa',
          createdAt: new Date().toISOString(),
          read: false,
          metadata: { kind: 'DROPOUT_RISK', studentId: r.studentId, studentName: r.studentName, absences: r.absences, schoolUnitId: r.schoolUnitId },
        }));
      return fresh.length ? { ...prev, notifications: [...fresh, ...list] } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskNotifKey, isAuthenticated]);
  // Somente o Administrador Master autenticado pode operar como outro usuário.
  const canSwitchOperator = Boolean(authenticatedAccount?.isMaster);

  const switchOperatorIfAllowed = (target: UserAccount): boolean => {
    if (target.id === authenticatedUserId || canSwitchOperator) {
      setCurrentUser(target);
      return true;
    }
    triggerPushNotification(
      '🔒 Troca de operador bloqueada',
      'Somente o Administrador Master pode operar como outro usuário. Encerre a sessão e entre com a conta desejada.'
    );
    return false;
  };

  // Grava o hash da senha (primeiro acesso, conversão de senha legada ou cópia local
  // da senha após login no Supabase) e atualiza o papel vindo da nuvem.
  const handlePasswordUpdate = (user: UserAccount, passwordHash: string) => {
    // Senha do próprio acesso (login / primeiro acesso): rotina do sistema, fora da checagem.
    setDataRaw((prev) => {
      const accounts = prev.userAccounts || [];
      const exists = accounts.some((u) => u.id === user.id);
      return {
        ...prev,
        userAccounts: exists
          ? accounts.map((u) => (u.id === user.id ? { ...u, role: user.role, password: passwordHash } : u))
          : [...accounts, { ...user, password: passwordHash }],
      };
    });
  };

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

  // Persiste qualquer alteração do estado. Antes a gravação dependia apenas de
  // alunos/provas/notificações, e mudanças em turmas, usuários, senhas ou
  // configurações podiam se perder ao recarregar a página.
  useEffect(() => {
    saveStoredData(data, { skipCloudSync: data === remoteOriginDataRef.current });
  }, [data]);

  // Timbre dos documentos: logos da Gestão e da SEMED (cadastro da Secretaria) e das escolas.
  useEffect(() => {
    setDocumentBranding({
      settings: data.settings,
      secretary: (data as any).municipalSecretary,
      schoolUnits: data.schoolUnits,
      classes: data.classes,
      defaultSchoolUnitId: currentUser?.schoolUnitId || getLocalServerInfo()?.schoolUnitId,
      // Todo documento sai com o nome completo de quem está logado.
      issuer: { name: currentUser?.name, role: currentUser?.roleTitle || currentUser?.sectorTitle },
    });
  }, [data.settings, (data as any).municipalSecretary, data.schoolUnits, data.classes, currentUser?.schoolUnitId, currentUser?.name, currentUser?.roleTitle, currentUser?.sectorTitle]);

  // Arrumação dos vínculos escola ↔ turma ↔ aluno (ex.: turma "ESCOLA X - PRÉ I (MANHÃ)" passa a
  // "PRÉ I - MANHÃ" vinculada à escola X). Antes rodava sozinha a cada alteração em TODOS os
  // computadores e cada correção automática subia para a nuvem. Agora roda só na importação
  // (handleBatchImportStudents) ou quando o administrador pede (botão "Revisar vínculos" em Turmas).
  useEffect(() => {
    const onReview = async () => {
      const uid = localStorage.getItem('sucessoedu_logged_user_id');
      const me = (dataRef.current.userAccounts || []).find((u) => u.id === uid);
      if (me?.role !== 'ADMIN') {
        notify('Somente o administrador pode revisar e corrigir os vínculos escola/turma/aluno.', 'Revisar vínculos');
        return;
      }
      const result = normalizeSchoolLinks(dataRef.current);
      if (!result.changed) {
        notify('Nenhum vínculo escola/turma/aluno precisa de correção.', 'Revisar vínculos');
        return;
      }
      const lines = result.summary.slice(0, 12).map((l) => `• ${l}`).join('\n');
      const more = result.summary.length > 12 ? `\n… e mais ${result.summary.length - 12} correção(ões).` : '';
      const ok = await confirmDialog(`Correções encontradas:\n${lines}${more}\n\nAplicar?`, {
        title: 'Revisar vínculos escola/turma/aluno',
        confirmLabel: 'Aplicar correções',
      });
      if (ok) setData(normalizeSchoolLinks(dataRef.current).data);
    };
    window.addEventListener('sucessoedu_review_school_links', onReview);
    return () => window.removeEventListener('sucessoedu_review_school_links', onReview);
  }, []);

  // RA gerado pela nuvem: alunos com RA provisório recebem o número definitivo assim que
  // houver login na nuvem. A nuvem devolve o mesmo número para o mesmo aluno, então vários
  // computadores podem pedir ao mesmo tempo sem gerar RAs diferentes. Tenta de novo a cada minuto.
  const raResolveBusyRef = useRef(false);
  const latestStudentsRef = useRef(data.students);
  latestStudentsRef.current = data.students;
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (raResolveBusyRef.current || cancelled) return;
      const list = latestStudentsRef.current || [];
      if (!list.some((s) => s && isProvisionalRa(s.enrollmentNumber))) return;
      raResolveBusyRef.current = true;
      try {
        const fresh = await resolveProvisionalRas(list as any[]);
        // Mescla por id no estado mais recente (a lista pode ter mudado durante o pedido).
        if (fresh.resolved && !cancelled) {
          console.info(`[SucessoEdu] RA definitivo recebido da nuvem para ${fresh.resolved} aluno(s).`);
          setDataRaw((prev) => {
            const map = new Map(fresh.students.map((s: any) => [s.id, s.enrollmentNumber]));
            let changed = false;
            const students = (prev.students || []).map((s) => {
              const ra = s && isProvisionalRa(s.enrollmentNumber) ? map.get(s.id) : undefined;
              if (!ra || isProvisionalRa(ra)) return s;
              changed = true;
              return { ...s, enrollmentNumber: ra, updatedAt: new Date().toISOString() };
            });
            return changed ? { ...prev, students } : prev;
          });
        }
      } finally {
        raResolveBusyRef.current = false;
      }
    };
    const t = setTimeout(run, 1500);
    const iv = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [data.students]);

  // Envio à nuvem: feito pelo motor de sincronização v2 (services/sync/cloudSync), que
  // detecta sozinho o que mudou. Antes, aqui as listas inteiras eram enfileiradas a cada mudança.
  useEffect(() => {
    startCloudSync();
  }, []);

  // Recarrega o estado da nuvem quando o login no Supabase é concluído (a carga
  // inicial já é feita por getStoredData). A mesclagem é não destrutiva.
  useEffect(() => {
    const loadFromCloud = async () => {
      // Servidor Remoto (escola): lote pela nuvem (cloudAutoSync). Demais: motor v2 (envia e
      // recebe só o que mudou; na primeira vez a nuvem prevalece, exceto na Sede).
      if (getLocalServerInfo()?.role === 'REMOTO') {
        runCloudSyncNow(true).catch(() => {});
        return;
      }
      syncCloudNow().catch(() => {});
    };
    const { data: authListener } = getSupabaseClient().auth.onAuthStateChange((event) => {
      // Adiado: chamar o Supabase dentro deste callback trava o cliente de autenticação.
      if (event === 'SIGNED_IN') setTimeout(loadFromCloud, 0);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // O servidor da escola/Sede recusou alterações por falta de permissão do usuário.
  useEffect(() => {
    const onDenied = (e: any) => {
      const list: any[] = Array.isArray(e?.detail) ? e.detail : [];
      if (!list.length) return;
      const reasons = Array.from(new Set(list.map((d) => String(d.reason || '')).filter(Boolean))).slice(0, 4);
      notify(
        `O servidor recusou ${list.length} alteração(ões) por falta de permissão do seu usuário. ${reasons.join(' ')} Nada foi gravado nesses cadastros; a tela voltou ao que está no servidor.`,
        'Permissão negada pelo servidor'
      );
    };
    window.addEventListener('sucessoedu_server_denied', onDenied);
    return () => window.removeEventListener('sucessoedu_server_denied', onDenied);
  }, []);

  // Sincronizar estado global instantaneamente quando ocorrer limpeza de base ou restauração demo
  useEffect(() => {
    const handleDbChange = (e: any) => {
      if (e.detail) {
        const nextData = {
          ...e.detail,
          rolePreferences: (e.detail?.rolePreferences && typeof e.detail.rolePreferences === 'object' && e.detail.rolePreferences?.ADMIN)
            ? { ...DEFAULT_ROLE_PREFERENCES, ...e.detail.rolePreferences }
            : DEFAULT_ROLE_PREFERENCES,
        };
        remoteOriginDataRef.current = nextData;
        setDataRaw(nextData);
      } else {
        setDataRaw(getStoredData());
      }
    };
    const handleDbMigrated = () => {
      setDataRaw(getStoredData());
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
          setDataRaw(getStoredData());
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Avisos de falta/nota lançados pelo professor viram "Aguardando envio" na
  // Central de WhatsApp (envio assistido). Nada é enviado automaticamente.
  useEffect(() => {
    const pull = () => {
      const items = drainMessageQueue();
      setDataRaw((prev) => {
        if (!prev) return prev;
        const cfg: any = prev.whatsappConfig || {};
        const current = prev.whatsappLogs || [];
        const withoutDemo = current.filter((l) => !isDemoLog(l.id));
        if (!items.length && withoutDemo.length === current.length) return prev;
        const now = new Date().toISOString();
        const queued = items
          .filter((it) =>
            it.message_payload.event === 'ATTENDANCE_ALERT'
              ? cfg.queueAbsenceAlerts !== false
              : it.message_payload.event === 'GRADE_PUBLISHED'
              ? cfg.queueGradeAlerts === true
              : false
          )
          .map((it) => {
            const st = (prev.students || []).find((x) => x.id === it.student_id);
            const isAbsence = it.message_payload.event === 'ATTENDANCE_ALERT';
            return {
              id: `wpp-${isAbsence ? 'falta' : 'nota'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              recipientName: it.recipient_name || 'Responsável',
              recipientPhone: it.recipient_phone || st?.guardianPhone || '',
              recipientRole: 'RESPONSAVEL' as const,
              messageType: (isAbsence ? 'AVISO_FALTA' : 'BOLETIM_NOTAS') as WhatsAppMessageType,
              content: it.message_payload.body,
              studentId: it.student_id,
              studentName: it.student_name,
              studentClass: it.message_payload.details?.class,
              status: 'FILA' as const,
              sentAt: it.created_at || now,
              createdAt: it.created_at || now,
              updatedAt: now,
              operatorName: 'Gerado pelo lançamento do professor',
              source: (isAbsence ? 'FALTA' : 'NOTA') as 'FALTA' | 'NOTA',
              title: it.message_payload.title,
            };
          });
        return { ...prev, whatsappLogs: [...queued, ...withoutDemo] };
      });
    };
    pull();
    const unsub = subscribeToMessageQueue(() => window.setTimeout(pull, 0));
    const timer = window.setInterval(pull, 15000);
    return () => {
      unsub();
      window.clearInterval(timer);
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
      getRolePreferenceSafely(data?.rolePreferences, currentRole) ||
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
    if (!switchOperatorIfAllowed(user)) return;
    triggerPushNotification(
      '👤 Sessão Alternada',
      `Você agora está operando como: ${user.name} (${user.sector})`
    );
  };

  // Developer Contact & Settings Handlers
  const handleUpdateDeveloperContact = (updatedContact: DeveloperContact) => {
    // Mescla com o cadastro atual: nenhum dado do desenvolvedor se perde numa gravação parcial.
    setData((prev) => ({
      ...prev,
      developerContact: { ...(prev.developerContact || ({} as any)), ...updatedContact },
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
    clearLocalServerSession();
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
    // Encerra também a sessão da nuvem, exceto quando este computador foi marcado para
    // "Manter conectado à nuvem" (a sincronização continua sem pedir a senha de novo).
    if (!shouldKeepCloudSession()) {
      getSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => {});
    }
    setAuthenticatedUserId(null);
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
      // Escola que já existe (mesmo id) e veio na importação: a ficha "DADOS DA ESCOLA" completou o cadastro
      // (só campos vazios/provisórios). updatedAt garante que a alteração vá para a nuvem.
      const unitStamp = new Date().toISOString();
      const unitUpdates = new Map(
        (explicitUnits || [])
          .filter((u) => u && (prev.schoolUnits || []).some((eu) => eu && eu.id === u.id))
          .map((u) => [u.id, { ...u, updatedAt: unitStamp } as SchoolUnit])
      );
      const existingUnits = (prev.schoolUnits || []).map((eu) => (eu && unitUpdates.get(eu.id)) || eu);
      const newUnits: SchoolUnit[] = [];

      // Se explicitUnits foi passado (gerado pelo módulo de importação com detecção de séries atendidas)
      if (explicitUnits && explicitUnits.length > 0) {
        explicitUnits.forEach((u) => {
          if (!u || unitUpdates.has(u.id)) return;
          const uName = (u.name || '').toLowerCase().trim();
          if (
            !existingUnits.some(
              (eu) =>
                eu &&
                (eu.id === u.id || (eu.name && eu.name.toLowerCase().trim() === uName))
            ) &&
            !newUnits.some((nu) => nu && nu.id === u.id)
          ) {
            newUnits.push(u);
          }
        });
      }

      // Também verifica se algum aluno tem schoolOriginName que ainda não está nas unidades
      imported.forEach((s) => {
        if (s && s.schoolOriginName) {
          const cleanName = s.schoolOriginName.replace(/^ESCOLA:\s*/i, '').trim();
          const cleanNameLower = cleanName.toLowerCase();
          const origNameLower = s.schoolOriginName.toLowerCase();
          const existing = existingUnits.find(
            (u) =>
              u &&
              ((u.name && u.name.toLowerCase() === cleanNameLower) ||
                (u.name && u.name.toLowerCase() === origNameLower))
          );
          if (
            !existing &&
            !newUnits.some(
              (u) =>
                u &&
                ((u.name && u.name.toLowerCase() === cleanNameLower) ||
                  (u.name && u.name.toLowerCase() === origNameLower))
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

      // Turmas: as novas são incluídas e as existentes (mesmo id) são atualizadas (ex: nome ajustado)
      // updatedAt marca a alteração como mais recente que a cópia da nuvem (não é revertida na próxima carga)
      const stamp = new Date().toISOString();
      const classById = new Map(
        (explicitClasses || []).filter(Boolean).map((c) => [c.id, { ...c, updatedAt: stamp } as SchoolClass])
      );
      const existingClasses = (prev.classes || []).map((c) => classById.get(c.id) || c);
      const newClasses = Array.from(classById.values()).filter(
        (c) => !(prev.classes || []).some((ec) => ec.id === c.id)
      );

      // Alunos: quem já existe (mesmo id, reconhecido na importação) é atualizado; os demais são incluídos
      const importedById = new Map(
        imported.filter(Boolean).map((s) => [s.id, { ...s, updatedAt: stamp } as Student])
      );
      const updatedStudents = (prev.students || []).map((s) => importedById.get(s.id) || s);
      const addedStudents = imported
        .filter((s) => s && !(prev.students || []).some((ps) => ps.id === s.id))
        .map((s) => importedById.get(s.id) || s);

      const merged = {
        ...prev,
        students: [...addedStudents, ...updatedStudents],
        // Escolas novas carimbadas com a data da importação (o marco de reinício da base usa a data).
        schoolUnits: [...existingUnits, ...newUnits.map((u) => ({ ...u, createdAt: (u as any).createdAt || stamp, updatedAt: stamp }) as SchoolUnit)],
        classes: [...existingClasses, ...newClasses],
      };
      // Arrumação dos vínculos escola/turma/aluno: feita aqui, na importação.
      const normalized = normalizeSchoolLinks(merged);
      if (normalized.changed) console.info('[SucessoEdu] Vínculos ajustados na importação:', normalized.summary);
      return normalized.data;
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
      const previous = prev.classes.find((c) => c.id === newClass.id);
      const updated = previous
        ? prev.classes.map((c) => (c.id === newClass.id ? newClass : c))
        : [...prev.classes, newClass];
      // Os alunos da turma ficam sempre na escola da turma: se a turma foi transferida (agora ou numa
      // versão antiga que não levava os alunos), salvar a turma leva junto quem ficou na escola anterior.
      const movedUnit =
        !!previous &&
        !!newClass.schoolUnitId &&
        (prev.students || []).some((st) => st.classId === newClass.id && st.schoolUnitId !== newClass.schoolUnitId);
      if (!movedUnit) return { ...prev, classes: updated };
      const stamp = new Date().toISOString();
      const unit = (prev.schoolUnits || []).find((u) => u.id === newClass.schoolUnitId);
      const students = (prev.students || []).map((st) =>
        st.classId === newClass.id && st.schoolUnitId !== newClass.schoolUnitId
          ? ({
              ...st,
              schoolUnitId: newClass.schoolUnitId,
              schoolOriginName: unit?.name || st.schoolOriginName,
              updatedAt: stamp,
            } as Student)
          : st
      );
      return { ...prev, classes: updated.map((c) => (c.id === newClass.id ? ({ ...c, updatedAt: stamp } as SchoolClass) : c)), students };
    });
  };

  const handleDeleteClass = (id: string) => {
    // Integridade: alunos matriculados não podem ficar apontando para uma turma inexistente.
    const linked = (data.students || []).filter((st) => st.classId === id).length;
    if (linked > 0) {
      const cls = (data.classes || []).find((c) => c.id === id);
      notify(
        `Não é possível excluir "${cls?.name || 'esta turma'}": há ${linked} aluno(s) matriculado(s) nela. ` +
          'Transfira os alunos para outra turma antes de excluir.'
      );
      return;
    }
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
  };

  // Disciplinas (matriz curricular)
  const handleSaveSubject = (subject: Subject) => {
    setData((prev) => {
      const list = prev.subjects || [];
      const exists = list.some((s) => s.id === subject.id);
      return { ...prev, subjects: exists ? list.map((s) => (s.id === subject.id ? subject : s)) : [...list, subject] };
    });
    triggerPushNotification('📚 Disciplina salva', `"${subject.name}" atualizada na matriz curricular.`);
  };

  const handleDeleteSubject = (id: string) => {
    const subject = (data.subjects || []).find((s) => s.id === id);
    // Integridade: disciplina com frequência, diário ou notas lançadas não pode sumir.
    const inUse =
      (data.attendanceSheets || []).some((a: any) => a?.subjectId === id) ||
      (data.lessonRegistries || []).some((l: any) => l?.subjectId === id) ||
      (data.classGradeSheets || []).some((g: any) => g?.subjectId === id);
    if (inUse) {
      notify(
        `Não é possível excluir "${subject?.name || 'esta disciplina'}": já existem frequências, aulas ou notas lançadas nela.`
      );
      return;
    }
    setData((prev) => ({ ...prev, subjects: (prev.subjects || []).filter((s) => s.id !== id) }));
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
          `Disponível para realização na Sala do Aluno.`
        );
      }

      return { ...prev, exams: updated, notifications: notifs };
    });
  };

  const handleDeleteExam = (id: string) => {
    // Excluir a prova apaga também as correções dela (senão ficam soltas e voltam para a nuvem).
    setData((prev) => ({
      ...prev,
      exams: prev.exams.filter((e) => e.id !== id),
      submissions: (prev.submissions || []).filter((s) => s.examId !== id),
    }));
  };

  const handleTakeExam = (examId: string) => {
    setActiveExamIdForTaking(examId);
    setActiveTab('STUDENT_ROOM');
  };

  // Prova de papel: respostas lançadas pelo professor (substitui a correção anterior do aluno).
  const handleSavePaperSubmissions = (examId: string, upserts: ExamSubmission[], removeStudentIds: string[]) => {
    setData((prev) => ({
      ...prev,
      submissions: replaceSubmissions(prev.submissions || [], examId, upserts, removeStudentIds),
    }));
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

  // Habilidades BNCC: lançamentos por aluno/bimestre e catálogo
  const handleSaveBnccAssessments = (upserts: BnccSkillAssessment[], removeKeys: string[]) => {
    setData((prev) => ({
      ...prev,
      bnccAssessments: upsertAssessments(removeAssessments(prev.bnccAssessments || [], new Set(removeKeys)), upserts),
    }));
  };

  const handleUpsertBnccSkills = (skills: BnccSkill[]) => {
    setData((prev) => ({ ...prev, bnccSkills: mergeSkills(prev.bnccSkills || [], skills).list }));
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
      `Ajustes do WhatsApp alterados (faltas na fila: ${newConfig.queueAbsenceAlerts !== false ? 'sim' : 'não'}; notas na fila: ${newConfig.queueGradeAlerts === true ? 'sim' : 'não'})`
    );
  };

  // Envio assistido: registra a conversa aberta no WhatsApp (ou guardada na fila).
  const handleSendWhatsAppMessage = (logData: Omit<WhatsAppMessageLog, 'id' | 'sentAt'>) => {
    const now = new Date().toISOString();
    const newLog: WhatsAppMessageLog = {
      ...logData,
      id: `wpp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      whatsappLogs: [newLog, ...(prev.whatsappLogs || [])],
    }));
    if (logData.status === 'ENVIADO') {
      logSecurityAudit(
        'COMUNICADO',
        currentUser?.id || 'usr-master-001',
        currentUser?.name || 'Administrador',
        currentUser?.role || 'ADMIN',
        currentUser?.sector || 'MASTER',
        `WhatsApp aberto para ${logData.recipientName} (${logData.recipientPhone}) - Tipo: ${logData.messageType}`
      );
    }
  };

  const handleUpdateWhatsAppLogs = (ids: string[], patch: Partial<WhatsAppMessageLog>) => {
    const set = new Set(ids);
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      whatsappLogs: (prev.whatsappLogs || []).map((l) => (set.has(l.id) ? { ...l, ...patch, updatedAt: now } : l)),
    }));
  };

  // Mural -> WhatsApp: abre a Central já com o público e o texto do aviso.
  const handleSendAnnouncementViaWhatsApp = (msg: CommunicationMessage) => {
    const roles = msg.targetRoles || [];
    let audience: WhatsAppPrefill['audience'];
    if (msg.recipientType === 'INDIVIDUAL' && msg.targetStudentId) {
      audience = { kind: 'ALUNO', studentId: msg.targetStudentId, contact: 'RESPONSAVEL' };
    } else if (msg.recipientType === 'CLASS' && msg.targetClassId) {
      audience = { kind: 'TURMA', classId: msg.targetClassId, contact: 'RESPONSAVEL' };
    } else if (msg.recipientType === 'ROLE' && roles.length > 0 && roles.every((r) => r === 'TEACHER' || r === 'ADMIN')) {
      audience = { kind: 'PROFISSIONAIS', staff: roles.includes('ADMIN') ? 'EQUIPE' : 'PROFESSORES' };
    } else {
      const toStudents = msg.recipientType === 'ROLE' && roles.includes('STUDENT');
      const toParents = msg.recipientType !== 'ROLE' || roles.includes('PARENT');
      audience = { kind: 'ESCOLA', unitId: '', contact: toStudents && toParents ? 'AMBOS' : toStudents ? 'ALUNO' : 'RESPONSAVEL' };
    }
    const schoolName = (data.settings as any)?.name || '';
    const files = (msg.attachments || []).map((a) => a.name).filter(Boolean);
    const attachNote = files.length ? `\n\n📎 Anexo: ${files.join(', ')} (peça na secretaria da escola).` : '';
    const text = `*${msg.title}*\n\n${msg.content}${attachNote}${msg.senderName ? `\n\n— ${msg.senderName}${schoolName ? `, ${schoolName}` : ''}` : ''}`;
    setWhatsappPrefill({
      title: msg.title,
      text,
      audience,
      messageType: msg.category === 'EVENTO' ? 'EVENTO_REUNIAO' : 'AVISO_GERAL',
      source: 'MURAL',
    });
    handleNavigate('WHATSAPP');
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

    if (isAuthenticated && !canOpenTab(accessActor, target)) {
      notify(deniedTabMessage(target), 'Acesso restrito');
      return;
    }

    if (!isTabAvailable(target)) {
      notify(`Este painel de demonstração foi desativado para deixar o sistema mais leve. Os recursos reais estão em ${moduleName('ADMIN_TI')}.`, 'Painel desativado');
      return;
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

  // Troca de operador ou mudança de permissões: fecha as telas que o operador não pode abrir.
  const accessKey = accessActor ? `${accessActor.id}|${JSON.stringify((accessActor as any).permissions || {})}|${accessActor.sector}` : '';
  useEffect(() => {
    if (!isAuthenticated || !accessActor) return;
    setOpenTabs((prev) => {
      const kept = prev.filter((t) => canOpenTab(accessActor, t));
      return kept.length === prev.length ? prev : kept.length ? kept : ['MAIN_DASHBOARD'];
    });
    if (!canOpenTab(accessActor, activeTab)) setActiveTab('MAIN_DASHBOARD');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessKey, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <LoginScreen
        userAccounts={data.userAccounts || []}
        schoolUnits={data.schoolUnits || []}
        systemVersion={appVersionLabel()}
        onPasswordUpdate={handlePasswordUpdate}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthenticatedUserId(user.id);
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
        schoolName={viewData.settings?.name}
        onNavigate={handleNavigate}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenVersionControl={() => handleNavigate('SYSTEM_UPDATES')}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={handleLogout}
      />

      {/* Top Header */}
      <Header
        schoolName={viewData.settings?.name}
        activeTab={activeTab}
        onSelectTab={(tab, payload) => handleNavigate(tab, payload)}
        onGoBack={handleGoBack}
        navigationHistory={navigationHistory}
        notifications={viewData.notifications || []}
        currentRole={currentRole}
        onChangeRole={(role) => {
          const matchingAccount = viewData.userAccounts?.find((u) => u.role === role);
          if (matchingAccount) {
            switchOperatorIfAllowed(matchingAccount);
          }
        }}
        userAccounts={viewData.userAccounts || []}
        currentUser={currentUser}
        onSelectUserAccount={handleSwitchCurrentUser}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenVersionControl={() => handleNavigate('SYSTEM_UPDATES')}
        currentVersion={appVersionLabel()}
        onLogout={handleLogout}
        onToggleStartMenu={() => setIsStartMenuOpen((prev) => !prev)}
        isStartMenuOpen={isStartMenuOpen}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        schoolUnits={data.schoolUnits || []}
        schoolFocus={focusIds.length ? schoolFocus : null}
        onChangeSchoolFocus={canChooseSchoolFocus ? handleChangeSchoolFocus : undefined}
      />

      {/* Main Layout Shell */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          onLogout={handleLogout}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
          onOpenVersionControl={() => handleNavigate('SYSTEM_UPDATES')}
          currentVersion={appVersionLabel()}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          showDevBacklog={isDevBacklogOwner(currentUser?.email)}
          canOpenTab={(tab) => canOpenTab(accessActor, tab)}
          counts={{
            students: viewData?.students?.length || 0,
            exams: viewData?.exams?.length || 0,
            questions: data?.questions?.length || 0,
            submissions: viewData?.submissions?.length || 0,
            schoolUnits: data?.schoolUnits?.length || 0,
            userAccounts: data?.userAccounts?.length || 0,
            unreadNotifications: unreadNotificationCount,
            unreadMessages: (data?.communications || []).length,
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
                students={viewData.students}
                classes={viewData.classes}
                exams={viewData.exams}
                submissions={viewData.submissions}
                settings={viewData.settings}
                schoolUnits={viewData.schoolUnits || []}
                syncLogs={viewData.syncLogs || []}
                userAccounts={viewData.userAccounts || []}
                currentUser={currentUser}
                notifications={viewData.notifications || []}
                dropoutRisk={canSeeDropoutRisk ? dropoutRisk : undefined}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                onOpenImportModal={() => setIsUniversalImportModalOpen(true)}
                onEditStudent={() => setActiveTab('STUDENTS')}
              />
            )}

            {/* TAB: PORTAL DO PROFESSOR (GESTÃO COMPLETA DE TURMAS, DIÁRIO, NOTAS, FREQUÊNCIA & PROVAS) */}
            {(activeTab === 'TEACHER_PORTAL' || activeTab === 'PROFESSOR_DASHBOARD' || activeTab === 'PROFESSOR') && (
              <TeacherPortalModule
                students={viewData.students}
                classes={viewData.classes}
                subjects={viewData.subjects}
                schoolUnits={viewData.schoolUnits || []}
                settings={viewData.settings}
                bnccSkills={viewData.bnccSkills || []}
                stateRegulations={viewData.stateRegulations || []}
                activeStateRegulationCode={viewData.activeStateRegulationCode || 'SP'}
                attendanceSheets={viewData.attendanceSheets || []}
                lessonRegistries={viewData.lessonRegistries || []}
                classGradeSheets={viewData.classGradeSheets || []}
                exams={viewData.exams}
                questions={viewData.questions}
                submissions={viewData.submissions}
                teacherLessonPlans={viewData.teacherLessonPlans || []}
                teacherStudentNotes={viewData.teacherStudentNotes || []}
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
                students={viewData.students}
                classes={viewData.classes}
                courses={viewData.courses || []}
                schoolUnits={viewData.schoolUnits || []}
                histories={viewData.academicHistories || []}
                attendanceSheets={viewData.attendanceSheets || []}
                classGradeSheets={viewData.classGradeSheets || []}
                notifications={viewData.notifications || []}
                onSaveNotification={handleSaveNotification}
                onBatchSaveNotifications={handleBatchSaveNotifications}
                onSaveSchoolUnit={handleSaveSchoolUnit}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={canAccess(accessActor, 'secretaria', 'canDelete') ? handleDeleteStudent : undefined}
                onBatchImportStudents={handleBatchImportStudents}
                onIssueDocument={handleIssueDocument}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
                allSchoolUnits={data?.schoolUnits || []}
                allClasses={data?.classes || []}
                transferDestinationIds={transferScopeIds}
                currentUserName={currentUser?.name}
                allStudents={transferStudentsPool}
              />
            )}

            {/* TAB: CENSO DE EVASÃO ESCOLAR & BUSCA ATIVA MUNICIPAL */}
            {activeTab === 'DROPOUT_CENSUS' && (
              <DropoutCensusReport
                students={viewData.students}
                classes={viewData.classes}
                schoolUnits={viewData.schoolUnits || []}
                onUpdateStudent={handleSaveStudent}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
                dropoutRisk={dropoutRisk}
                canConfigureDropoutRisk={canAccess(accessActor, 'secretaria', 'canEdit')}
                onSaveDropoutAlertConfig={(cfg) =>
                  setData((prev: any) => ({
                    ...prev,
                    dropoutAlertConfig: { ...cfg, updatedAt: new Date().toISOString(), updatedBy: currentUser?.name || '' },
                  }))
                }
              />
            )}

            {/* TAB: DIÁRIO DE CLASSE, FREQUÊNCIA & NORMATIVAS ESTADUAIS */}
            {activeTab === 'CLASS_DIARY' && (
              <ClassDiaryModule
                currentUserName={currentUser?.role === 'TEACHER' ? currentUser?.name : undefined}
                students={viewData.students}
                classes={viewData.classes}
                subjects={viewData.subjects}
                schoolUnits={viewData.schoolUnits || []}
                settings={viewData.settings}
                bnccSkills={viewData.bnccSkills || []}
                stateRegulations={viewData.stateRegulations || []}
                activeStateRegulationCode={viewData.activeStateRegulationCode || 'SP'}
                attendanceSheets={viewData.attendanceSheets || []}
                lessonRegistries={viewData.lessonRegistries || []}
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
                classes={viewData.classes}
                courses={viewData.courses}
                subjects={viewData.subjects}
                students={viewData.students}
                schoolUnits={viewData.schoolUnits || []}
                onSaveClass={handleSaveClass}
                onDeleteClass={canAccess(accessActor, 'turmas', 'canDelete') ? handleDeleteClass : undefined}
                onSaveSubject={handleSaveSubject}
                onDeleteSubject={handleDeleteSubject}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: EMISSÃO DE DOCUMENTOS E CERTIFICADOS */}
            {activeTab === 'DOCUMENTS' && (
              <DocumentIssuer
                students={data?.students || []}
                classes={data?.classes || []}
                histories={data?.academicHistories || []}
                classGradeSheets={data?.classGradeSheets || []}
                attendanceSheets={data?.attendanceSheets || []}
                settings={data?.settings || DEFAULT_SCHOOL_SETTINGS}
                preSelectedStudentId={documentSelectedStudentId}
                preSelectedDocType={documentSelectedType}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: EVOLUÇÃO PEDAGÓGICA DO ALUNO E TURMA COM GRÁFICOS */}
            {activeTab === 'PEDAGOGICAL_DASHBOARD' && (
              <Suspense fallback={<ModuleLoadingFallback moduleName="Evolução Pedagógica & Indicadores BNCC" />}>
                <PedagogicalDashboard
                  initialSection={pedagogicalInitialSection}
                  exams={viewData.exams}
                  questions={viewData.questions}
                  students={viewData.students}
                  classes={viewData.classes}
                  submissions={viewData.submissions}
                  schoolUnits={viewData.schoolUnits || []}
                  subjects={viewData.subjects || []}
                  settings={viewData.settings}
                  academicHistories={viewData.academicHistories || []}
                  classGradeSheets={viewData.classGradeSheets || []}
                  onBack={() => handleNavigate('MAIN_DASHBOARD')}
                  onNavigate={handleNavigate}
                />
              </Suspense>
            )}

            {/* TAB: RELATÓRIO OFICIAL DE AVALIAÇÕES POR NÍVEL E POR ESCOLA */}
            {activeTab === 'ASSESSMENT_REPORT' && (
              <AssessmentResultsReport
                exams={viewData.exams}
                questions={viewData.questions}
                students={viewData.students}
                classes={viewData.classes}
                submissions={viewData.submissions}
                schoolUnits={viewData.schoolUnits || []}
                subjects={viewData.subjects || []}
                settings={viewData.settings}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: HABILIDADES BNCC (lançamento, relatórios, gráficos, importação/exportação) */}
            {activeTab === 'BNCC_SKILLS' && (
              <BnccSkillsModule
                students={viewData.students}
                classes={viewData.classes}
                subjects={viewData.subjects}
                schoolUnits={viewData.schoolUnits || []}
                settings={viewData.settings}
                bnccSkills={viewData.bnccSkills || []}
                assessments={viewData.bnccAssessments || []}
                currentUserName={currentUser?.name}
                onSaveAssessments={handleSaveBnccAssessments}
                onUpsertSkills={handleUpsertBnccSkills}
                exams={viewData.exams}
                questions={viewData.questions}
                submissions={viewData.submissions}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
              />
            )}

            {/* TAB: BANCO DE QUESTÕES BNCC */}
            {activeTab === 'QUESTION_BANK' && (
              <QuestionBank
                questions={viewData.questions}
                subjects={viewData.subjects}
                onSaveQuestion={handleSaveQuestion}
                onDeleteQuestion={canAccess(accessActor, 'questoes', 'canDelete') ? handleDeleteQuestion : undefined}
                onBatchImport={handleBatchImportQuestions}
                onCreateExamWithQuestions={handleCreateExamFromQuestions}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: GERENCIADOR DE PROVAS & EXAMES */}
            {activeTab === 'EXAMS' && (
              <ExamManager
                exams={viewData.exams}
                questions={viewData.questions}
                classes={viewData.classes}
                subjects={viewData.subjects}
                submissions={viewData.submissions}
                settings={viewData.settings}
                onSaveExam={handleSaveExam}
                onDeleteExam={canAccess(accessActor, 'provas', 'canDelete') ? handleDeleteExam : undefined}
                onTakeExamAsStudent={handleTakeExam}
                onViewReport={handleViewReport}
                initialSelectedQuestionIds={preselectedQuestionIdsForExam}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
                students={viewData.students}
                onSavePaperSubmissions={handleSavePaperSubmissions}
                schoolUnits={viewData.schoolUnits || []}
              />
            )}

            {/* TAB: SALA DO ALUNO (AVALIAÇÃO DIGITAL COM CORREÇÃO INSTANTÂNEA) */}
            {activeTab === 'STUDENT_ROOM' && (
              <div>
                {examForStudentRoom ? (
                  <StudentExamRoom
                    exam={examForStudentRoom}
                    questions={viewData.questions}
                    students={studentsForExam(examForStudentRoom, viewData.students, viewData.classes)}
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
              <Suspense fallback={<ModuleLoadingFallback moduleName={moduleName('MUNICIPAL_SYNC')} />}>
              <MunicipalSyncModule
                schoolUnits={data?.schoolUnits || []}
                syncLogs={data?.syncLogs || []}
                students={data?.students || []}
                classes={data?.classes || []}
                exams={data?.exams || []}
                submissions={data?.submissions || []}
                academicHistories={data?.academicHistories || []}
                classGradeSheets={data?.classGradeSheets || []}
                subjects={data?.subjects || []}
                userAccounts={data?.userAccounts || []}
                settings={data?.settings || DEFAULT_SCHOOL_SETTINGS}
                municipalSecretary={{
                  ...(data?.municipalSecretary || DEFAULT_MUNICIPAL_SECRETARY),
                  // Logos que vieram da nuvem (outro computador) aparecem no cadastro da Secretaria.
                  logoUrl: data?.municipalSecretary?.logoUrl || data?.settings?.logoUrl || '',
                  managementLogoUrl: data?.municipalSecretary?.managementLogoUrl || data?.settings?.managementLogoUrl || '',
                }}
                onUpdateSchoolUnits={(units) =>
                  setData((prev) => ({ ...prev, schoolUnits: units }))
                }
                onRemoveSchoolUnit={(unitId, classIds) => {
                  const drop = new Set(classIds);
                  setData((prev) => ({
                    ...prev,
                    schoolUnits: (prev.schoolUnits || []).filter((u) => u.id !== unitId),
                    classes: (prev.classes || []).filter((c) => !drop.has(c.id)),
                  }));
                }}
                onUpdateSyncLogs={(logs) =>
                  setData((prev) => ({ ...prev, syncLogs: logs }))
                }
                onUpdateMunicipalSecretary={(secretary) =>
                  setData((prev) => ({
                    ...prev,
                    municipalSecretary: secretary,
                    // As logos também ficam nas configurações, que vão para a nuvem.
                    settings: {
                      ...prev.settings,
                      logoUrl: secretary.logoUrl || '',
                      managementLogoUrl: secretary.managementLogoUrl || '',
                    },
                  }))
                }
                onRefreshData={() => setDataRaw(getStoredData())}
                onBack={() => handleNavigate('MAIN_DASHBOARD')}
                onNavigate={handleNavigate}
              />
              </Suspense>
            )}

            {/* TAB: MURAL DE COMUNICADOS */}
            {activeTab === 'COMMUNICATION' && (
              <CommunicationModule
                messages={viewData.communications || []}
                classes={viewData.classes}
                students={viewData.students}
                settings={viewData.settings}
                currentRole={currentRole}
                currentUserName={currentUser?.name}
                currentUserId={currentUser?.id}
                onSendMessage={handleSendMessage}
                onConfirmRead={handleConfirmRead}
                onDeleteMessage={handleDeleteMessage}
                onTriggerPushNotification={triggerPushNotification}
                onSendViaWhatsApp={handleSendAnnouncementViaWhatsApp}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: WHATSAPP NOTIFICAÇÕES & COMUNICADOS ADMINISTRATIVOS */}
            {activeTab === 'WHATSAPP' && (
              <WhatsAppModule
                config={viewData.whatsappConfig}
                logs={viewData.whatsappLogs || []}
                messageLogs={viewData.whatsappLogs || []}
                templates={viewData.whatsappTemplates || []}
                students={viewData.students}
                classes={viewData.classes}
                userAccounts={viewData.userAccounts || []}
                currentUser={currentUser}
                schoolUnits={viewData.schoolUnits || []}
                schoolName={(viewData.settings as any)?.name || (viewData.settings as any)?.schoolName || ''}
                schoolPhone={(viewData.settings as any)?.phone || ''}
                prefill={whatsappPrefill}
                onPrefillConsumed={() => setWhatsappPrefill(null)}
                onUpdateLogs={handleUpdateWhatsAppLogs}
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
              <Suspense fallback={<ModuleLoadingFallback moduleName={moduleName('SYSTEM_UPDATES')} />}>
              <SystemUpdateModule
                onBack={handleGoBack}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                isAdmin={currentRole === 'ADMIN'}
              />
              </Suspense>
            )}

            {/* TAB: CONTROLE DE USUÁRIOS & NÍVEIS DE ACESSO POR SETOR */}
            {activeTab === 'USER_CONTROL' && (
              <UserAccessControl
                users={viewData.userAccounts || []}
                currentUser={currentUser}
                schoolUnits={viewData.schoolUnits || []}
                auditLogs={viewData.auditLogs || []}
                onUpdateUsers={handleUpdateUsers}
                onSwitchCurrentUser={handleSwitchCurrentUser}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
              />
            )}

            {/* TAB: CENTRAL DE ADMINISTRAÇÃO & TI (PAINEL GERAL E HUB DE NAVEGAÇÃO RÁPIDA) */}
            {activeTab === 'ADMIN_TI' && (
              <Suspense fallback={<ModuleLoadingFallback moduleName={moduleName('ADMIN_TI')} />}>
                <AdminTIHub
                  schoolName={viewData.settings?.name || 'SucessoEdu Gestão Educacional'}
                  onNavigate={handleNavigate}
                  onBack={handleGoBack}
                  userAccountsCount={viewData.userAccounts?.length || 0}
                  counts={{
                    schools: (viewData.schoolUnits || []).length,
                    classes: (viewData.classes || []).length,
                    students: (viewData.students || []).length,
                    activeUsers: (viewData.userAccounts || []).filter((u) => u.active !== false).length,
                  }}
                  auditLogs={viewData.auditLogs || []}
                />
              </Suspense>
            )}

            {/* TAB: INSTALADOR DE REDE LOCAL, NUVEM E BACKUP */}
            {activeTab === 'NETWORK_INSTALLER' && (
              <Suspense fallback={<ModuleLoadingFallback moduleName={moduleName('NETWORK_INSTALLER')} />}>
                <NetworkInstaller
                  onBack={handleGoBack}
                  onNavigate={handleNavigate}
                  isAdmin={currentRole === 'ADMIN'}
                />
              </Suspense>
            )}

            {/* TAB: PLANO DE DESENVOLVIMENTO (privado, somente o desenvolvedor) */}
            {activeTab === 'DEV_BACKLOG' && (
              <DevBacklogModule userEmail={currentUser?.email} onBack={handleGoBack} />
            )}

            {/* TAB: SOBRE O SISTEMA & DADOS DO DESENVOLVEDOR */}
            {activeTab === 'ABOUT' && (
              <AboutSystem
                settings={data?.settings || DEFAULT_SCHOOL_SETTINGS}
                developerContact={data?.developerContact || DEFAULT_DEVELOPER_CONTACT}
                onUpdateDeveloperContact={handleUpdateDeveloperContact}
                onUpdateSettings={handleUpdateSettings}
                onBack={handleGoBack}
                onNavigate={handleNavigate}
                onOpenVersionControl={() => handleNavigate('SYSTEM_UPDATES')}
                canEditDeveloper={[authenticatedAccount, currentUser].some((u: any) => u?.isMaster || u?.sector === 'MASTER')}
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
        schoolName={data?.settings?.name}
        totalStudents={(data?.students || []).filter((s) => s.status === 'ACTIVE').length}
        totalClasses={data?.classes?.length || 0}
      />

      {/* MENU INICIAR DO WINDOWS 11 (START MENU) */}
      <WindowsStartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        schoolName={viewData.settings?.name}
        onOpenVersionControl={() => handleNavigate('SYSTEM_UPDATES')}
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
              switchOperatorIfAllowed(matchingAccount);
            }
          }}
          preferences={
            data?.rolePreferences && typeof viewData.rolePreferences === 'object' && Object.keys(viewData.rolePreferences).length > 0
              ? viewData.rolePreferences
              : (DEFAULT_ROLE_PREFERENCES && typeof DEFAULT_ROLE_PREFERENCES === 'object' && Object.keys(DEFAULT_ROLE_PREFERENCES).length > 0)
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
              'Notificação de teste: se você está vendo esta mensagem, as notificações funcionam neste computador.'
            );
          }}
        />
      )}

      {/* AVISO NA TELA: ALUNOS QUE ATINGIRAM O LIMITE DE FALTAS SEM JUSTIFICATIVA */}
      <DropoutRiskAlertModal
        isOpen={canSeeDropoutRisk && dropoutRisk.config.showPopup && !riskPopupDismissed && pendingRiskStudents.length > 0}
        students={pendingRiskStudents}
        criterion={describeDropoutCriterion(dropoutRisk.config)}
        unitLabel={dropoutRisk.config.countMode === 'AULAS' ? 'faltas' : 'dias'}
        onAcknowledge={acknowledgeRisk}
        onOpenCensus={() => {
          acknowledgeRisk();
          handleNavigate('DROPOUT_CENSUS');
          setTimeout(() => document.getElementById('painel-risco-evasao')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
        }}
      />

      {/* CANAL DIRETO COM O DESENVOLVEDOR (FEEDBACK & SUGESTÕES WHATSAPP) */}
      <FeedbackSuggestionsModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        developerContact={viewData.developerContact || {
          name: 'AD SUCESSO SISTEMA',
          phone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          company: 'ADS Tecnologia e Inovação Educacional',
          email: 'suportetecnicoads@gmail.com',
          website: 'https://sucessoedu.com.br',
          roleTitle: 'Engenheiro de Software & Arquiteto Líder',
        }}
        settings={viewData.settings}
        currentUser={currentUser}
      />

      {/* MÓDULO UNIVERSAL DE IMPORTAÇÃO DE DADOS & POLOS REMOTOS */}
      <UniversalDataImportModal
        isOpen={isUniversalImportModalOpen}
        onClose={() => setIsUniversalImportModalOpen(false)}
        classes={data?.classes || []}
        schoolUnits={data?.schoolUnits || []}
        studentsCount={data?.students?.length || 0}
        existingStudents={data?.students || []}
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

      {/* TIRA-DÚVIDAS DO MÓDULO ATUAL (F1) */}
      <HelpCenterModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} activeTab={activeTab} />

      {/* TOUR GUIADO (ONBOARDING) PARA NOVOS USUÁRIOS */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={(neverShowAgain) => {
          setIsTourOpen(false);
          if (!neverShowAgain) return;
          dismissTourForever();
          // Guarda também no cadastro do usuário: a escolha vale em qualquer computador e
          // não se perde quando o navegador limpa os dados ou o endereço de acesso muda.
          const uid = currentUser?.id;
          if (uid && !currentUser?.tourDismissed) {
            setCurrentUser((u) => (u && u.id === uid ? { ...u, tourDismissed: true } : u));
            setData((prev: any) => ({
              ...prev,
              userAccounts: (prev.userAccounts || []).map((u: any) => (u?.id === uid ? { ...u, tourDismissed: true } : u)),
            }));
          }
        }}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
