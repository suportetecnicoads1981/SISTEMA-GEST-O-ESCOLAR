import React from 'react';
import {
  ArrowLeft,
  X,
  Home,
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
  RefreshCw,
  Sliders,
  Server,
  Cpu,
  Box,
  Wrench,
  ShieldCheck,
  Database,
  Network,
  Info,
  NotebookPen,
  GitBranch,
  Bell,
  Search,
} from 'lucide-react';

import { moduleName } from '../../config/moduleNames';
export interface WorkspaceTabItem {
  id: string;
  title: string;
  group?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface WorkspaceTabsBarProps {
  openTabs: string[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onGoBack: () => void;
  canGoBack: boolean;
  onOpenQuickSearch?: () => void;
}

export const TAB_METADATA: Record<
  string,
  { label: string; shortLabel?: string; icon: React.ComponentType<{ className?: string }>; group: string }
> = {
  MAIN_DASHBOARD: { label: moduleName('MAIN_DASHBOARD'), shortLabel: moduleName('MAIN_DASHBOARD'), icon: LayoutDashboard, group: 'Principal' },
  TEACHER_PORTAL: { label: moduleName('TEACHER_PORTAL'), shortLabel: moduleName('TEACHER_PORTAL'), icon: GraduationCap, group: 'Docente' },
  PROFESSOR_DASHBOARD: { label: moduleName('PROFESSOR_DASHBOARD'), shortLabel: moduleName('PROFESSOR_DASHBOARD'), icon: GraduationCap, group: 'Docente' },
  PROFESSOR: { label: moduleName('PROFESSOR'), shortLabel: moduleName('PROFESSOR'), icon: GraduationCap, group: 'Docente' },
  STUDENTS: { label: moduleName('STUDENTS'), shortLabel: moduleName('STUDENTS'), icon: Users, group: 'Secretaria' },
  CLASS_DIARY: { label: moduleName('CLASS_DIARY'), shortLabel: moduleName('CLASS_DIARY'), icon: BookOpen, group: 'Docente' },
  CLASSES: { label: moduleName('CLASSES'), shortLabel: moduleName('CLASSES'), icon: Layers, group: 'Secretaria' },
  DROPOUT_CENSUS: { label: moduleName('DROPOUT_CENSUS'), shortLabel: moduleName('DROPOUT_CENSUS'), icon: UserX, group: 'Secretaria' },
  DOCUMENTS: { label: moduleName('DOCUMENTS'), shortLabel: moduleName('DOCUMENTS'), icon: Award, group: 'Secretaria' },
  PEDAGOGICAL_DASHBOARD: { label: moduleName('PEDAGOGICAL_DASHBOARD'), shortLabel: moduleName('PEDAGOGICAL_DASHBOARD'), icon: TrendingUp, group: 'Pedagógico' },
  ASSESSMENT_REPORT: { label: moduleName('ASSESSMENT_REPORT'), shortLabel: moduleName('ASSESSMENT_REPORT'), icon: Award, group: 'Pedagógico' },
  BNCC_SKILLS: { label: moduleName('BNCC_SKILLS'), shortLabel: moduleName('BNCC_SKILLS'), icon: BookOpen, group: 'Pedagógico' },
  QUESTION_BANK: { label: moduleName('QUESTION_BANK'), shortLabel: moduleName('QUESTION_BANK'), icon: HelpCircle, group: 'Pedagógico' },
  EXAMS: { label: moduleName('EXAMS'), shortLabel: moduleName('EXAMS'), icon: ClipboardList, group: 'Pedagógico' },
  STUDENT_ROOM: { label: moduleName('STUDENT_ROOM'), shortLabel: moduleName('STUDENT_ROOM'), icon: CheckCircle2, group: 'Estudante' },
  MUNICIPAL_SYNC: { label: moduleName('MUNICIPAL_SYNC'), shortLabel: moduleName('MUNICIPAL_SYNC'), icon: Building2, group: 'Municipal' },
  COMMUNICATION: { label: moduleName('COMMUNICATION'), shortLabel: moduleName('COMMUNICATION'), icon: MessageSquare, group: 'Comunicação' },
  WHATSAPP: { label: moduleName('WHATSAPP'), shortLabel: moduleName('WHATSAPP'), icon: MessageSquare, group: 'Comunicação' },
  USER_CONTROL: { label: moduleName('USER_CONTROL'), shortLabel: moduleName('USER_CONTROL'), icon: Key, group: 'Administração' },
  ADMIN_TI: { label: moduleName('ADMIN_TI'), shortLabel: moduleName('ADMIN_TI'), icon: Sliders, group: 'TI & Deploy' },
  OMNI_DEPLOY: { label: moduleName('OMNI_DEPLOY'), shortLabel: moduleName('OMNI_DEPLOY'), icon: Server, group: 'TI & Deploy' },
  NEXUS_DEPLOYER: { label: moduleName('NEXUS_DEPLOYER'), shortLabel: moduleName('NEXUS_DEPLOYER'), icon: Cpu, group: 'TI & Deploy' },
  NEXUS_INSTALL: { label: moduleName('NEXUS_INSTALL'), shortLabel: moduleName('NEXUS_INSTALL'), icon: Box, group: 'TI & Deploy' },
  NEXUS_BUILD: { label: moduleName('NEXUS_BUILD'), shortLabel: moduleName('NEXUS_BUILD'), icon: Wrench, group: 'TI & Deploy' },
  CLEANSLATE_HUB: { label: moduleName('CLEANSLATE_HUB'), shortLabel: moduleName('CLEANSLATE_HUB'), icon: ShieldCheck, group: 'TI & Deploy' },
  INSTALAFLOW: { label: moduleName('INSTALAFLOW'), shortLabel: moduleName('INSTALAFLOW'), icon: Layers, group: 'TI & Deploy' },
  DATASYNC_PRO: { label: moduleName('DATASYNC_PRO'), shortLabel: moduleName('DATASYNC_PRO'), icon: Database, group: 'TI & Deploy' },
  SYSTEM_UPDATES: { label: moduleName('SYSTEM_UPDATES'), shortLabel: moduleName('SYSTEM_UPDATES'), icon: RefreshCw, group: 'Sistema' },
  NETWORK_INSTALLER: { label: moduleName('NETWORK_INSTALLER'), shortLabel: moduleName('NETWORK_INSTALLER'), icon: Network, group: 'Infraestrutura' },
  DEV_BACKLOG: { label: moduleName('DEV_BACKLOG'), shortLabel: moduleName('DEV_BACKLOG'), icon: NotebookPen, group: 'Sistema' },
  ARCHITECTURE_DIAGRAM: { label: moduleName('ARCHITECTURE_DIAGRAM'), shortLabel: moduleName('ARCHITECTURE_DIAGRAM'), icon: GitBranch, group: 'Sistema' },
  ABOUT: { label: moduleName('ABOUT'), shortLabel: moduleName('ABOUT'), icon: Info, group: 'Sistema' },
  NOTIFICATIONS: { label: moduleName('NOTIFICATIONS'), shortLabel: moduleName('NOTIFICATIONS'), icon: Bell, group: 'Sistema' },
};

export const WorkspaceTabsBar: React.FC<WorkspaceTabsBarProps> = ({
  openTabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  onGoBack,
  canGoBack,
  onOpenQuickSearch,
}) => {
  // Ensure MAIN_DASHBOARD is always in open tabs
  const tabs = openTabs.includes('MAIN_DASHBOARD')
    ? openTabs
    : ['MAIN_DASHBOARD', ...openTabs];

  return (
    <div
      id="workspace-tabs-bar"
      className="no-print bg-slate-900 border-b border-slate-800 text-slate-300 px-3 py-1.5 flex items-center justify-between gap-2 select-none relative z-20 shadow-sm"
    >
      {/* Botões de Ação de Navegação: Voltar & Início */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            canGoBack
              ? 'bg-slate-800 hover:bg-slate-700 text-white hover:text-indigo-300 shadow-2xs border border-slate-700 active:scale-95'
              : 'opacity-40 bg-slate-900 text-slate-500 cursor-not-allowed border border-transparent'
          }`}
          title={canGoBack ? 'Voltar para tela anterior (Alt+←)' : 'Nenhuma tela anterior no histórico'}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Voltar</span>
        </button>

        <button
          onClick={() => onSelectTab('MAIN_DASHBOARD')}
          className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
            activeTab === 'MAIN_DASHBOARD'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
          }`}
          title="Dashbox Principal / Início (Alt+D)"
        >
          <Home className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lista de Abas de Módulos Abertos (Scroll Horizontal) */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1 min-w-0">
        {tabs.map((tabId) => {
          const meta = TAB_METADATA[tabId] || {
            label: tabId,
            shortLabel: tabId,
            icon: Box,
            group: 'Módulo',
          };
          const IconComponent = meta.icon;
          const isActive = activeTab === tabId;
          const isMain = tabId === 'MAIN_DASHBOARD';

          return (
            <div
              key={tabId}
              onClick={() => onSelectTab(tabId)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-white text-slate-900 border-slate-200 shadow-xs font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
              }`}
              title={`${meta.label} (${meta.group})`}
            >
              <IconComponent
                className={`h-3.5 w-3.5 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="max-w-[140px] md:max-w-[190px] truncate">
                {meta.shortLabel || meta.label}
              </span>

              {/* Botão Fechar Aba (disponível para todos os módulos exceto se for a única aba principal) */}
              {!isMain && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tabId);
                  }}
                  className={`p-0.5 rounded-md transition-colors cursor-pointer ml-1 ${
                    isActive
                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      : 'text-slate-500 hover:text-rose-400 hover:bg-slate-700'
                  }`}
                  title={`Fechar aba ${meta.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Ações Rápidas: Fechar Módulo Atual & Busca Rápida */}
      <div className="flex items-center gap-1.5 shrink-0">
        {activeTab !== 'MAIN_DASHBOARD' && (
          <button
            onClick={() => onCloseTab(activeTab)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Fechar este módulo e voltar ao início"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Fechar Módulo</span>
          </button>
        )}

        {onOpenQuickSearch && (
          <button
            onClick={onOpenQuickSearch}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Buscar Módulo (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
