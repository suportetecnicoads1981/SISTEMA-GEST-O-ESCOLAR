import React, { useState, useEffect, useRef } from 'react';
import { isTabAvailable } from '../../config/features';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  UserX,
  Award,
  TrendingUp,
  HelpCircle,
  ClipboardList,
  CheckCircle2,
  Building2,
  MessageSquare,
  Key,
  Sliders,
  Server,
  Database,
  RefreshCw,
  Network,
  GitBranch,
  Info,
  Search,
  Power,
  Lock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Clock,
  Pin,
  History,
  X,
  FileSpreadsheet,
  DownloadCloud,
  FileText,
} from 'lucide-react';
import { UserAccount } from '../../types';

interface WindowsStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (tabId: string) => void;
  currentUser?: UserAccount;
  onLogout?: () => void;
  schoolName?: string;
  onOpenVersionControl?: () => void;
  onOpenArchitectureDiagram?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenCustomReportBuilder?: () => void;
}

export const WindowsStartMenu: React.FC<WindowsStartMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  currentUser,
  onLogout,
  schoolName,
  onOpenVersionControl,
  onOpenArchitectureDiagram,
  onOpenShortcutsModal,
  onOpenCustomReportBuilder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPowerOptions, setShowPowerOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setShowPowerOptions(false);
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Aplicativos / Módulos Fixados no Menu Iniciar Vertical Direito
  const pinnedApps = [
    { id: 'MAIN_DASHBOARD', name: 'Visão Geral & Métricas', desc: 'Dashbox, Anomalias & Gráficos', icon: LayoutDashboard, color: 'bg-blue-600', group: 'Geral' },
    { id: 'STUDENTS', name: 'Alunos & Matrículas', desc: 'Secretaria Acadêmica & Censo', icon: Users, color: 'bg-indigo-600', group: 'Acadêmico' },
    { id: 'CLASSES', name: 'Turmas & Horários', desc: 'Enturmação, Salas e Matrizes', icon: Layers, color: 'bg-purple-600', group: 'Acadêmico' },
    { id: 'CLASS_DIARY', name: 'Diário de Classe & Frequência', desc: 'Chamadas e Aulas Ministradas', icon: BookOpen, color: 'bg-emerald-600', group: 'Pedagógico' },
    { id: 'TEACHER_PORTAL', name: 'Portal Docente', desc: 'Lançamento de Notas e Avaliações', icon: GraduationCap, color: 'bg-sky-600', group: 'Pedagógico' },
    { id: 'EXAMS', name: 'Provas & Avaliações', desc: 'Gerador de Provas e Gabaritos', icon: ClipboardList, color: 'bg-amber-600', group: 'Pedagógico' },
    { id: 'QUESTION_BANK', name: 'Banco de Questões BNCC', desc: 'Habilidades e Itens Avaliativos', icon: HelpCircle, color: 'bg-teal-600', group: 'Pedagógico' },
    { id: 'DOCUMENTS', name: 'Emissão de Documentos', desc: 'Históricos, Declarações e Diplomas', icon: Award, color: 'bg-rose-600', group: 'Secretaria' },
    { id: 'DROPOUT_CENSUS', name: 'Censo & Evasão Escolar', desc: 'Busca Ativa e Infrequência', icon: UserX, color: 'bg-orange-600', group: 'Gestão' },
    { id: 'PEDAGOGICAL_DASHBOARD', name: 'Evolução Pedagógica', desc: 'Diagnósticos e Rendimento', icon: TrendingUp, color: 'bg-cyan-600', group: 'Gestão' },
    { id: 'MUNICIPAL_SYNC', name: 'Polos & Unidades da Rede', desc: 'Sincronização e Censo Municipal', icon: Building2, color: 'bg-violet-600', group: 'Rede' },
    { id: 'COMMUNICATION', name: 'Mural & Mensagens', desc: 'Comunicados e Avisos Oficiais', icon: MessageSquare, color: 'bg-pink-600', group: 'Comunicação' },
    { id: 'WHATSAPP', name: 'WhatsApp Notificações', desc: 'Avisos e Cobranças Automáticas', icon: MessageSquare, color: 'bg-emerald-500', group: 'Comunicação' },
    { id: 'ADMIN_TI', name: 'Administração & TI', desc: 'Segurança, Servidor e Logs', icon: Sliders, color: 'bg-slate-700', group: 'Sistema' },
    { id: 'INSTALAFLOW', name: 'InstalaFlow Híbrido', desc: 'Deploy, Offline e Nuvem', icon: Server, color: 'bg-indigo-500', group: 'Sistema' },
    { id: 'DATASYNC_PRO', name: 'DataSync Pro & Banco', desc: 'Backups, Migração e Schemas', icon: Database, color: 'bg-blue-700', group: 'Sistema' },
    { id: 'USER_CONTROL', name: 'Usuários & Permissões', desc: 'Contas, Perfis e Acessos', icon: Key, color: 'bg-zinc-700', group: 'Segurança' },
    { id: 'NETWORK_INSTALLER', name: 'Instaladores Windows', desc: 'Pacotes Offline e Rede Local', icon: Network, color: 'bg-cyan-700', group: 'Deploy' },
  ];

  // Filtro de busca estilo Windows Search
  const availableApps = pinnedApps.filter((app) => isTabAvailable(app.id));
  const filteredApps = searchQuery.trim()
    ? availableApps.filter(
        (app) =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.group.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableApps;

  const handleAppClick = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      id="windows-start-menu-vertical-right"
      className="fixed top-0 right-0 bottom-0 h-full w-[380px] sm:w-[440px] max-w-[95vw] bg-slate-900/98 text-slate-100 shadow-2xl border-l border-slate-700/80 backdrop-blur-2xl z-50 flex flex-col overflow-hidden select-none animate-in slide-in-from-right duration-200"
      style={{
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Cabeçalho do Painel Lateral Direito */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30 shrink-0">
            {currentUser?.isMaster ? 'AD' : currentUser?.name?.substring(0, 2).toUpperCase() || 'SE'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>{currentUser?.name || 'Administrador Master'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-[11px] text-indigo-400 font-medium truncate">
              {schoolName || 'Escola Polo Municipal'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Fechar Menu Iniciar (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Barra de Pesquisa Estilo Windows Search */}
      <div className="p-3.5 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar módulos, alunos, turmas ou relatórios..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:bg-slate-950 rounded-xl text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Ações Rápidas de Destaque no Topo do Menu */}
      <div className="px-3.5 py-2.5 bg-indigo-950/20 border-b border-slate-800/60 shrink-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            onClose();
            onOpenCustomReportBuilder?.();
          }}
          className="flex items-center gap-2 p-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 hover:text-white transition-all text-left cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold truncate">Relatórios Custom</div>
            <div className="text-[9px] text-indigo-300/80 truncate">Em todos os módulos</div>
          </div>
        </button>

        <button
          onClick={() => {
            onClose();
            onNavigate('INSTALAFLOW');
          }}
          className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-600/40 text-emerald-200 hover:text-white transition-all text-left cursor-pointer"
        >
          <DownloadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold truncate">Atualizações OTA</div>
            <div className="text-[9px] text-emerald-300/80 truncate">Google Drive Sync</div>
          </div>
        </button>
      </div>

      {/* Lista Vertical de Módulos com Rolagem */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 sidebar-scrollbar">
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Módulos do Sistema ({filteredApps.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Painel Lateral Direito
            </span>
          </div>

          <div className="space-y-1.5">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              const isActive = activeTab === app.id;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer border group ${
                    isActive
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${app.color} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                      <span className="truncate">{app.name}</span>
                      <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-400 border border-slate-800 shrink-0 ml-1">
                        {app.group}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {app.desc}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Ferramentas do Sistema */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ferramentas & Diagnósticos</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenVersionControl?.();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-center transition-all text-slate-300 hover:text-white cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform mb-1" />
              <div className="text-[10px] font-semibold truncate w-full">Versões</div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenArchitectureDiagram?.();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-center transition-all text-slate-300 hover:text-white cursor-pointer group"
            >
              <GitBranch className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
              <div className="text-[10px] font-semibold truncate w-full">Diagrama</div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenShortcutsModal?.();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-center transition-all text-slate-300 hover:text-white cursor-pointer group"
            >
              <History className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
              <div className="text-[10px] font-semibold truncate w-full">Atalhos</div>
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé do Menu Iniciar com Perfil e Opções de Energia */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 relative">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>SucessoEdu v5.5 • Online</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowPowerOptions(!showPowerOptions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm border border-slate-700"
            title="Opções de Energia / Sessão"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Sair / Reiniciar</span>
          </button>

          {/* Menu Dropdown de Opções de Energia */}
          {showPowerOptions && (
            <div className="absolute right-0 bottom-12 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setShowPowerOptions(false);
                  onClose();
                  window.location.reload();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reiniciar Aplicação</span>
              </button>
              <button
                onClick={() => {
                  setShowPowerOptions(false);
                  onClose();
                  onLogout?.();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-rose-600/20 text-rose-300 hover:text-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Power className="w-3.5 h-3.5 text-rose-400" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
