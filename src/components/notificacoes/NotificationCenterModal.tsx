import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Settings,
  Trash2,
  CheckCheck,
  ExternalLink,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Shield,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  Award,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';
import {
  NotificationItem,
  NotificationType,
  RoleNotificationPreferences,
  UserRole,
} from '../../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  preferences: Record<UserRole, RoleNotificationPreferences>;
  onSavePreferences: (role: UserRole, prefs: RoleNotificationPreferences) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onNavigateTab: (tabId: string, payload?: any) => void;
  onTriggerTestPush: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentRole,
  onChangeRole,
  preferences,
  onSavePreferences,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNavigateTab,
  onTriggerTestPush,
}) => {
  const [activeView, setActiveView] = useState<'LIST' | 'SETTINGS'>('LIST');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [onlyUnread, setOnlyUnread] = useState<boolean>(false);

  // Copy of preferences for the current role
  const rolePrefs = preferences[currentRole] || preferences.ADMIN;
  const [localPrefs, setLocalPrefs] = useState<RoleNotificationPreferences>(rolePrefs);

  if (!isOpen) return null;

  // Filter notifications for current role
  const roleNotifications = notifications.filter(
    (n) => n.targetRoles.includes(currentRole) || n.targetRoles.length === 0
  );

  const filteredNotifications = roleNotifications.filter((n) => {
    const matchesType = filterType === 'ALL' || n.type === filterType;
    const matchesUnread = !onlyUnread || !n.read;
    return matchesType && matchesUnread;
  });

  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'ENROLLMENT_STATUS':
        return {
          label: 'Matrícula',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: UserCheck,
        };
      case 'EXAM_AVAILABLE':
        return {
          label: 'Nova Avaliação',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: BookOpen,
        };
      case 'DEADLINE_ALERT':
        return {
          label: 'Prazo Limite',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Clock,
        };
      case 'EXAM_RESULT':
        return {
          label: 'Resultado de Prova',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Award,
        };
      case 'IMPORTANT_ANNOUNCEMENT':
        return {
          label: 'Comunicado Oficial',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
        };
      case 'DIRECT_MESSAGE':
        return {
          label: 'Mensagem Direta',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: MessageSquare,
        };
      default:
        return {
          label: 'Notificação',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Bell,
        };
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'Administrador / Secretaria';
      case 'TEACHER':
        return 'Professor / Docente';
      case 'STUDENT':
        return 'Aluno (Maria Clara)';
      case 'PARENT':
        return 'Pai / Responsável';
    }
  };

  const handleSavePrefChanges = () => {
    onSavePreferences(currentRole, localPrefs);
    setActiveView('LIST');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Central de Notificações do Sistema
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Alertas acadêmicos, avisos de matrículas, prazos e comunicados institucionais
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Selector Simulator Bar */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <Shield className="h-3.5 w-3.5 text-indigo-600" />
            <span>Perfil Ativo:</span>
            <div className="flex items-center gap-1">
              {(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onChangeRole(role);
                    setLocalPrefs(preferences[role] || preferences.ADMIN);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentRole === role
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {role === 'ADMIN' && '🏛️ Admin'}
                  {role === 'TEACHER' && '👨‍🏫 Professor'}
                  {role === 'STUDENT' && '👨‍🎓 Aluno'}
                  {role === 'PARENT' && '👨‍👩‍👧 Pai'}
                </button>
              ))}
            </div>
          </div>

          {/* View toggle (List vs Settings) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveView('LIST')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                activeView === 'LIST'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Notificações
            </button>
            <button
              onClick={() => {
                setLocalPrefs(preferences[currentRole] || preferences.ADMIN);
                setActiveView('SETTINGS');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeView === 'SETTINGS'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="h-3 w-3" />
              <span>Configurações</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeView === 'LIST' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Action & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({roleNotifications.length})
                </button>
                <button
                  onClick={() => setFilterType('ENROLLMENT_STATUS')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterType === 'ENROLLMENT_STATUS'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Matrículas
                </button>
                <button
                  onClick={() => setFilterType('EXAM_AVAILABLE')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterType === 'EXAM_AVAILABLE'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Avaliações
                </button>
                <button
                  onClick={() => setFilterType('DEADLINE_ALERT')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterType === 'DEADLINE_ALERT'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Prazos
                </button>
                <button
                  onClick={() => setFilterType('EXAM_RESULT')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterType === 'EXAM_RESULT'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Resultados
                </button>
                <button
                  onClick={() => setFilterType('IMPORTANT_ANNOUNCEMENT')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterType === 'IMPORTANT_ANNOUNCEMENT'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Comunicados
                </button>
              </div>

              {/* Bulk actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Marcar todas como lidas</span>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-2.5">
              {filteredNotifications.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Bell className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">Nenhuma notificação encontrada</p>
                  <p className="text-xs text-slate-400">
                    Você está em dia com todas as atualizações para o perfil de {getRoleLabel(currentRole)}.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const badge = getTypeBadge(notif.type);
                  const Icon = badge.icon;
                  const formattedDate = new Date(notif.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        notif.read
                          ? 'bg-white border-slate-200'
                          : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Type Icon */}
                          <div
                            className={`p-2 rounded-lg shrink-0 border ${badge.bg}`}
                            title={badge.label}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badge.bg}`}
                              >
                                {badge.label}
                              </span>

                              {notif.priority === 'URGENT' && (
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  Urgente
                                </span>
                              )}

                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              )}

                              <span className="text-[11px] text-slate-400 font-mono">
                                {formattedDate}
                              </span>
                            </div>

                            <h4
                              className={`text-xs sm:text-sm font-bold ${
                                notif.read ? 'text-slate-800' : 'text-indigo-950'
                              }`}
                            >
                              {notif.title}
                            </h4>

                            <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                            {/* Direct Action Link */}
                            {notif.actionTab && (
                              <div className="pt-1.5 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    onMarkAsRead(notif.id);
                                    onNavigateTab(notif.actionTab!, notif.actionPayload);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs shadow-indigo-200"
                                >
                                  <span>{notif.actionLabel || 'Acessar'}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dismiss / Mark Read buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.read && (
                            <button
                              onClick={() => onMarkAsRead(notif.id)}
                              title="Marcar como lida"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNotification(notif.id)}
                            title="Excluir notificação"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* SETTINGS VIEW: Preferences by User Role */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-indigo-950">
                  Preferências de Alerta para o Perfil: {getRoleLabel(currentRole)}
                </p>
                <p className="text-indigo-800">
                  Personalize quais canais de comunicação e tipos de eventos devem acionar alertas para este grupo de usuários.
                </p>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Canais de Notificação Ativos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">No Sistema (In-App)</p>
                      <p className="text-[10px] text-slate-500">Sino e popover no cabeçalho</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPrefs.channels.inApp}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Push no Navegador</p>
                      <p className="text-[10px] text-slate-500">Alertas nativos do desktop/celular</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPrefs.channels.browserPush}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, browserPush: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">E-mail Institucional</p>
                      <p className="text-[10px] text-slate-500">Boletim e avisos de prazos</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPrefs.channels.email}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">SMS / WhatsApp</p>
                      <p className="text-[10px] text-slate-500">Alertas urgentes e comunicados</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPrefs.channels.smsWhatsapp}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, smsWhatsapp: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Event Category Triggers */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Eventos e Categorias Monitoradas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <span className="font-semibold text-slate-700">
                    Matrículas (Aprovadas, Recusadas, Pendências)
                  </span>
                  <input
                    type="checkbox"
                    checked={localPrefs.categories.enrollmentStatus}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, enrollmentStatus: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <span className="font-semibold text-slate-700">
                    Novas Avaliações & Simulados Disponíveis
                  </span>
                  <input
                    type="checkbox"
                    checked={localPrefs.categories.examAvailable}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, examAvailable: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <span className="font-semibold text-slate-700">
                    Prazos de Entrega & Fechamento de Notas
                  </span>
                  <input
                    type="checkbox"
                    checked={localPrefs.categories.deadlines}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, deadlines: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <span className="font-semibold text-slate-700">
                    Resultados de Provas & Correção Automática
                  </span>
                  <input
                    type="checkbox"
                    checked={localPrefs.categories.examResults}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, examResults: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <span className="font-semibold text-slate-700">
                    Comunicados Importantes & Reuniões de Pais
                  </span>
                  <input
                    type="checkbox"
                    checked={localPrefs.categories.announcements}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, announcements: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <span className="font-semibold text-slate-700">
                    Mensagens Diretas de Professores / Secretaria
                  </span>
                  <input
                    type="checkbox"
                    checked={localPrefs.categories.directMessages}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, directMessages: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Sound & Push Trigger Test */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPrefs.soundEnabled}
                    onChange={(e) =>
                      setLocalPrefs((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                    }
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span>Sons de Alerta ao Receber Notificação</span>
                </label>
              </div>

              <button
                onClick={onTriggerTestPush}
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Testar Notificação Push</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sincronização em tempo real com o servidor LAN
          </span>

          <div className="flex items-center gap-2">
            {activeView === 'SETTINGS' ? (
              <>
                <button
                  onClick={() => setActiveView('LIST')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePrefChanges}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                >
                  Salvar Preferências
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
