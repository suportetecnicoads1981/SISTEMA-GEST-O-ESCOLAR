import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  Search,
  Bell,
  Wifi,
  Volume2,
  Calendar,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Box,
} from 'lucide-react';
import { TAB_METADATA } from './WorkspaceTabsBar';

interface WindowsTaskbarProps {
  activeTab: string;
  openTabs: string[];
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onToggleStartMenu: () => void;
  isStartMenuOpen: boolean;
  onOpenQuickSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  schoolName?: string;
  totalStudents?: number;
  totalClasses?: number;
}

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  activeTab,
  openTabs,
  onSelectTab,
  onCloseTab,
  onToggleStartMenu,
  isStartMenuOpen,
  onOpenQuickSearch,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  schoolName,
  totalStudents = 0,
  totalClasses = 0,
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showCalendarFlyout, setShowCalendarFlyout] = useState(false);
  const [isAutoHide, setIsAutoHide] = useState<boolean>(() => {
    return localStorage.getItem('sucessoedu_taskbar_autohide') === 'true';
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const toggleAutoHide = () => {
    setIsAutoHide((prev) => {
      const next = !prev;
      localStorage.setItem('sucessoedu_taskbar_autohide', String(next));
      return next;
    });
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fechar calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendarFlyout(false);
      }
    };
    if (showCalendarFlyout) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendarFlyout]);

  const uniqueTabs = Array.from(new Set(['MAIN_DASHBOARD', ...openTabs]));

  return (
    <>
      {/* Calendário Flyout Estilo Windows */}
      {showCalendarFlyout && (
        <div
          ref={calendarRef}
          className="fixed bottom-12 right-2 w-72 bg-slate-900/95 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl select-none animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-2xl font-black text-white">{currentTime}</div>
              <div className="text-xs font-semibold text-indigo-400 capitalize">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <button
              onClick={() => setShowCalendarFlyout(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3">
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agenda Escolar & Expediente</span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Escola:</span>
                <span className="font-bold truncate max-w-[150px]">{schoolName || 'Escola Ativa'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alunos Ativos:</span>
                <span className="font-bold text-emerald-400">{totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Turmas:</span>
                <span className="font-bold text-blue-400">{totalClasses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Servidor Local:</span>
                <span className="font-bold text-emerald-400">Porta 3000 (Ativo)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gatilho visual sutil quando a barra está oculta para não obstruir a tela */}
      {isAutoHide && !isHovered && !isStartMenuOpen && !showCalendarFlyout && (
        <button
          onClick={() => setIsHovered(true)}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 hover:bg-blue-600 text-slate-400 hover:text-white text-[10px] font-bold px-3 py-0.5 rounded-t-lg border-t border-x border-slate-700/80 shadow-md backdrop-blur-xs transition-all flex items-center gap-1 cursor-pointer"
          title="Passe o mouse ou clique para expandir a Barra de Tarefas"
        >
          <ChevronUp className="w-3 h-3" />
          <span className="hidden sm:inline">Barra de Tarefas</span>
        </button>
      )}

      {/* Barra de Tarefas Estilo Windows (Taskbar) */}
      <footer
        id="windows-taskbar-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`no-print h-11 bg-slate-900/95 border-t border-slate-800 text-slate-200 px-2 flex items-center justify-between select-none shrink-0 z-40 backdrop-blur-md shadow-2xl transition-all duration-250 ease-in-out ${
          isAutoHide && !isHovered && !isStartMenuOpen && !showCalendarFlyout
            ? 'translate-y-[calc(100%-4px)] opacity-30 hover:opacity-100 hover:translate-y-0 cursor-pointer'
            : 'translate-y-0 opacity-100'
        }`}
      >
        {/* LADO ESQUERDO / CENTRO: Botão Iniciar + Busca + Módulos Abertos */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto scrollbar-none py-1">
          {/* Botão INICIAR Estilo Windows (4 Quadrantes Modernos) */}
          <button
            id="btn-windows-start"
            onClick={onToggleStartMenu}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm border ${
              isStartMenuOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
                : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title="Menu Iniciar do SucessoEdu (Ctrl+Esc ou Win)"
          >
            {/* Ícone 4 Quadrantes Windows */}
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0">
              <div className="bg-sky-400 rounded-[1px]" />
              <div className="bg-blue-500 rounded-[1px]" />
              <div className="bg-indigo-400 rounded-[1px]" />
              <div className="bg-blue-600 rounded-[1px]" />
            </div>
            <span className="font-extrabold tracking-wide">Iniciar</span>
          </button>

          {/* Botão de Pesquisa Rápida (Windows Search) */}
          <button
            id="btn-windows-search"
            onClick={onOpenQuickSearch}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all cursor-pointer text-xs"
            title="Pesquisar módulos, alunos ou turmas (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline text-[11px] font-medium">Pesquisar</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 shrink-0" />

          {/* Ícones de Módulos Abertos na Barra de Tarefas com Traço Ativo */}
          <div className="flex items-center gap-1 min-w-0">
            {uniqueTabs.map((tabId) => {
              const meta = TAB_METADATA[tabId] || {
                label: tabId,
                shortLabel: tabId,
                icon: Box,
              };
              const Icon = meta.icon;
              const isActive = activeTab === tabId;

              return (
                <button
                  key={tabId}
                  onClick={() => onSelectTab(tabId)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 group ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title={meta.label}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="max-w-[110px] sm:max-w-[140px] truncate text-[11px]">
                    {meta.shortLabel || meta.label}
                  </span>

                  {/* Indicador inferior de janela ativa (barra azul Windows) */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* LADO DIREITO: BANDEJA DO SISTEMA (SYSTEM TRAY) */}
        <div className="flex items-center gap-2 shrink-0 pl-2">
          {/* Indicador de Status Operacional */}
          <div
            className="hidden lg:flex items-center gap-1.5 text-[10px] font-medium text-slate-400 px-2 py-0.5 bg-slate-950/40 rounded-md border border-slate-800"
            title="Todos os subsistemas do SucessoEdu operando normalmente"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pronto</span>
          </div>

          {/* Indicadores de Hardware / Rede */}
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-400">
            <div title="Rede Local Conectada e Servidor Autônomo Ativo">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div title="Áudio e Efeitos do Sistema Ativados">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Notificações na Bandeja */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Central de Notificações"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Botão de Fixar / Ocultar Automaticamente a Barra para Liberar 100% da Tela */}
          <button
            onClick={toggleAutoHide}
            className={`p-1 rounded-lg transition-all cursor-pointer ${
              isAutoHide
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 hover:bg-blue-600/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={
              isAutoHide
                ? 'Barra em Ocultação Automática (Clique para Fixar na tela)'
                : 'Ocultar Barra Automaticamente (Libera 100% de visão da tela no módulo)'
            }
          >
            {isAutoHide ? (
              <PinOff className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Relógio e Data Estilo Bandeja do Windows (System Tray Clock) */}
          <button
            onClick={() => setShowCalendarFlyout(!showCalendarFlyout)}
            className="flex flex-col items-end px-2 py-0.5 rounded-lg hover:bg-slate-800 text-right transition-colors cursor-pointer"
            title="Abrir Calendário e Expediente"
          >
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              {currentTime || '--:--'}
            </span>
            <span className="text-[9px] text-slate-400 leading-tight">
              {currentDate || '--/--/----'}
            </span>
          </button>

          {/* Separador vertical "Mostrar Área de Trabalho" no canto direito */}
          <div
            onClick={() => onSelectTab('MAIN_DASHBOARD')}
            className="w-1.5 h-7 hover:bg-blue-500/80 rounded-xs transition-colors cursor-pointer border-l border-slate-700"
            title="Ir para a Visão Geral / Mostrar Área de Trabalho"
          />
        </div>
      </footer>
    </>
  );
};
