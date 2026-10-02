import React, { useState, useEffect } from 'react';
import {
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
  LifeBuoy,
  RefreshCw,
} from 'lucide-react';
import { getLocalServerInfo, flushLocalChanges } from '../../services/offline/localServerSync';
import { supabaseBatchQueue } from '../../services/supabaseBatchQueue';
import { CloudSyncIndicator } from '../offline/CloudSyncIndicator';
import { NotificationItem, UserRole, UserAccount, SchoolUnit } from '../../types';
import { annexesOf } from '../../utils/schoolAnnexes';
import type { SchoolFocus } from '../../services/rbac/schoolFocus';
import { NotificationPopover } from '../notificacoes/NotificationPopover';
import { formatPersonName } from '../../services/documentBranding';

import { moduleName } from '../../config/moduleNames';
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
  /** Abre o Tira-dúvidas do módulo atual (F1). */
  onOpenHelp?: () => void;
  /** Escola em foco (só para quem vê a rede inteira): filtra todas as telas por uma escola. */
  schoolUnits?: SchoolUnit[];
  schoolFocus?: SchoolFocus | null;
  onChangeSchoolFocus?: (focus: SchoolFocus | null) => void;
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
  onOpenHelp,
  schoolUnits = [],
  schoolFocus = null,
  onChangeSchoolFocus,
}) => {
  // Opções da escola em foco: cada escola e, para a escola sede, "sede + anexas"
  const focusOptions = [...schoolUnits]
    .filter((u) => u.type !== 'SEDE_CENTRAL')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .flatMap((u) => {
      const annexes = annexesOf(u.id, schoolUnits);
      const base = [{ value: u.id, label: u.parentUnitId ? `${u.name} (anexa)` : u.name }];
      return annexes.length ? [...base, { value: `${u.id}|+`, label: `${u.name} + anexa${annexes.length === 1 ? '' : 's'}` }] : base;
    });
  const focusValue = schoolFocus?.unitId ? `${schoolFocus.unitId}${schoolFocus.withAnnexes ? '|+' : ''}` : '';
  // Cargo exibido abaixo do nome: o que foi cadastrado para o usuário (Título / Cargo),
  // e só na falta dele o perfil de acesso.
  const ROLE_FALLBACK: Record<string, string> = {
    ADMIN: 'Administrador(a)',
    SECRETARY: 'Secretaria Escolar',
    TEACHER: 'Professor(a)',
    COORDINATOR: 'Coordenação',
    DIRECTOR: 'Direção',
  };
  const userJobTitle =
    String(currentUser?.sectorTitle || currentUser?.roleTitle || '').trim() ||
    ROLE_FALLBACK[String(currentUser?.role || '')] ||
    'Usuário';
  // Iniciais do nome e do último sobrenome (ex.: Marcia Tavares de Sousa → MS).
  const userInitials = (() => {
    const words = String(currentUser?.name || '')
      .trim()
      .split(/\s+/)
      .filter((w) => w && !/^(d[aeo]s?|e)$/i.test(w));
    if (!words.length) return 'AD';
    const first = words[0].charAt(0);
    const last = words.length > 1 ? words[words.length - 1].charAt(0) : words[0].charAt(1);
    return (first + last).toUpperCase();
  })();
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
    const interval = setInterval(updateTime, 15000); // relógio em minutos: atualizar a cada segundo só gastava processamento
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

  // Nome igual ao do menu lateral (fonte única em config/moduleNames).
  const getShortTabLabel = (tab: string) => moduleName(tab, 'Módulo');

  const isNotDashboard = activeTab !== 'MAIN_DASHBOARD';

  return (
    <header
      id="app-header"
      className="no-print h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* LADO ESQUERDO: Marca Oficial SucessoEdu + Pílula de Módulo Ativo */}
      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden mr-3">
        {/* Marca SucessoEdu com Ícone de Capelo */}
        <div
          id="header-brand-logo"
          onClick={() => onSelectTab('MAIN_DASHBOARD')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          title="Ir para a Visão Geral do Sistema"
        >
          <img
            src="/favicon.svg"
            alt="SucessoEdu"
            className="h-9 w-9 rounded-xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="text-left leading-tight min-w-0">
            <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>SucessoEdu</span>
              <span className="hidden 2xl:inline text-xs font-semibold text-slate-400 font-normal">| Gestão Educacional</span>
            </div>
            <div className="text-[11px] font-bold text-blue-600 truncate max-w-[160px] xl:max-w-[260px] 2xl:max-w-[320px]">
              {schoolName || 'Colégio Horizonte do Saber & Inovação'}
            </div>
          </div>
        </div>

        {/* Escola em foco: quem vê a rede inteira escolhe com qual escola quer trabalhar */}
        {onChangeSchoolFocus && focusOptions.length > 0 && (
          <label
            className={`hidden md:flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border text-xs font-bold min-w-[150px] max-w-[260px] shrink ${
              focusValue ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title={
              focusValue
                ? 'Escola em foco: todas as telas mostram só esta escola. Escolha "Toda a rede" para ver todas.'
                : 'Escolha uma escola para trabalhar só com ela em todas as telas'
            }
          >
            <School className="h-3.5 w-3.5 shrink-0" />
            <select
              value={focusValue}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) onChangeSchoolFocus(null);
                else onChangeSchoolFocus({ unitId: v.replace(/\|\+$/, ''), withAnnexes: v.endsWith('|+') });
              }}
              className="bg-transparent min-w-0 w-full truncate cursor-pointer focus:outline-hidden"
              aria-label="Escola em foco"
            >
              <option value="">Toda a rede</option>
              {focusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Indicador de Módulo Ativo */}
        {isNotDashboard && (
          <div
            id="header-active-module-badge"
            className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 min-w-0 max-w-[320px] overflow-hidden"
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
            <span className="text-slate-500 font-medium shrink-0">Módulo:</span>
            <span className="text-slate-900 font-bold truncate" title={getShortTabLabel(activeTab)}>
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
            <span className="hidden 2xl:inline">Diagrama & IA</span>
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
            <span className="hidden lg:inline font-mono text-[11px] text-purple-800 font-bold">{currentVersion || 'v5.4.1'}</span>
            <span className="hidden 2xl:inline text-[9px] bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded-md font-sans uppercase">Novidades</span>
          </button>
        )}

        {/* Tira-dúvidas do módulo atual */}
        {onOpenHelp && (
          <button
            id="btn-header-help"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-700 shadow-2xs transition-all cursor-pointer"
            title="Tira-dúvidas: como usar este módulo (F1)"
          >
            <LifeBuoy className="h-3.5 w-3.5 text-sky-600" />
            <span className="hidden 2xl:inline">Tira-dúvidas</span>
          </button>
        )}

        {/* Situação da sincronização com a nuvem (motor v2) */}
        <CloudSyncIndicator isAdmin={currentUser?.role === 'ADMIN'} />

        {/* Botão Atualizar: envia o que estiver pendente e recarrega a tela */}
        <button
          id="btn-header-refresh"
          type="button"
          onClick={async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            try {
              // Nada se perde: as alterações pendentes são enviadas antes de recarregar.
              if (getLocalServerInfo()) await Promise.race([flushLocalChanges(), new Promise((r) => setTimeout(r, 8000))]);
              else await Promise.race([supabaseBatchQueue.flush(), new Promise((r) => setTimeout(r, 8000))]);
            } catch {
              /* recarrega mesmo assim: as pendências continuam guardadas neste computador */
            }
            window.location.reload();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-700 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          title="Atualizar a tela (as alterações pendentes são enviadas antes)"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden 2xl:inline">Atualizar</span>
        </button>

        {/* Botão do Tour Guiado */}
        {onOpenTour && (
          <button
            id="btn-header-guided-tour"
            onClick={onOpenTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-700 shadow-2xs transition-all cursor-pointer group"
            title="Abrir Tour Guiado do Sistema"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="hidden 2xl:inline">Tour Guiado</span>
          </button>
        )}

        {/* Card do Usuário Ativo: nome e cargo do cadastro do usuário */}
        <div className="relative">
          <button
            id="btn-header-user-profile"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs text-left"
            title="Alternar perfil de operador ou ver permissões"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
              {userInitials}
            </div>
            <div className="hidden 2xl:block leading-tight">
              <div className="text-xs font-black text-slate-900 truncate max-w-[140px]">
                {formatPersonName(currentUser?.name) || 'Administrador'}
              </div>
              {/* Cargo/função do cadastro do usuário (Usuários & Permissões > Título / Cargo) */}
              <div
                className="text-[10px] font-bold text-blue-600 tracking-wide leading-none truncate max-w-[160px]"
                title={userJobTitle}
              >
                {userJobTitle}
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
                      <div className="text-[10px] text-slate-400">{u.sectorTitle || u.roleTitle || u.sector}</div>
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
