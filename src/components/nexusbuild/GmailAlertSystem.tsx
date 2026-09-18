import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Inbox,
  Terminal
} from 'lucide-react';
import { DeveloperNotification } from '../../types/nexusbuild';
import { DEVELOPER_EMAIL } from '../../utils/nexusBuildGenerator';

interface GmailAlertSystemProps {
  notifications: DeveloperNotification[];
  onSendTestNotification: (type: DeveloperNotification['type']) => void;
  isLoading?: boolean;
}

export const GmailAlertSystem: React.FC<GmailAlertSystemProps> = ({
  notifications,
  onSendTestNotification,
  isLoading = false,
}) => {
  const [selectedType, setSelectedType] = useState<DeveloperNotification['type']>('INSTALLATION_STATUS');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Communication Bridge & Gmail Alert System
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                {DEVELOPER_EMAIL}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Despacho centralizado de status de instalação, falhas críticas de auditoria e alertas de backup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DeveloperNotification['type'])}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="INSTALLATION_STATUS">Status de Instalação</option>
            <option value="AUDIT_CRITICAL">Falha Crítica SAST</option>
            <option value="BACKUP_INTEGRITY">Alerta de Backup 03:00</option>
            <option value="SELF_HEALING_ALERT">Auto-Cura PostgreSQL</option>
          </select>
          <button
            onClick={() => onSendTestNotification(selectedType)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className={`h-3.5 w-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>Disparar Alerta</span>
          </button>
        </div>
      </div>

      {/* Histórico de Notificações Enviadas */}
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Inbox className="h-4 w-4 text-cyan-400" />
            Fila de Notificações e Transmissões SMTP
          </span>
          <span className="text-2xs font-mono text-slate-500">
            Total de {notifications.length} despachos registrados
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
            Nenhuma notificação na fila. Dispare um alerta de teste acima.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-2xs font-mono font-bold ${
                        notif.type === 'AUDIT_CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          : notif.type === 'INSTALLATION_STATUS'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                          : notif.type === 'SELF_HEALING_ALERT'
                          ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/40'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      }`}
                    >
                      {notif.type}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {notif.subject}
                    </span>
                  </div>
                  <div className="text-2xs text-slate-400 font-mono truncate max-w-xl">
                    {notif.contentPreview}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono flex items-center gap-2">
                    <span>Destino: {notif.recipient}</span>
                    <span>•</span>
                    <span>{new Date(notif.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="px-2 py-0.5 rounded text-2xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {notif.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
