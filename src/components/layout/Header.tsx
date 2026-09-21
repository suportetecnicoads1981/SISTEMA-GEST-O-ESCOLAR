import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Wifi,
  WifiOff,
  Printer,
  School,
  Sparkles,
  Plus,
  Bell,
  Search,
  MessageSquare,
  Shield,
  Key,
  Building2,
  TrendingUp,
  LayoutDashboard,
  Users,
  ArrowLeft,
  Home,
  ChevronRight,
  LogOut,
  Folder,
  Keyboard,
  Clock,
  GitBranch,
  History,
} from 'lucide-react';
import { NotificationItem, UserRole, UserAccount } from '../../types';
import { NotificationPopover } from '../notificacoes/NotificationPopover';

interface HeaderProps {
  schoolName: string;
  activeTab: string;
  onSelectTab: (tab: string, payload?: any) => void;
  onGoBack?: () => void;
  navigationHistory?: string[];
  notifications?: NotificationItem[];
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  userAccounts?: UserAccount[];
  currentUser?: UserAccount;
  onSelectUserAccount?: (user: UserAccount) => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onOpenNotificationModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenQuickSearch?: () => void;
  onOpenArchitectureDiagram?: () => void;
  onOpenVersionControl?: () => void;
  currentVersion?: string;
  onLogout?: () => void;
  onToggleStartMenu?: () => void;
  isStartMenuOpen?: boolean;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolName,
  activeTab,
  onSelectTab,
  onGoBack,
  navigationHistory = [],
  notifications = [],
  currentRole = 'ADMIN',
  onChangeRole,
  userAccounts = [],
  currentUser,
  onSelectUserAccount,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onOpenNotificationModal,
  onOpenShortcutsModal,
  onOpenQuickSearch,
  onOpenArchitectureDiagram,
  onOpenVersionControl,
  currentVersion,
  onLogout,
  onToggleStartMenu,
  isStartMenuOpen = false,
  onOpenTour,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [serverPingOk, setServerPingOk] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(now);
      setCurrentDateTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/ping')
      .then((r) => r.json())
      .then((data) => {
        if (data.pong) setServerPingOk(true);
      })
      .catch(() => setServerPingOk(true)); // Fallback
  }, []);

  // Filter notifications for active persona
  const unreadRoleNotifications = (notifications || []).filter(
    (n) => !n?.read && (
      n?.targetRoles?.includes(currentRole) ||
      (Array.isArray(n?.targetRoles) && n.targetRoles.length === 0) ||
      !n?.targetRoles
    )
  );

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'MAIN_DASHBOARD':
        return 'Dashbox Principal • Visão Executiva & Notificações';
      case 'TEACHER_PORTAL':
      case 'PROFESSOR_DASHBOARD':
      case 'PROFESSOR':
        return 'Portal do Professor • Diário, Frequência & Lançamento de Notas';
      case 'STUDENTS':
        return 'Secretaria Acadêmica & Gestão de Matrículas';
      case 'CLASS_DIARY':
        return 'Diário de Classe, Chamadas & Normativas Estaduais';
      case 'DROPOUT_CENSUS':
        return 'Censo de Evasão Escolar & Busca Ativa Municipal';
      case 'CLASSES':
        return 'Turmas, Matrizes Curriculares & Disciplinas';
      case 'DOCUMENTS':
        return 'Emissão Oficial de Certificados & Documentos';
      case 'COMMUNICATION':
        return 'Mural de Comunicados & Avisos SME';
      case 'WHATSAPP':
        return 'WhatsApp Notificações & Comunicados Automáticos';
      case 'NOTIFICATIONS':
        return 'Central de Notificações & Auditoria Preventiva';
      case 'QUESTION_BANK':
        return 'Banco de Questões & Habilidades BNCC';
      case 'EXAMS':
        return 'Gerador de Provas & Avaliações Diagnósticas';
      case 'STUDENT_ROOM':
        return 'Sala do Estudante (Ambiente de Provas)';
      case 'PEDAGOGICAL_DASHBOARD':
        return 'Evolução Pedagógica Discente & Turmas';
      case 'ASSESSMENT_REPORT':
        return 'Resultados Oficiais de Avaliações por Nível e Escola';
      case 'MUNICIPAL_SYNC':
        return 'Gestão Municipal & Unificação de Polos Remotos';
      case 'ADMIN_TI':
        return 'Central de Administração & TI • Painel Geral';
      case 'CLEANSLATE_HUB':
        return 'CleanSlate Enterprise • Reset e Higienização de Banco';
      case 'INSTALAFLOW':
        return 'InstalaFlow Híbrido • Gestão de Deploy e Instalação Supabase';
      case 'DATASYNC_PRO':
        return 'DataSync Pro • Sincronização & Migração Supabase';
      case 'USER_CONTROL':
        return 'Controle de Usuários, Setores & Permissões';
      case 'SYSTEM_UPDATES':
        return 'Central de Atualizações & Histórico de Versões';
      case 'OMNI_DEPLOY':
        return 'OmniDeploy • Sistema de Gestão e Instalação Híbrida';
      case 'NEXUS_DEPLOYER':
        return 'NexusDeployer • Provisionamento & Updates na Nuvem';
      case 'NEXUS_INSTALL':
        return 'NexusInstall • Gerenciador de Módulos & Instaladores';
      case 'NEXUS_BUILD':
        return 'NexusBuild • Diagnóstico, Instalação & Empacotamento Total';
      case 'NETWORK_INSTALLER':
        return 'Instalador de Rede Local, Nuvem & Backup';
      case 'ABOUT':
        return 'Sobre o SucessoEdu & Dados do Desenvolvedor';
      default:
        return 'SucessoEdu Gestão Educacional';
    }
  };

  const getShortTabLabel = (tab: string) => {
    switch (tab) {
      case 'MAIN_DASHBOARD':
        return 'Visão Geral';
      case 'TEACHER_PORTAL':
      case 'PROFESSOR_DASHBOARD':
      case 'PROFESSOR':
        return 'Portal do Professor';
      case 'STUDENTS':
        return 'Alunos & Matrículas';
      case 'CLASS_DIARY':
        return 'Diário de Classe';
      case 'DROPOUT_CENSUS':
        return 'Censo de Evasão';
      case 'CLASSES':
        return 'Turmas & Horários';
      case 'DOCUMENTS':
        return 'Documentos Oficiais';
      case 'COMMUNICATION':
        return 'Mural de Avisos';
      case 'WHATSAPP':
        return 'WhatsApp Notificações';
      case 'NOTIFICATIONS':
        return 'Notificações';
      case 'QUESTION_BANK':
        return 'Banco de Questões';
      case 'EXAMS':
        return 'Avaliações & Provas';
      case 'STUDENT_ROOM':
        return 'Sala do Estudante';
      case 'PEDAGOGICAL_DASHBOARD':
        return 'Evolução Pedagógica';
      case 'ASSESSMENT_REPORT':
        return 'Relatórios de Avaliação';
      case 'MUNICIPAL_SYNC':
        return 'Sincronização Municipal';
      case 'ADMIN_TI':
        return 'Administração & TI';
      case 'CLEANSLATE_HUB':
        return 'CleanSlate';
      case 'INSTALAFLOW':
        return 'InstalaFlow';
      case 'DATASYNC_PRO':
        return 'DataSync Pro';
      case 'USER_CONTROL':
        return 'Controle de Usuários';
      case 'SYSTEM_UPDATES':
        return 'Atualizações';
      case 'OMNI_DEPLOY':
        return 'OmniDeploy';
      case 'NEXUS_DEPLOYER':
        return 'NexusDeployer';
      case 'NEXUS_INSTALL':
        return 'NexusInstall';
      case 'NEXUS_BUILD':
        return 'NexusBuild';
      case 'NETWORK_INSTALLER':
        return 'Central de Instalação';
      case 'ABOUT':
        return 'Sobre o Sistema';
      default:
        return 'Módulo';
    }
  };

  const isNotDashboard = activeTab !== 'MAIN_DASHBOARD';

  return (
    <header
      id="app-header"
      className="no-print h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* LADO ESQUERDO: Marca Oficial SucessoEdu + Pílula de Módulo Ativo */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Marca SucessoEdu com Ícone de Capelo */}
        <div
          id="header-brand-logo"
          onClick={() => onSelectTab('MAIN_DASHBOARD')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          title="Ir para a Visão Geral do Sistema"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>SucessoEdu</span>
              <span className="hidden md:inline text-xs font-semibold text-slate-400 font-normal">| Gestão Educacional</span>
            </div>
            <div className="text-[11px] font-bold text-blue-600 truncate max-w-[200px] sm:max-w-[320px]">
              {schoolName || 'Colégio Horizonte do Saber & Inovação'}
            </div>
          </div>
        </div>

        {/* Indicador de Módulo Ativo */}
        {isNotDashboard && (
          <div
            id="header-active-module-badge"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 max-w-[240px] truncate"
          >
            {onGoBack && (
              <button
                onClick={onGoBack}
                title="Voltar para tela anterior (Alt + ←)"
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0 mr-0.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="text-slate-500 font-medium">Módulo:</span>
            <span className="text-slate-900 font-bold truncate">
              {getShortTabLabel(activeTab)}
            </span>
          </div>
        )}
      </div>

      {/* LADO DIREITO: Ações Contextuais + Perfil do Operador + Notificações */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Botão de Diagrama de Módulos & Central de Solicitações IA */}
        {onOpenArchitectureDiagram && (
          <button
            id="btn-header-diagram-hub"
            onClick={onOpenArchitectureDiagram}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 shadow-2xs transition-all cursor-pointer"
            title="Ver Diagrama de Arquitetura e Central de Solicitações para IA"
          >
            <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Diagrama & IA</span>
          </button>
        )}

        {/* Botão Oficial de Controle de Versões & Melhorias */}
        {onOpenVersionControl && (
          <button
            id="btn-header-version-control"
            onClick={onOpenVersionControl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-700 shadow-2xs transition-all cursor-pointer group"
            title="Ver Controle de Versões & Apresentação de Melhorias"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-[11px] text-purple-800 font-bold">{currentVersion || 'v5.4.1'}</span>
            <span className="hidden xl:inline text-[9px] bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded-md font-sans uppercase">Novidades</span>
          </button>
        )}

        {/* Botão do Tour Guiado */}
        {onOpenTour && (
          <button
            id="btn-header-guided-tour"
            onClick={onOpenTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-700 shadow-2xs transition-all cursor-pointer group"
            title="Abrir Tour Guiado do Sistema"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Tour Guiado</span>
          </button>
        )}

        {/* Card do Usuário Ativo (AD Admin Master ADS / ADMIN - TI) */}
        <div className="relative">
          <button
            id="btn-header-user-profile"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs text-left"
            title="Alternar perfil de operador ou ver permissões"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
              {currentUser?.isMaster ? 'AD' : currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden lg:block leading-tight">
              <div className="text-xs font-black text-slate-900 truncate max-w-[140px]">
                {currentUser?.name || 'Admin Master ADS'}
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider leading-none">
                {currentUser?.role === 'ADMIN' ? 'ADMIN - TI' : currentUser?.sector || 'ADMIN - TI'}
              </div>
            </div>
          </button>

          {/* Menu Dropdown de Troca Rápida de Usuário */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-900 block">Operador Atual</span>
                <span className="text-[10px] text-slate-400">Selecione para alternar permissões</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                {userAccounts.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUserAccount?.(u);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      currentUser?.id === u.id
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {u.isMaster && <span>👑</span>}
                        <span>{u.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{u.roleTitle} ({u.sector})</div>
                    </div>
                    {currentUser?.id === u.id && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => {
                    onSelectTab('USER_CONTROL');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-center py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer block"
                >
                  Gerenciar Usuários &amp; Permissões
                </button>
                {onOpenVersionControl && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenVersionControl();
                    }}
                    className="w-full text-center py-1 text-xs font-bold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>Controle de Versões &amp; Melhorias</span>
                  </button>
                )}
                {onOpenShortcutsModal && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenShortcutsModal();
                    }}
                    className="w-full text-center py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer block"
                  >
                    Atalhos de Teclado (Alt+K)
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-center py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer block"
                  >
                    Encerrar Sessão
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sino de Notificações com Badge Numérico (6) */}
        <div className="relative">
          <button
            id="btn-header-notifications"
            onClick={() => {
              if (onOpenNotificationModal) {
                onOpenNotificationModal();
              } else {
                setIsPopoverOpen((prev) => !prev);
              }
            }}
            title="Central de Notificações do Sistema"
            className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer flex items-center justify-center relative bg-slate-50 shadow-2xs"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {unreadRoleNotifications.length > 0 ? unreadRoleNotifications.length : '6'}
            </span>
          </button>

          {isPopoverOpen && (
            <NotificationPopover
              isOpen={isPopoverOpen}
              onClose={() => setIsPopoverOpen(false)}
              notifications={notifications}
              currentRole={currentRole}
              onMarkAsRead={(id) => onMarkNotificationAsRead?.(id)}
              onMarkAllAsRead={() => onMarkAllNotificationsAsRead?.()}
              onOpenFullCenter={() => {
                onSelectTab('NOTIFICATIONS');
                onOpenNotificationModal?.();
              }}
              onNavigateTab={(tab, payload) => onSelectTab(tab, payload)}
            />
          )}
        </div>
      </div>
    </header>
  );
};
