import React, { useState, useRef, useEffect } from 'react';
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
  ChevronLeft,
  Folder,
  Sliders,
  Terminal,
  Settings2,
  GitBranch,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignRight,
  Pin,
  PinOff,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const current = activeTab || currentTab || 'MAIN_DASHBOARD';
  const [isAdminTIExpanded, setIsAdminTIExpanded] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modo Fixado (Pinned) vs Ocultação Automática (Auto-Hide)
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sucessoedu_sidebar_pinned');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sucessoedu_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Se estiver fixada e não colapsada => expandida (w-64)
  // Se estiver em modo Auto-Hide (não fixada) => expande ao passar o mouse / focar
  const isExpanded = isPinned ? !isCollapsed : isHovered;

  // Posição da barra de rolagem dos módulos (Padrão: esquerda, conforme solicitado pelo usuário, com alternância opcional)
  const [scrollbarPosition, setScrollbarPosition] = useState<'left' | 'right'>(() => {
    try {
      const saved = localStorage.getItem('sucessoedu_sidebar_scrollbar_side');
      return saved === 'right' ? 'right' : 'left';
    } catch {
      return 'left';
    }
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const toggleScrollbarPosition = () => {
    const next = scrollbarPosition === 'left' ? 'right' : 'left';
    setScrollbarPosition(next);
    try {
      localStorage.setItem('sucessoedu_sidebar_scrollbar_side', next);
    } catch {}
  };

  const handleScroll = () => {
    if (!navRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = navRef.current;
    setShowScrollTop(scrollTop > 40);
    setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 30);
  };

  useEffect(() => {
    handleScroll();
  }, [searchFilter, isAdminTIExpanded]);

  const scrollToTop = () => {
    navRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (navRef.current) {
      navRef.current.scrollTo({ top: navRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Garante que o módulo ativo fique suavemente visível na rolagem
  useEffect(() => {
    if (isExpanded) {
      const activeEl = document.getElementById(`sidebar-link-${current.toLowerCase()}`);
      if (activeEl && navRef.current) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [current, isExpanded]);

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
          icon: BarChart3,
          badge: 'INEP/SAEB',
        },
        { id: 'EXAMS', label: 'Elaboração de Provas', icon: ClipboardList, count: counts?.exams, shortcut: 'Alt+P' },
        {
          id: 'QUESTIONS',
          label: 'Banco de Questões BNCC',
          icon: HelpCircle,
          count: counts?.questions,
          shortcut: 'Alt+Q',
        },
      ],
    },
    {
      title: 'Gestão Municipal & Polos',
      items: [
        {
          id: 'MUNICIPAL_SYNC',
          label: 'Rede Municipal & Polos',
          icon: Building2,
          count: counts?.schoolUnits,
          badge: 'SEMED',
          shortcut: 'Alt+M',
        },
      ],
    },
    {
      title: 'Administração & TI',
      isCollapsible: true,
      items: [
        {
          id: 'ADMIN_TI',
          label: 'Hub de Engenharia & TI',
          icon: Server,
          badge: '12 Painéis',
        },
        {
          id: 'OMNI_DEPLOY',
          label: 'Deploy em Nuvem & Docker',
          icon: Box,
          badge: 'Nuvem',
        },
        {
          id: 'NEXUS_DEPLOYER',
          label: 'Gerador de Pacotes Windows',
          icon: HardDrive,
          badge: 'Instalador',
        },
        {
          id: 'NEXUS_INSTALL',
          label: 'Instalador Rápido de Estação',
          icon: Wrench,
          badge: 'Setup',
        },
        {
          id: 'NEXUS_BUILD',
          label: 'Compilador & Empacotador',
          icon: Cpu,
          badge: 'Build',
        },
        {
          id: 'CLEANSLATE_HUB',
          label: 'Manutenção de Banco & Cache',
          icon: Database,
          badge: 'Limpeza',
        },
        {
          id: 'INSTALAFLOW',
          label: 'Assistente Passo a Passo',
          icon: Sliders,
          badge: 'Guiado',
        },
        {
          id: 'DATASYNC_PRO',
          label: 'Sincronização Remota (.edusync)',
          icon: Folder,
          badge: 'Offline',
        },
        {
          id: 'USER_CONTROL',
          label: 'Usuários & Permissões',
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

  const filteredSections = menuSections
    .map((section) => {
      if (!searchFilter.trim()) return section;
      const q = searchFilter.toLowerCase().trim();
      const items = section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      );
      if (items.length === 0) return null;
      return { ...section, items };
    })
    .filter(Boolean) as typeof menuSections;

  return (
    <aside
      id="app-sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`no-print ${
        isExpanded ? 'w-64' : 'w-14'
      } bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-full max-h-full overflow-hidden select-none transition-[width] duration-200 ease-in-out relative z-30 shadow-xl`}
    >
      {/* Brand Header */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 h-14">
        {isExpanded ? (
          <>
            <div
              onClick={onOpenVersionControl}
              className="flex items-center gap-2.5 cursor-pointer group/ver min-w-0"
              title="Clique para ver o Controle de Versões e Apresentação de Melhorias"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/30 group-hover/ver:scale-105 transition-transform shrink-0">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-white font-black tracking-tight text-xs block group-hover/ver:text-indigo-300 transition-colors truncate">
                  SucessoEdu
                </span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 group-hover/ver:text-emerald-300">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{currentVersion || 'v5.4.1'}</span>
                </span>
              </div>
            </div>

            {/* Controles do Cabeçalho da Sidebar (Fixar / Desafixar, Rolagem, Recolher) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Botão de Fixar / Ocultação Automática (Pin / Auto-Hide) */}
              <button
                onClick={togglePin}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isPinned
                    ? 'bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white'
                    : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50'
                }`}
                title={
                  isPinned
                    ? 'Barra Fixada (Clique para ativar Ocultação Automática / Auto-Hide)'
                    : 'Ocultação Automática Ativa (Recolhe para mini-trilho ao sair o cursor)'
                }
              >
                {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5 text-indigo-300" />}
              </button>

              {/* Botão de alternância da posição da barra de rolagem (Esquerda / Direita) */}
              <button
                onClick={toggleScrollbarPosition}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-all cursor-pointer"
                title={`Barra de Rolagem: Lado ${
                  scrollbarPosition === 'left' ? 'Esquerdo (padrão ativo)' : 'Direito'
                }. Clique para alternar.`}
              >
                {scrollbarPosition === 'left' ? (
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <AlignRight className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </button>

              {/* Botão de Recolher / Expandir Manual */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Recolher Menu para Mini-Trilho"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Cabeçalho Compacto no modo Mini-Rail (56px) */
          <div className="w-full flex flex-col items-center justify-center">
            <button
              onClick={() => {
                if (onToggleCollapse) onToggleCollapse();
                setIsHovered(true);
              }}
              className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/30 hover:scale-105 transition-transform cursor-pointer"
              title="SucessoEdu (Clique para Expandir o Menu Lateral)"
            >
              <GraduationCap className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Caixa de Localização Rápida de Módulos (ou botão de busca no modo compacto) */}
      <div className="px-2.5 pt-2 pb-1 shrink-0">
        {isExpanded ? (
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Localizar módulo..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:bg-slate-950 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 outline-none transition-all"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                title="Limpar filtro"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => {
                setIsHovered(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="w-8 h-8 rounded-lg bg-slate-950/60 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 flex items-center justify-center border border-slate-800 cursor-pointer transition-colors"
              title="Pesquisar Módulo (Clique para expandir)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links Shell com Barra de Rolagem Visível */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <nav
          ref={navRef}
          id="sidebar-nav-modules"
          onScroll={handleScroll}
          className={`flex-1 min-h-0 ${
            isExpanded ? 'p-3' : 'p-1.5'
          } text-xs sidebar-scrollbar select-none ${
            scrollbarPosition === 'left' && isExpanded
              ? 'sidebar-scrollbar-left'
              : 'sidebar-scrollbar-right'
          }`}
        >
          <div className="space-y-3" style={{ direction: 'ltr' }}>
            {filteredSections.map((section) => {
              const isCollapsible = (section as any).isCollapsible;
              const isSectionActive = isCollapsible && isCurrentInAdminTI;

              return (
                <div key={section.title} className="space-y-1">
                  {isExpanded && (
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
                  )}

                  {/* Submenu items */}
                  {(!isCollapsible || isAdminTIExpanded || searchFilter.trim() !== '' || !isExpanded) && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = current === item.id;
                        const isHubItem = item.id === 'ADMIN_TI';

                        if (!isExpanded) {
                          /* RENDERIZAÇÃO COMPACTA MINI-RAIL (ÍCONE + TOOLTIP FLUTUANTE) */
                          return (
                            <div key={item.id} className="relative group flex justify-center py-0.5">
                              <button
                                id={`sidebar-mini-link-${item.id.toLowerCase()}`}
                                onClick={() => onSelectTab(item.id)}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-white/20'
                                    : isHubItem
                                    ? 'text-indigo-300 hover:bg-indigo-950/60 hover:text-indigo-200 border border-indigo-900/40'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <Icon className="h-4.5 w-4.5 shrink-0" />
                                {item.count !== undefined && item.count > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
                                )}
                              </button>

                              {/* Tooltip Popover flutuante no mini-rail */}
                              <div className="fixed left-16 z-50 bg-slate-950 text-slate-100 text-xs px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap flex items-center gap-2 -translate-y-1">
                                <span className="font-bold">{item.label}</span>
                                {item.shortcut && (
                                  <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                                    {item.shortcut}
                                  </kbd>
                                )}
                                {item.count !== undefined && item.count > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-600 text-white">
                                    {item.count}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        /* RENDERIZAÇÃO COMPLETA EXPANDIDA */
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
          </div>
        </nav>

        {/* Floating Quick Scroll Buttons (visíveis quando expandido) */}
        {isExpanded && (
          <div
            className={`absolute bottom-2 ${
              scrollbarPosition === 'left' ? 'right-2.5' : 'left-2.5'
            } z-20 flex flex-col gap-1 pointer-events-none`}
          >
            {showScrollTop && (
              <button
                onClick={scrollToTop}
                title="Rolar ao topo do menu de módulos"
                className="pointer-events-auto p-1.5 rounded-lg bg-slate-800/95 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 shadow-md backdrop-blur-xs transition-all cursor-pointer group"
              >
                <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            )}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                title="Rolar ao fim do menu de módulos"
                className="pointer-events-auto p-1.5 rounded-lg bg-slate-800/95 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 shadow-md backdrop-blur-xs transition-all cursor-pointer group"
              >
                <ArrowDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Atalhos de Teclado Quick Button & Sair do Sistema */}
      <div className={`p-2 border-t border-slate-800 space-y-1.5 shrink-0 ${isExpanded ? 'p-3' : 'p-1.5'}`}>
        {onOpenShortcutsModal && (
          isExpanded ? (
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
          ) : (
            <div className="relative group flex justify-center py-0.5">
              <button
                onClick={onOpenShortcutsModal}
                className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Atalhos de Teclado (Alt+K)"
              >
                <Keyboard className="h-4.5 w-4.5" />
              </button>
              <div className="fixed left-16 z-50 bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap">
                Atalhos de Teclado (Alt+K)
              </div>
            </div>
          )
        )}

        {onLogout && (
          isExpanded ? (
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
          ) : (
            <div className="relative group flex justify-center py-0.5">
              <button
                onClick={onLogout}
                className="w-9 h-9 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 flex items-center justify-center border border-rose-900/30 transition-colors cursor-pointer"
                title="Sair do Sistema"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
              <div className="fixed left-16 z-50 bg-slate-950 text-rose-300 text-xs px-2.5 py-1.5 rounded-xl shadow-2xl border border-rose-900/60 backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap font-bold">
                Sair do Sistema
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer Info */}
      <div className={`p-2.5 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 flex items-center shrink-0 ${isExpanded ? 'justify-between px-3' : 'justify-center'}`}>
        {isExpanded ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px]">{isPinned ? 'Fixada' : 'Auto-Hide'}</span>
            </div>
            <button
              onClick={toggleScrollbarPosition}
              title={`Alternar lado da barra de rolagem (Atualmente: ${
                scrollbarPosition === 'left' ? 'Lado Esquerdo' : 'Lado Direito'
              })`}
              className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              {scrollbarPosition === 'left' ? (
                <AlignLeft className="w-3 h-3 text-indigo-400" />
              ) : (
                <AlignRight className="w-3 h-3 text-indigo-400" />
              )}
              <span>Barra {scrollbarPosition === 'left' ? 'Esq' : 'Dir'}</span>
            </button>
          </>
        ) : (
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema Online / Modo Local Ativo" />
        )}
      </div>
    </aside>
  );
};
