import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Home,
  ChevronRight,
  History,
  Layers,
  Sparkles,
  School,
  Clock,
  Compass,
} from 'lucide-react';

interface NavigationBreadcrumbsProps {
  activeTab: string;
  navigationHistory: string[];
  onGoBack: () => void;
  onNavigate: (tab: string, payload?: any) => void;
  schoolName?: string;
  customTitle?: string;
}

const TAB_LABELS: Record<string, { label: string; group: string }> = {
  MAIN_DASHBOARD: { label: 'Visão Geral & Dashbox', group: 'Início' },
  OMNI_DEPLOY: { label: 'OmniDeploy • Gestão e Instalação Híbrida', group: 'Deploy & Nuvem' },
  NEXUS_DEPLOYER: { label: 'NexusDeployer • Provisionamento & Updates', group: 'Deploy & Nuvem' },
  NEXUS_INSTALL: { label: 'NexusInstall • Gerenciador de Módulos e Instaladores', group: 'Deploy & Nuvem' },
  TEACHER_PORTAL: { label: 'Portal do Professor', group: 'Docente' },
  PROFESSOR_DASHBOARD: { label: 'Portal do Professor', group: 'Docente' },
  PROFESSOR: { label: 'Portal do Professor', group: 'Docente' },
  STUDENTS: { label: 'Secretaria & Matrículas', group: 'Ensino' },
  CLASS_DIARY: { label: 'Diário de Classe & Chamada', group: 'Docente' },
  CLASSES: { label: 'Turmas & Matrizes Curriculares', group: 'Ensino' },
  DROPOUT_CENSUS: { label: 'Censo de Evasão & Busca Ativa', group: 'Gestão' },
  DOCUMENTS: { label: 'Certificados & Documentos Oficiais', group: 'Secretaria' },
  PEDAGOGICAL_DASHBOARD: { label: 'Evolução Pedagógica & Desempenho', group: 'Pedagógico' },
  ASSESSMENT_REPORT: { label: 'Resultados Oficiais de Avaliações', group: 'Pedagógico' },
  QUESTION_BANK: { label: 'Banco de Questões BNCC', group: 'Pedagógico' },
  EXAMS: { label: 'Gerador de Provas & Avaliações', group: 'Pedagógico' },
  STUDENT_ROOM: { label: 'Sala do Aluno (Provas)', group: 'Estudante' },
  MUNICIPAL_SYNC: { label: 'Polos Remotos & Gestão Municipal', group: 'Municipal' },
  COMMUNICATION: { label: 'Mural de Avisos & Comunicados', group: 'Comunicação' },
  WHATSAPP: { label: 'WhatsApp Notificações Automáticas', group: 'Comunicação' },
  USER_CONTROL: { label: 'Controle de Usuários & Permissões', group: 'Administração' },
  SYSTEM_UPDATES: { label: 'Atualizações na Nuvem (OTA)', group: 'Administração' },
  NETWORK_INSTALLER: { label: 'Instaladores Locais & Backup', group: 'Infraestrutura' },
  ABOUT: { label: 'Sobre o Sistema & Desenvolvedor', group: 'Sistema' },
};

export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({
  activeTab,
  navigationHistory,
  onGoBack,
  onNavigate,
  schoolName = 'SucessoEdu',
  customTitle,
}) => {
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const isDashboard = activeTab === 'MAIN_DASHBOARD';
  const currentInfo = TAB_LABELS[activeTab] || { label: customTitle || activeTab, group: 'Sistema' };

  // Atalho global Alt + Seta Esquerda para voltar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        onGoBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGoBack]);

  return (
    <nav
      id="navigation-breadcrumbs-bar"
      aria-label="Navegação Universal"
      className="no-print bg-[#f8fafc] border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between transition-all sticky top-16 z-20 shadow-2xs select-none"
    >
      {/* Botão Voltar Universal + Trilha de Navegação */}
      <div className="flex items-center gap-2.5 min-w-0">
        {!isDashboard && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-universal-back"
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#1a73e8]/10 text-[#202124] hover:text-[#1a73e8] border border-slate-300/80 shadow-2xs text-xs font-bold transition-all cursor-pointer group active:scale-95"
              title="Voltar para tela anterior (Atalho: Alt + ←)"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#1a73e8] group-hover:-translate-x-0.5 transition-transform" />
              <span>Voltar</span>
              <kbd className="hidden md:inline-block text-[10px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-500 border border-slate-200">
                Alt+←
              </kbd>
            </button>

            {/* Histórico Recente de Rotas Dropdown */}
            {navigationHistory.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300/80 text-slate-600 transition-colors cursor-pointer"
                  title="Histórico de Navegação"
                >
                  <History className="h-3.5 w-3.5" />
                </button>

                {isHistoryDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsHistoryDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in-50 zoom-in-95">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Histórico de Telas</span>
                      </div>
                      <div className="mt-1 space-y-0.5 max-h-56 overflow-y-auto">
                        {navigationHistory
                          .slice(-6)
                          .reverse()
                          .map((histTab, idx) => {
                            const label = TAB_LABELS[histTab]?.label || histTab;
                            return (
                              <button
                                key={`${histTab}-${idx}`}
                                onClick={() => {
                                  setIsHistoryDropdownOpen(false);
                                  onNavigate(histTab);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#1a73e8]/10 hover:text-[#1a73e8] text-slate-700 transition-colors flex items-center justify-between"
                              >
                                <span className="truncate">{label}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{navigationHistory.length - idx}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trilha de Migalhas (Breadcrumbs) */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => onNavigate('MAIN_DASHBOARD')}
            className="flex items-center gap-1 text-slate-600 hover:text-[#1a73e8] font-medium transition-colors cursor-pointer shrink-0"
            title="Início"
          >
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Início</span>
          </button>

          {!isDashboard && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
              <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 text-[11px] font-semibold shrink-0">
                {currentInfo.group}
              </span>
              <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
              <span className="font-bold text-[#202124] truncate shrink-0 max-w-[220px] sm:max-w-none">
                {currentInfo.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Identificação de Contexto e Conexão Híbrida */}
      <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-700">Modo Híbrido Ativo</span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] font-mono text-[#1a73e8] font-bold">Google Cloud / Local</span>
        </div>
      </div>
    </nav>
  );
};
