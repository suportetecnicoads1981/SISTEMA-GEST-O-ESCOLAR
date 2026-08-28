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
} from 'lucide-react';
import { NotificationItem, UserRole } from '../../types';
import { NotificationPopover } from '../notificacoes/NotificationPopover';

interface HeaderProps {
  schoolName: string;
  activeTab: string;
  onSelectTab: (tab: string, payload?: any) => void;
  notifications?: NotificationItem[];
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onOpenNotificationModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolName,
  activeTab,
  onSelectTab,
  notifications = [],
  currentRole = 'ADMIN',
  onChangeRole,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onOpenNotificationModal,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [serverPingOk, setServerPingOk] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
  const unreadRoleNotifications = notifications.filter(
    (n) => !n.read && (n.targetRoles.includes(currentRole) || n.targetRoles.length === 0)
  );

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'STUDENTS':
        return 'Secretaria Acadêmica & Gestão de Matrículas';
      case 'CLASSES':
        return 'Turmas, Matrizes Curriculares & Disciplinas';
      case 'DOCUMENTS':
        return 'Emissão Oficial de Certificados & Documentos';
      case 'COMMUNICATION':
        return 'Módulo de Comunicação & Mural de Avisos';
      case 'NOTIFICATIONS':
        return 'Central de Notificações & Regras de Alerta';
      case 'QUESTION_BANK':
        return 'Banco de Questões & Mapeamento BNCC';
      case 'EXAMS':
        return 'Central de Provas & Regras de Correção';
      case 'STUDENT_ROOM':
        return 'Ambiente de Avaliação Online (Estudante)';
      case 'PEDAGOGICAL_DASHBOARD':
        return 'Painel de Gestão Integrada & Relatórios Bento';
      case 'NETWORK_INSTALLER':
        return 'Configuração Cliente/Servidor & Topologia de Rede';
      case 'ABOUT':
        return 'Especificações do Sistema & Engenharia';
      default:
        return 'Painel de Gestão Integrada';
    }
  };

  const getRoleBadge = (role: UserRole | string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', code: 'AD', color: 'bg-indigo-600 text-white' };
      case 'TEACHER':
        return { label: 'Professor', code: 'PR', color: 'bg-emerald-600 text-white' };
      case 'STUDENT':
        return { label: 'Aluno', code: 'AL', color: 'bg-blue-600 text-white' };
      case 'PARENT':
        return { label: 'Responsável', code: 'PA', color: 'bg-purple-600 text-white' };
      default:
        return { label: 'Admin', code: 'AD', color: 'bg-indigo-600 text-white' };
    }
  };

  const roleInfo = getRoleBadge(currentRole);

  return (
    <header
      id="app-header"
      className="no-print h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Left Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate flex items-center gap-2">
            {getTabTitle(activeTab)}
          </h1>
          <p className="text-xs text-slate-500 truncate hidden md:flex items-center gap-1.5">
            <School className="h-3.5 w-3.5 text-slate-400" />
            <span>{schoolName || 'Colégio Horizonte do Saber & Inovação'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 font-mono text-[11px]">{currentDateTime}</span>
          </p>
        </div>
      </div>

      {/* Right Bento Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick role switcher dropdown */}
        {onChangeRole && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
            {(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => onChangeRole(r)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  currentRole === r
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === 'ADMIN' && '🏛️ Admin'}
                {r === 'TEACHER' && '👨‍🏫 Prof'}
                {r === 'STUDENT' && '👨‍🎓 Aluno'}
                {r === 'PARENT' && '👨‍👩‍👧 Pai'}
              </button>
            ))}
          </div>
        )}

        {/* Quick Communication button */}
        <button
          id="btn-header-communication"
          onClick={() => onSelectTab('COMMUNICATION')}
          className="bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Comunicados</span>
        </button>

        {/* Notification Bell with Popover */}
        <div className="relative">
          <button
            id="btn-header-notifications"
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            title="Abrir Notificações"
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 cursor-pointer flex items-center justify-center relative"
          >
            <Bell className="h-4 w-4" />
            {unreadRoleNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadRoleNotifications.length}
              </span>
            )}
          </button>

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
        </div>

        {/* Network / Server Indicator Pill */}
        <button
          id="btn-header-network-status"
          onClick={() => onSelectTab('NETWORK_INSTALLER')}
          title="Configuração Cliente/Servidor & Topologia de Rede"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            serverPingOk
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          {serverPingOk ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-amber-600" />
          )}
          <span className="hidden lg:inline">LAN Ativo</span>
        </button>

        {/* User Profile Avatar in Bento style */}
        <div
          id="header-user-avatar"
          className={`w-8 h-8 rounded-full ${roleInfo.color} flex items-center justify-center text-xs font-bold tracking-tight shrink-0 shadow-xs cursor-pointer`}
          title={`Perfil ativo: ${roleInfo.label}`}
          onClick={() => onSelectTab('NOTIFICATIONS')}
        >
          {roleInfo.code}
        </div>
      </div>
    </header>
  );
};
