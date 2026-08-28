import React, { useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Award,
  UserCheck,
  MessageSquare,
  ExternalLink,
  Settings,
  CheckCheck,
} from 'lucide-react';
import { NotificationItem, NotificationType, UserRole } from '../../types';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentRole: UserRole;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onOpenFullCenter: () => void;
  onNavigateTab: (tabId: string, payload?: any) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  currentRole,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenFullCenter,
  onNavigateTab,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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

  if (!isOpen) return null;

  // Filter for active role
  const roleNotifications = notifications.filter(
    (n) => n.targetRoles.includes(currentRole) || n.targetRoles.length === 0
  );
  const unreadNotifications = roleNotifications.filter((n) => !n.read);
  const displayItems = roleNotifications.slice(0, 5);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ENROLLMENT_STATUS':
        return <UserCheck className="h-3.5 w-3.5 text-emerald-600" />;
      case 'EXAM_AVAILABLE':
        return <BookOpen className="h-3.5 w-3.5 text-indigo-600" />;
      case 'DEADLINE_ALERT':
        return <Clock className="h-3.5 w-3.5 text-rose-600" />;
      case 'EXAM_RESULT':
        return <Award className="h-3.5 w-3.5 text-purple-600" />;
      case 'IMPORTANT_ANNOUNCEMENT':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      case 'DIRECT_MESSAGE':
        return <MessageSquare className="h-3.5 w-3.5 text-blue-600" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800">Notificações</span>
          {unreadNotifications.length > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Ler todas</span>
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {displayItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-1">
            <Bell className="h-6 w-6 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">Tudo tranquilo por aqui!</p>
            <p className="text-[11px]">Nenhuma nova notificação pendente.</p>
          </div>
        ) : (
          displayItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 transition-colors hover:bg-slate-50 ${
                item.read ? 'bg-white' : 'bg-indigo-50/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h5
                      className={`text-xs font-bold truncate ${
                        item.read ? 'text-slate-700' : 'text-indigo-950 font-bold'
                      }`}
                    >
                      {item.title}
                    </h5>
                    {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {item.actionTab && (
                      <button
                        onClick={() => {
                          onMarkAsRead(item.id);
                          onNavigateTab(item.actionTab!, item.actionPayload);
                          onClose();
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{item.actionLabel || 'Ver'}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={() => {
            onClose();
            onOpenFullCenter();
          }}
          className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1 cursor-pointer transition-colors"
        >
          Ver Todas as Notificações e Configurações &rarr;
        </button>
      </div>
    </div>
  );
};
