import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Filter,
  Send,
  ShieldAlert,
  UserX,
  TrendingDown,
  Phone,
  MessageSquare,
  Search,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
  Building2,
  Calendar,
  Layers,
  GraduationCap,
  Clock,
  Check,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  SchoolUnit,
  AttendanceSheet,
  ClassGradeSheet,
  AcademicHistory,
  NotificationItem,
  PredictiveAlert,
  PredictiveAlertType,
} from '../../types';
import {
  computePredictiveAlerts,
  buildCoordinationNotification,
  buildWhatsAppAlertText,
} from '../../utils/predictiveAlertsEngine';

interface PredictiveAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  schoolUnits?: SchoolUnit[];
  attendanceSheets?: AttendanceSheet[];
  classGradeSheets?: ClassGradeSheet[];
  academicHistories?: AcademicHistory[];
  notifications?: NotificationItem[];
  onSaveNotification?: (notification: NotificationItem) => void;
  onBatchSaveNotifications?: (notifications: NotificationItem[]) => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const PredictiveAlertsModal: React.FC<PredictiveAlertsModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  schoolUnits = [],
  attendanceSheets = [],
  classGradeSheets = [],
  academicHistories = [],
  notifications = [],
  onSaveNotification,
  onBatchSaveNotifications,
  onNavigate,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | PredictiveAlertType>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notifiedAlertIds, setNotifiedAlertIds] = useState<Set<string>>(new Set());
  const [batchActionSuccess, setBatchActionSuccess] = useState<string | null>(null);

  // Calcula alertas preditivos em tempo real
  const engineResult = useMemo(() => {
    return computePredictiveAlerts(
      students,
      attendanceSheets,
      classGradeSheets,
      academicHistories,
      classes,
      schoolUnits,
      notifications
    );
  }, [students, attendanceSheets, classGradeSheets, academicHistories, classes, schoolUnits, notifications]);

  // Alertas filtrados
  const filteredAlerts = useMemo(() => {
    return engineResult.alerts.filter((alert) => {
      if (selectedTypeFilter !== 'ALL' && alert.alertType !== selectedTypeFilter) {
        return false;
      }
      if (selectedClassFilter !== 'ALL' && alert.classId !== selectedClassFilter) {
        return false;
      }
      if (selectedSeverityFilter !== 'ALL' && alert.severity !== selectedSeverityFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = alert.studentName.toLowerCase().includes(term);
        const matchesRA = alert.enrollmentNumber.toLowerCase().includes(term);
        const matchesClass = alert.className.toLowerCase().includes(term);
        if (!matchesName && !matchesRA && !matchesClass) return false;
      }
      return true;
    });
  }, [engineResult.alerts, selectedTypeFilter, selectedClassFilter, selectedSeverityFilter, searchTerm]);

  if (!isOpen) return null;

  // Notificar coordenação individualmente
  const handleNotifySingle = (alert: PredictiveAlert) => {
    const notification = buildCoordinationNotification(alert);
    if (onSaveNotification) {
      onSaveNotification(notification);
    }
    setNotifiedAlertIds((prev) => new Set([...prev, alert.id]));
    setBatchActionSuccess(`Coordenação pedagógica notificada com sucesso sobre ${alert.studentName}!`);
    setTimeout(() => setBatchActionSuccess(null), 3500);
  };

  // Notificar todos os alertas pendentes para a coordenação em lote
  const handleNotifyAllPending = () => {
    const unnotified = filteredAlerts.filter(
      (a) => !a.coordinationNotified && !notifiedAlertIds.has(a.id)
    );
    if (unnotified.length === 0) {
      setBatchActionSuccess('Todos os alertas filtrados já foram notificados à coordenação!');
      setTimeout(() => setBatchActionSuccess(null), 3500);
      return;
    }

    const newNotifications = unnotified.map((a) => buildCoordinationNotification(a));
    if (onBatchSaveNotifications) {
      onBatchSaveNotifications(newNotifications);
    } else if (onSaveNotification) {
      newNotifications.forEach((n) => onSaveNotification(n));
    }

    const newSet = new Set(notifiedAlertIds);
    unnotified.forEach((a) => newSet.add(a.id));
    setNotifiedAlertIds(newSet);

    setBatchActionSuccess(
      `Sucesso! ${unnotified.length} notificações automáticas prioritárias foram enviadas para o mural da Coordenação e Direção!`
    );
    setTimeout(() => setBatchActionSuccess(null), 4500);
  };

  const handleOpenWhatsApp = (alert: PredictiveAlert) => {
    const text = buildWhatsAppAlertText(alert);
    const encoded = encodeURIComponent(text);
    const phone = alert.guardianPhone ? alert.guardianPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-linear-to-r from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs border border-white/20">
              <ShieldAlert className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Radar de Alertas Preditivos da Secretaria
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-white/25 text-white tracking-wider border border-white/20">
                  Inteligência Antievasão
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Monitoramento contínuo de 3+ faltas consecutivas e redução de 20%+ no rendimento acadêmico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {batchActionSuccess && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 animate-slide-down">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
              <span>{batchActionSuccess}</span>
            </div>
            <button
              onClick={() => setBatchActionSuccess(null)}
              className="text-white/80 hover:text-white text-xs underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* KPI Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total de Alertas</span>
              <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-800 mt-1">{engineResult.totalAlerts}</div>
            <span className="text-[10px] text-slate-400">Casos identificados pelo motor</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase">3+ Faltas Consecutivas</span>
              <span className="p-1 rounded-md bg-rose-100 text-rose-700">
                <UserX className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl font-extrabold text-rose-700 mt-1">{engineResult.consecutiveAbsencesCount}</div>
            <span className="text-[10px] text-rose-600">Risco imediato de abandono</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 uppercase">Queda ≥ 20% Rendimento</span>
              <span className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                <TrendingDown className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl font-extrabold text-indigo-700 mt-1">{engineResult.performanceDropCount}</div>
            <span className="text-[10px] text-indigo-600">Necessidade de reforço docente</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700 uppercase">Risco Duplo Crítico</span>
              <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                <ShieldAlert className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl font-extrabold text-purple-800 mt-1">{engineResult.dualRiskCount}</div>
            <span className="text-[10px] text-purple-600">Falta + Queda simultâneas</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-48 sm:w-60">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por estudante ou RA..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Type selector */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Todos os Tipos de Risco</option>
              <option value="CONSECUTIVE_ABSENCES">Apenas 3+ Faltas Consecutivas</option>
              <option value="PERFORMANCE_DROP">Apenas Queda de Desempenho (≥20%)</option>
              <option value="DUAL_RISK">Apenas Risco Duplo (Faltas + Notas)</option>
            </select>

            {/* Class selector */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-700 max-w-[170px] truncate"
            >
              <option value="ALL">Todas as Turmas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Severity selector */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Todas as Gravidades</option>
              <option value="CRITICAL">Gravidade Crítica</option>
              <option value="HIGH">Gravidade Alta</option>
              <option value="MEDIUM">Gravidade Média</option>
            </select>
          </div>

          {/* Action: Notify All */}
          <button
            onClick={handleNotifyAllPending}
            className="px-3.5 py-1.5 rounded-lg bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            title="Enviar todas as notificações filtradas para a Coordenação Pedagógica"
          >
            <Bell className="h-3.5 w-3.5 text-amber-200" />
            <span>Notificar Coordenação em Lote</span>
          </button>
        </div>

        {/* Content: Alert List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum Alerta Crítico Encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram identificados alunos com 3 faltas consecutivas ou oscilação negativa de 20% no período e filtros selecionados.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isAlreadyNotified =
                alert.coordinationNotified || notifiedAlertIds.has(alert.id);

              const badgeColor =
                alert.alertType === 'DUAL_RISK'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : alert.alertType === 'CONSECUTIVE_ABSENCES'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200';

              const severityColor =
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-500 text-white';

              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{alert.studentName}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        RA: {alert.enrollmentNumber}
                      </span>
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {alert.className}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {alert.alertType === 'DUAL_RISK'
                          ? '🚨 Risco Duplo (Faltas + Rendimento)'
                          : alert.alertType === 'CONSECUTIVE_ABSENCES'
                          ? '⚠️ 3+ Faltas Consecutivas'
                          : '📉 Queda de Desempenho (≥20%)'}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${severityColor}`}>
                        {alert.severity}
                      </span>
                      {isAlreadyNotified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Coordenação Notificada
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Pendente de Notificação
                        </span>
                      )}
                    </div>

                    {/* Trigger details & dates */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {alert.consecutiveAbsencesCount > 0 && (
                        <div className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          <Clock className="h-3 w-3" />
                          <span>
                            {alert.consecutiveAbsencesCount} faltas consecutivas ({alert.absenceDates.slice(0, 3).join(', ')}
                            {alert.absenceDates.length > 3 ? '...' : ''})
                          </span>
                        </div>
                      )}

                      {alert.performanceDropPercent > 0 && (
                        <div className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          <TrendingDown className="h-3 w-3" />
                          <span>
                            Redução de {alert.performanceDropPercent.toFixed(1)}% em {alert.subjectAffected || 'disciplinas'} (
                            {alert.previousAverage.toFixed(1)} → {alert.currentAverage.toFixed(1)})
                          </span>
                        </div>
                      )}

                      {alert.guardianPhone && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>Resp: {alert.guardianName || 'Responsável'} ({alert.guardianPhone})</span>
                        </div>
                      )}
                    </div>

                    {/* Pedagogical recommendation */}
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Recomendação do Sistema:</strong> {alert.recommendedAction}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleNotifySingle(alert)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isAlreadyNotified
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                      title="Notificar Coordenação Pedagógica imediatamente"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>{isAlreadyNotified ? 'Reenviar Notificação' : 'Notificar Coordenação'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenWhatsApp(alert)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Abrir WhatsApp com mensagem padrão para os responsáveis"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    {onNavigate && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigate('PEDAGOGICAL_DASHBOARD', { section: 'EVOLUTION', studentId: alert.studentId });
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Ver evolução de notas no Painel Pedagógico"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>
              Algoritmo de alerta em conformidade com as diretrizes de frequência escolar LDB (75%) e busca ativa municipal.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
