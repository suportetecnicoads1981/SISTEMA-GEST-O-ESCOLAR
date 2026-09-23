import React, { useState, useEffect, useRef } from 'react';
import { isTabAvailable } from '../../config/features';
import {
  GraduationCap,
  Minus,
  Square,
  Copy,
  X,
  Printer,
  ChevronDown,
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  Award,
  Sliders,
  Server,
  Database,
  HelpCircle,
  History,
  Sparkles,
  GitBranch,
  Search,
  ExternalLink,
  Power,
  RotateCcw,
  Check,
} from 'lucide-react';
import { TAB_METADATA } from './WorkspaceTabsBar';

interface WindowsTitleBarProps {
  activeTab: string;
  schoolName?: string;
  onNavigate: (tabId: string) => void;
  onOpenQuickSearch?: () => void;
  onOpenVersionControl?: () => void;
  onOpenArchitectureDiagram?: () => void;
  onOpenShortcutsModal?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onLogout?: () => void;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  activeTab,
  schoolName,
  onNavigate,
  onOpenQuickSearch,
  onOpenVersionControl,
  onOpenArchitectureDiagram,
  onOpenShortcutsModal,
  onToggleSidebar,
  isSidebarCollapsed,
  onLogout,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Monitorar mudanças no modo Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle Fullscreen nativo
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const activeMeta = TAB_METADATA[activeTab] || { label: activeTab, group: 'Geral' };

  return (
    <>
      {/* Modal de Confirmação de Saída Estilo Windows */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
            {/* Header Janela Windows */}
            <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span>Encerrar Sessão - SucessoEdu</span>
              </div>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="text-slate-400 hover:text-white hover:bg-red-600 p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-xs space-y-3">
              <p className="text-slate-200">
                Deseja realmente encerrar a sessão de trabalho no <strong>SucessoEdu Gestão Educacional</strong>?
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Todos os dados e alterações já foram gravados com sucesso no banco de dados local.
              </div>
            </div>

            <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onLogout?.();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer shadow-sm"
              >
                Encerrar e Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Título Superior Estilo Windows (Window Titlebar) */}
      <div
        id="windows-titlebar"
        className="no-print h-9 bg-slate-950 text-slate-300 border-b border-slate-800 px-2 flex items-center justify-between select-none z-40 text-xs relative"
      >
        {/* LADO ESQUERDO: Ícone da Janela + Menus de Aplicativo Clássicos */}
        <div ref={menuContainerRef} className="flex items-center gap-1 min-w-0">
          {/* Ícone de Capelo SucessoEdu */}
          <div
            onClick={() => onNavigate('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer text-slate-200 hover:text-white transition-colors shrink-0"
            title="SucessoEdu Gestão Educacional - Início"
          >
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span className="font-extrabold text-[11px] tracking-tight hidden sm:inline">
              SucessoEdu
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

          {/* Menus Dropdown Clássicos do Windows */}
          <div className="flex items-center text-[11px]">
            {/* Menu: Arquivo */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'arquivo' ? null : 'arquivo')}
                className={`px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                  openMenu === 'arquivo' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Arquivo
              </button>
              {openMenu === 'arquivo' && (
                <div className="absolute top-8 left-0 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onNavigate('STUDENTS');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Secretaria &amp; Alunos</span>
                    <kbd className="text-[9px] text-slate-500 font-mono">Alt+S</kbd>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('CLASSES');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Turmas &amp; Horários</span>
                    <kbd className="text-[9px] text-slate-500 font-mono">Alt+T</kbd>
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      window.print();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Imprimir Relatório</span>
                    <kbd className="text-[9px] text-slate-500 font-mono">Ctrl+P</kbd>
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setShowExitConfirm(true);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-600/20 text-rose-300 flex items-center justify-between cursor-pointer"
                  >
                    <span>Sair do Sistema</span>
                    <kbd className="text-[9px] text-rose-400 font-mono">Alt+F4</kbd>
                  </button>
                </div>
              )}
            </div>

            {/* Menu: Exibir */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'exibir' ? null : 'exibir')}
                className={`px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                  openMenu === 'exibir' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Exibir
              </button>
              {openMenu === 'exibir' && (
                <div className="absolute top-8 left-0 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onNavigate('MAIN_DASHBOARD');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Visão Geral</span>
                    <kbd className="text-[9px] text-slate-500 font-mono">Alt+D</kbd>
                  </button>
                  <button
                    onClick={() => {
                      onToggleSidebar?.();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Alternar Barra Lateral</span>
                    <kbd className="text-[9px] text-slate-500 font-mono">Alt+B</kbd>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleFullscreen();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Tela Cheia</span>
                    <kbd className="text-[9px] text-slate-500 font-mono">F11</kbd>
                  </button>
                </div>
              )}
            </div>

            {/* Menu: Ferramentas */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'ferramentas' ? null : 'ferramentas')}
                className={`px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                  openMenu === 'ferramentas' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Ferramentas
              </button>
              {openMenu === 'ferramentas' && (
                <div className="absolute top-8 left-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onNavigate('ADMIN_TI');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Central de TI &amp; Servidor</span>
                  </button>
                  {isTabAvailable('INSTALAFLOW') && (
                  <button
                    onClick={() => {
                      onNavigate('INSTALAFLOW');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    <span>InstalaFlow Híbrido</span>
                  </button>
                  )}
                  <button
                    onClick={() => {
                      onNavigate('DATASYNC_PRO');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>DataSync Pro &amp; Backup</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('NETWORK_INSTALLER');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gerador de Pacotes e Atalhos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu: Ajuda */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'ajuda' ? null : 'ajuda')}
                className={`px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                  openMenu === 'ajuda' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Ajuda
              </button>
              {openMenu === 'ajuda' && (
                <div className="absolute top-8 left-0 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onOpenVersionControl?.();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Controle de Versões &amp; Novidades</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenArchitectureDiagram?.();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Diagrama de Arquitetura</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenShortcutsModal?.();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>Guia de Atalhos de Teclado</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('ABOUT');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sobre o SucessoEdu</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTRO: TÍTULO DA JANELA DO WINDOWS */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-slate-400 text-[11px] font-medium max-w-[40vw] truncate">
          <span className="text-slate-200 font-bold truncate">
            {activeMeta.label}
          </span>
          <span className="text-slate-600 hidden md:inline">—</span>
          <span className="text-slate-400 hidden md:inline truncate">
            {schoolName || 'Colégio Horizonte do Saber'}
          </span>
        </div>

        {/* LADO DIREITO: CONTROLES DE JANELA DO WINDOWS (_, 🗖/❐, ✕) */}
        <div className="flex items-center shrink-0">
          {/* Minimizar (Alterna foco da tela ou recolhe painel) */}
          <button
            onClick={onToggleSidebar}
            className="w-10 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expandir Menu de Módulos' : 'Minimizar / Ocultar Menu de Módulos'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximizar / Restaurar (Tela Cheia Nativa) */}
          <button
            onClick={handleToggleFullscreen}
            className="w-10 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Restaurar Tamanho da Janela (F11)' : 'Maximizar Janela (F11)'}
          >
            {isFullscreen ? (
              <Copy className="w-3 h-3 rotate-180" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </button>

          {/* Fechar Janela (Confirmação de Saída Segura) */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-11 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
            title="Fechar / Encerrar Sessão (Alt+F4)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};
