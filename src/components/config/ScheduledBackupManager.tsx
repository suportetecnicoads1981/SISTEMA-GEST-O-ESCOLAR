import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  MessageSquare,
  Shield,
  Download,
  ExternalLink,
  Play,
  Calendar,
  Settings,
  Layers,
  ArrowRight,
  Database,
  Sparkles,
  Lock,
  History,
} from 'lucide-react';
import {
  BackupSchedulerConfig,
  ScheduledBackupHistoryItem,
  BackupScheduleFrequency,
  getBackupSchedulerConfig,
  saveBackupSchedulerConfig,
  executeScheduledBackupNow,
  calculateNextScheduledRun,
} from '../../services/backupSchedulerService';
import {
  TARGET_GOOGLE_DRIVE_ACCOUNT,
  OFFICIAL_DRIVE_UPDATES_FOLDER_NAME,
  getSafeDriveFolderUrl,
} from '../../services/googleDriveService';

interface ScheduledBackupManagerProps {
  onNavigate?: (tab: string, payload?: any) => void;
}

export const ScheduledBackupManager: React.FC<ScheduledBackupManagerProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<BackupSchedulerConfig>(getBackupSchedulerConfig());
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastExecutedItem, setLastExecutedItem] = useState<ScheduledBackupHistoryItem | null>(null);

  const loadConfig = useCallback(() => {
    setConfig(getBackupSchedulerConfig());
  }, []);

  useEffect(() => {
    loadConfig();

    const handleBackupCompleted = () => {
      loadConfig();
    };

    window.addEventListener('sucessoedu-backup-completed', handleBackupCompleted);
    return () => {
      window.removeEventListener('sucessoedu-backup-completed', handleBackupCompleted);
    };
  }, [loadConfig]);

  const handleToggleEnabled = () => {
    const updated: BackupSchedulerConfig = {
      ...config,
      enabled: !config.enabled,
      nextScheduledRunAt: !config.enabled
        ? calculateNextScheduledRun(config.frequency, config.scheduledTime)
        : undefined,
    };
    saveBackupSchedulerConfig(updated);
    setConfig(updated);
  };

  const handleFrequencyChange = (freq: BackupScheduleFrequency) => {
    const nextRun = calculateNextScheduledRun(freq, config.scheduledTime);
    const updated: BackupSchedulerConfig = {
      ...config,
      frequency: freq,
      nextScheduledRunAt: nextRun,
    };
    saveBackupSchedulerConfig(updated);
    setConfig(updated);
  };

  const handleTimeChange = (time: string) => {
    const nextRun = calculateNextScheduledRun(config.frequency, time);
    const updated: BackupSchedulerConfig = {
      ...config,
      scheduledTime: time,
      nextScheduledRunAt: nextRun,
    };
    saveBackupSchedulerConfig(updated);
    setConfig(updated);
  };

  const handleExecuteNow = async () => {
    setIsExecuting(true);
    setSuccessMessage(null);
    try {
      const result = await executeScheduledBackupNow('Disparo Manual pelo Painel de Agendamento');
      setLastExecutedItem(result);
      loadConfig();
      setSuccessMessage(
        `Backup automático concluído com sucesso! Notificação enviada para a caixa de mensagens interna do Administrador.`
      );
      setTimeout(() => setSuccessMessage(null), 9000);
    } catch (err: any) {
      console.error('Falha ao executar backup agendado:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Agendamento de Backup Automático & Notificações
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Nuvem Ativa
              </span>
            </div>
            <p className="text-sm text-slate-550">
              Rotina automatizada de cópias de segurança para o Google Drive com notificação interna imediata aos administradores.
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecuteNow}
            disabled={isExecuting}
            className={`px-4 py-2.5 rounded-xl font-semibold text-white shadow-sm flex items-center gap-2 transition-all ${
              isExecuting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-indigo-200'
            }`}
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executando Backup & Notificando...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Executar Backup Agora & Notificar Admin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{successMessage}</p>
            {lastExecutedItem && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-emerald-800">
                <span>• Arquivo: <strong className="font-mono">{lastExecutedItem.fileName}</strong></span>
                <span>• Hash: <strong className="font-mono">{lastExecutedItem.checksum}</strong></span>
                <span>• Tamanho: <strong>{formatFileSize(lastExecutedItem.fileSizeBytes)}</strong></span>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('COMMUNICATION')}
                    className="underline font-semibold hover:text-emerald-950 flex items-center gap-1"
                  >
                    Ver mensagem interna no Módulo de Comunicação
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Toggle Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Estado do Agendador</span>
            </div>
            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                config.enabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500">
              {config.enabled
                ? 'Agendador ativado. Os backups serão gerados e enviados conforme o intervalo configurado.'
                : 'Agendador pausado. Disparos automáticos suspensos até reativação manual.'}
            </p>
            <div className="mt-2 text-xs font-medium text-slate-700">
              Status: <span className={config.enabled ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                {config.enabled ? '● Ativo e Monitorando' : '○ Pausado'}
              </span>
            </div>
          </div>
        </div>

        {/* Frequency Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Frequência do Backup</span>
          </div>
          <select
            value={config.frequency}
            onChange={(e) => handleFrequencyChange(e.target.value as BackupScheduleFrequency)}
            className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="24_HOURS_DAILY">Diário (Uma vez ao dia no horário fixo)</option>
            <option value="6_HOURS">A cada 6 horas</option>
            <option value="12_HOURS">A cada 12 horas</option>
            <option value="WEEKLY">Semanal (A cada 7 dias)</option>
            <option value="1_HOUR">A cada 1 hora (Alta rotatividade)</option>
            <option value="1_MIN_TEST">Modo Teste Rápido (A cada 1 minuto)</option>
          </select>
          {config.frequency === '24_HOURS_DAILY' && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <span>Horário da Execução:</span>
              <input
                type="time"
                value={config.scheduledTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Target Cloud & Notification Info Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <span>Destino Oficial Google Drive</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>Conta: <strong className="text-slate-800">{TARGET_GOOGLE_DRIVE_ACCOUNT}</strong></div>
            <div>Pasta: <strong className="text-slate-800">"{OFFICIAL_DRIVE_UPDATES_FOLDER_NAME}"</strong></div>
            <div className="flex items-center gap-1 text-indigo-700 font-medium pt-1">
              <Bell className="w-3.5 h-3.5" />
              <span>Notifica Administradores via Mensagens Internas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Execution Timestamps */}
      <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-500">Última Execução Concluída:</span>
            <div className="font-semibold text-slate-800">
              {config.lastRunAt ? new Date(config.lastRunAt).toLocaleString('pt-BR') : 'Ainda não executado'}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Próximo Backup Programado:</span>
            <div className="font-semibold text-indigo-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {config.nextScheduledRunAt
                ? new Date(config.nextScheduledRunAt).toLocaleString('pt-BR')
                : 'Não agendado'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('COMMUNICATION')}
              className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Abrir Caixa de Mensagens do Admin
            </button>
          )}
          <a
            href={getSafeDriveFolderUrl(null, OFFICIAL_DRIVE_UPDATES_FOLDER_NAME)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Pasta no Google Drive
          </a>
        </div>
      </div>

      {/* Backup History Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Histórico de Backups Automáticos Concluídos
          </h3>
          <span className="text-xs text-slate-500">
            Total registrado: {config.history.length} cópias
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Arquivo / Checksum</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Alunos / Dados</th>
                <th className="px-4 py-3">Notificação Admin</th>
                <th className="px-4 py-3 text-right">Ação Nuvem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {config.history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum backup agendado registrado ainda. Clique em "Executar Backup Agora" para iniciar o primeiro.
                  </td>
                </tr>
              ) : (
                config.history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{item.fileName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{item.checksum}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {formatFileSize(item.fileSizeBytes)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        {item.stats.studentsCount} Alunos • {item.stats.classesCount} Turmas
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Mensagem Enviada
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <a
                        href={item.googleDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <span>Abrir no Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
