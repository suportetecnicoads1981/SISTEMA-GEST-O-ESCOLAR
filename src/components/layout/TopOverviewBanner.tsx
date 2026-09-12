import React from 'react';
import {
  LayoutDashboard,
  Bell,
  Sparkles,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Users,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface TopOverviewBannerProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  unreadNotificationsCount: number;
  systemVersion: string;
  onOpenWelcomeModal: () => void;
  studentsCount: number;
  classesCount: number;
}

export const TopOverviewBanner: React.FC<TopOverviewBannerProps> = ({
  activeTab,
  onNavigate,
  unreadNotificationsCount,
  systemVersion,
  onOpenWelcomeModal,
  studentsCount,
  classesCount,
}) => {
  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
      {/* Lado Esquerdo: Módulo Elevado para o Topo da Tela */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
            Módulo Topo
          </span>
          <span className="text-xs font-extrabold text-slate-800">
            Visão Geral &amp; Notificações
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 border-l border-slate-200 pl-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            {studentsCount} Alunos
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
            {classesCount} Turmas
          </span>
        </div>
      </div>

      {/* Lado Direito: Ações Rápidas de Acesso Imediato */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Botão Visão Geral / Dashbox */}
        <button
          onClick={() => onNavigate('MAIN_DASHBOARD')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'MAIN_DASHBOARD'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
          }`}
          title="Acessar Visão Geral e Indicadores Executivos"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Visão Geral</span>
        </button>

        {/* Botão Central de Notificações */}
        <button
          onClick={() => onNavigate('NOTIFICATIONS')}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer relative"
          title="Ver Central de Notificações"
        >
          <Bell className="h-3.5 w-3.5 text-amber-500" />
          <span>Notificações</span>
          {unreadNotificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Botão Novidades da Versão */}
        <button
          onClick={onOpenWelcomeModal}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-50 to-indigo-50 hover:from-amber-100 hover:to-indigo-100 text-indigo-900 border border-indigo-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          title="Ver as melhorias e novidades da versão"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin-slow" />
          <span>Novidades da Versão</span>
          <span className="font-mono text-[10px] font-black text-indigo-700 bg-white/90 px-1.5 py-0.5 rounded border border-indigo-200">
            {systemVersion}
          </span>
        </button>

        {/* Status Nuvem e Backup */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
          <span
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70"
            title="Backup preventivo atômico protegido no servidor"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dados Protegidos</span>
          </span>
        </div>
      </div>
    </div>
  );
};
