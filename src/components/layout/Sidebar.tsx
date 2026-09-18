import React, { useState } from 'react';
import {
  Users,
  Layers,
  Award,
  HelpCircle,
  ClipboardList,
  BarChart3,
  Network,
  ShieldCheck,
  Info,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Building2,
  Key,
  LayoutDashboard,
  Bell,
  HardDrive,
  UserX,
  BookOpen,
  MessageSquare,
  RefreshCw,
  LogOut,
  Keyboard,
  Server,
  Cpu,
  Database,
  Box,
  Wrench,
  ChevronDown,
  ChevronRight,
  Folder,
  Sliders,
  Terminal,
  Settings2,
  GitBranch,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  currentTab?: string;
  onSelectTab: (tab: string) => void;
  onLogout?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenVersionControl?: () => void;
  currentVersion?: string;
  counts?: {
    students?: number;
    exams?: number;
    questions?: number;
    submissions?: number;
    unreadNotifications?: number;
    unreadMessages?: number;
    schoolUnits?: number;
    userAccounts?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  onLogout,
  onOpenShortcutsModal,
  onOpenVersionControl,
  currentVersion,
  counts,
}) => {
  const current = activeTab || currentTab || 'MAIN_DASHBOARD';
  const [isAdminTIExpanded, setIsAdminTIExpanded] = useState(true);

  // Check if current tab is any of the Admin/TI tools
  const adminTITabs = [
    'ARCHITECTURE_DIAGRAM',
    'ADMIN_TI',
    'OMNI_DEPLOY',
    'NEXUS_DEPLOYER',
    'NEXUS_INSTALL',
    'NEXUS_BUILD',
    'CLEANSLATE_HUB',
    'INSTALAFLOW',
    'DATASYNC_PRO',
    'USER_CONTROL',
    'SYSTEM_UPDATES',
    'NETWORK_INSTALLER',
    'ABOUT',
  ];
  const isCurrentInAdminTI = adminTITabs.includes(current);

  const menuSections = [
    {
      title: 'Visão Geral & Notificações',
      items: [
        {
          id: 'MAIN_DASHBOARD',
          label: 'Visão Geral / Dashbox',
          icon: LayoutDashboard,
          badge: 'Principal',
          shortcut: 'Alt+D',
        },
        {
          id: 'ARCHITECTURE_DIAGRAM',
          label: 'Diagrama & Solicitações IA',
          icon: GitBranch,
          badge: '18 Módulos',
          shortcut: 'Alt+A',
        },
        {
          id: 'NOTIFICATIONS',
          label: 'Central de Notificações',
          icon: Bell,
          count: counts?.unreadNotifications,
          shortcut: 'Alt+N',
        },
      ],
    },
    {
      title: 'Espaço do Docente & Gestão de Turmas',
      items: [
        {
          id: 'TEACHER_PORTAL',
          label: 'Portal do Professor',
          icon: GraduationCap,
          badge: 'Minhas Turmas',
        },
        {
          id: 'CLASS_DIARY',
          label: 'Diário & Frequência',
          icon: BookOpen,
          badge: 'Normativas',
          shortcut: 'Alt+E',
        },
      ],
    },
    {
      title: 'Secretaria & Ensino',
      items: [
        { id: 'STUDENTS', label: 'Secretaria & Alunos', icon: Users, count: counts?.students, shortcut: 'Alt+S' },
        { id: 'CLASSES', label: 'Turmas & Matrizes', icon: Layers, shortcut: 'Alt+T' },
        { id: 'DROPOUT_CENSUS', label: 'Censo de Evasão & Busca Ativa', icon: UserX, badge: 'Censo', shortcut: 'Alt+C' },
        { id: 'DOCUMENTS', label: 'Documentos & Certificados', icon: Award, badge: 'Oficial', shortcut: 'Alt+O' },
      ],
    },
    {
      title: 'Pedagógico & Avaliações',
      items: [
        {
          id: 'PEDAGOGICAL_DASHBOARD',
          label: 'Evolução Pedagógica',
          icon: TrendingUp,
          badge: 'Gráficos',
          shortcut: 'Alt+R',
        },
        {
          id: 'ASSESSMENT_REPORT',
          label: 'Resultados Nível & Escola',
          icon: Award,
          badge: 'Oficial',
        },
        { id: 'QUESTION_BANK', label: 'Banco de Questões BNCC', icon: HelpCircle, count: counts?.questions, shortcut: 'Alt+Q' },
        { id: 'EXAMS', label: 'Gerador de Provas & Exames', icon: ClipboardList, count: counts?.exams, shortcut: 'Alt+P' },
        { id: 'STUDENT_ROOM', label: 'Sala do Aluno (Provas)', icon: CheckCircle2, badge: 'Ao Vivo', shortcut: 'Alt+F' },
      ],
    },
    {
      title: 'Gestão Municipal & Comunicação',
      items: [
        {
          id: 'MUNICIPAL_SYNC',
          label: 'Polos Remotos & Censo',
          icon: Building2,
          count: counts?.schoolUnits,
          badge: '.edusync',
          shortcut: 'Alt+M',
        },
        {
          id: 'COMMUNICATION',
          label: 'Mural de Avisos SME',
          icon: ClipboardList,
          badge: counts?.unreadMessages ? `${counts.unreadMessages} novos` : undefined,
        },
        {
          id: 'WHATSAPP',
          label: 'WhatsApp Notificações',
          icon: MessageSquare,
          badge: 'Online',
          shortcut: 'Alt+W',
        },
      ],
    },
    {
      title: 'Administração & TI',
      isCollapsible: true,
      hubTab: 'ADMIN_TI',
      hubLabel: 'Central de Administração & TI',
      hubBadge: 'Hub Geral',
      hubShortcut: 'Alt+M',
      items: [
        {
          id: 'ADMIN_TI',
          label: 'Painel Central TI & Admin',
          icon: Sliders,
          badge: 'Geral',
          shortcut: 'Alt+M',
        },
        {
          id: 'OMNI_DEPLOY',
          label: 'OmniDeploy Híbrido',
          icon: Server,
          badge: 'Google M3',
        },
        {
          id: 'NEXUS_DEPLOYER',
          label: 'NexusDeployer Cloud',
          icon: Cpu,
          badge: '12/12 Root',
        },
        {
          id: 'NEXUS_INSTALL',
          label: 'NexusInstall Manager',
          icon: Box,
          badge: 'Rede & Build',
          shortcut: 'Alt+X',
        },
        {
          id: 'NEXUS_BUILD',
          label: 'NexusBuild Total .EXE',
          icon: Wrench,
          badge: 'C:\\ Raiz',
          shortcut: 'Alt+B',
        },
        {
          id: 'CLEANSLATE_HUB',
          label: 'CleanSlate Enterprise',
          icon: ShieldCheck,
          badge: 'Zero-Data',
          shortcut: 'Alt+Z',
        },
        {
          id: 'INSTALAFLOW',
          label: 'InstalaFlow Híbrido',
          icon: Layers,
          badge: 'Supabase',
          shortcut: 'Alt+F',
        },
        {
          id: 'DATASYNC_PRO',
          label: 'DataSync Pro',
          icon: Database,
          badge: 'Supabase Pro',
          shortcut: 'Alt+Y',
        },
        {
          id: 'USER_CONTROL',
          label: 'Controle de Usuários',
          icon: Key,
          count: counts?.userAccounts,
          badge: 'Setores',
          shortcut: 'Alt+U',
        },
        {
          id: 'SYSTEM_UPDATES',
          label: 'Atualizações na Nuvem',
          icon: RefreshCw,
          badge: 'OTA Web',
        },
        { id: 'NETWORK_INSTALLER', label: 'Instaladores & Backup', icon: Network, shortcut: 'Alt+I' },
        { id: 'ABOUT', label: 'Sobre o Sistema & Dev', icon: Info, shortcut: 'Alt+A' },
      ],
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 min-h-[calc(100vh-4rem)] h-full select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div
          onClick={onOpenVersionControl}
          className="flex items-center gap-3 cursor-pointer group/ver"
          title="Clique para ver o Controle de Versões e Apresentação de Melhorias"
        >
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/30 group-hover/ver:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-white font-black tracking-tight text-sm block group-hover/ver:text-indigo-300 transition-colors">
              SucessoEdu
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 group-hover/ver:text-emerald-300">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>{currentVersion || 'v5.4.1'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 text-xs overflow-y-auto">
        {menuSections.map((section) => {
          const isCollapsible = (section as any).isCollapsible;
          const isSectionActive = isCollapsible && isCurrentInAdminTI;

          return (
            <div key={section.title} className="space-y-1">
              <div className="flex items-center justify-between px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  {section.title}
                  {isCollapsible && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 lowercase">
                      hub
                    </span>
                  )}
                </span>
                {isCollapsible && (
                  <button
                    onClick={() => setIsAdminTIExpanded(!isAdminTIExpanded)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isAdminTIExpanded ? 'Recolher submenu' : 'Expandir submenu'}
                  >
                    {isAdminTIExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Submenu items */}
              {(!isCollapsible || isAdminTIExpanded) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = current === item.id;
                    const isHubItem = item.id === 'ADMIN_TI';

                    return (
                      <button
                        key={item.id}
                        id={`sidebar-link-${item.id.toLowerCase()}`}
                        onClick={() => onSelectTab(item.id)}
                        title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                            : isHubItem
                            ? 'text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 border border-indigo-900/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? 'text-white'
                                : isHubItem
                                ? 'text-indigo-400 group-hover:text-indigo-300'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.shortcut && (
                            <kbd
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700/80 border border-slate-700/50'
                              }`}
                            >
                              {item.shortcut}
                            </kbd>
                          )}

                          {item.count !== undefined ? (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.count}
                            </span>
                          ) : item.badge && !item.shortcut ? (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-indigo-700 text-indigo-100'
                                  : 'bg-slate-800/90 text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Atalhos de Teclado Quick Button & Sair do Sistema */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        {onOpenShortcutsModal && (
          <button
            id="sidebar-btn-shortcuts"
            onClick={onOpenShortcutsModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer group"
            title="Ver mapa de atalhos de teclado (Alt+K ou ?)"
          >
            <div className="flex items-center gap-2.5">
              <Keyboard className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span>Atalhos de Teclado</span>
            </div>
            <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold group-hover:border-indigo-500 group-hover:text-white transition-colors">
              Alt+K
            </kbd>
          </button>
        )}

        {onLogout && (
          <button
            id="sidebar-btn-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/30 transition-all cursor-pointer group shadow-2xs"
            title="Sair do Sistema e Voltar para a Tela de Login"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Sair do Sistema</span>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300 font-black">
              Sair
            </span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px]">Modo Local Ativo</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Porta 3000</span>
      </div>
    </aside>
  );
};
