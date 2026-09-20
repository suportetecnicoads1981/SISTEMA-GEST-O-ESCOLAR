import React, { useState } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  BookOpen,
  HelpCircle,
  HardDrive,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
  Bell,
  RefreshCw,
  FolderSync,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Award,
  ChevronRight,
  Check,
  XCircle,
  Cpu,
  Key,
  MessageSquare,
  Smartphone,
  LogOut,
  Sliders,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Exam,
  ExamSubmission,
  SchoolSettings,
  SchoolUnit,
  SyncAuditLog,
  UserAccount,
  NotificationItem,
} from '../../types';
import { CadastralPendingCensusDashbox } from './CadastralPendingCensusDashbox';
import { SystemUpdateStatusDashbox } from './SystemUpdateStatusDashbox';

interface MainOverviewDashboardProps {
  students: Student[];
  classes: SchoolClass[];
  exams: Exam[];
  submissions: ExamSubmission[];
  settings: SchoolSettings;
  schoolUnits: SchoolUnit[];
  syncLogs: SyncAuditLog[];
  userAccounts: UserAccount[];
  currentUser: UserAccount;
  notifications: NotificationItem[];
  onNavigate: (tab: string) => void;
  onLogout?: () => void;
  onOpenNewStudentModal?: () => void;
  onOpenNewExamModal?: () => void;
  onOpenImportModal?: () => void;
  onEditStudent?: (student: Student) => void;
}

export const MainOverviewDashboard: React.FC<MainOverviewDashboardProps> = ({
  students,
  classes,
  exams,
  submissions,
  settings,
  schoolUnits,
  syncLogs,
  userAccounts,
  currentUser,
  notifications,
  onNavigate,
  onLogout,
  onOpenNewStudentModal,
  onOpenNewExamModal,
  onOpenImportModal,
  onEditStudent,
}) => {
  const [activeAlertFilter, setActiveAlertFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  // Calculations for Students by Status
  const activeStudents = students.filter((s) => s.status === 'ACTIVE');
  const transferredStudents = students.filter((s) => s.status === 'TRANSFERRED');
  const concludedStudents = students.filter((s) => s.status === 'CONCLUDED');
  const suspendedStudents = students.filter((s) => s.status === 'SUSPENDED');
  const unassignedClassStudents = students.filter((s) => !s.classId || s.classId === '');

  // School Units Metrics
  const totalUnits = schoolUnits.length;
  const synchronizedUnits = schoolUnits.filter((u) => u.syncStatus === 'SINCRONIZADO').length;
  const pendingSyncUnits = schoolUnits.filter((u) => u.syncStatus === 'PENDENTE' || u.syncStatus === 'NUNCA_SINCRONIZADO').length;
  const offlineUnits = schoolUnits.filter((u) => !u.hasInternet).length;

  // Real-time Anomaly Detection & Actionable Alerts Engine
  const detectedAnomalies: {
    id: string;
    level: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    description: string;
    actionTab: string;
    actionLabel: string;
    metricBadge?: string;
  }[] = [];

  // Check students with incomplete records from remote poles / censo
  const incompleteCensusStudents = students.filter(
    (s) =>
      s.cadastralStatus === 'INCOMPLETE' ||
      s.cadastralStatus === 'PENDING_DOCS' ||
      (s.pendingFields && s.pendingFields.length > 0)
  );
  if (incompleteCensusStudents.length > 0) {
    detectedAnomalies.push({
      id: 'anom-incomplete-census-cadastral',
      level: 'WARNING',
      title: `${incompleteCensusStudents.length} Cadastro(s) com Pendência nos Polos Remotos & Censo`,
      description: 'Alunos matriculados via planilhas de polos remotos (ex: Maria da Praia) aguardando laudo PCD, CPF ou dados civis.',
      actionTab: 'STUDENTS',
      actionLabel: 'Ver Pendências na Secretaria',
      metricBadge: `${incompleteCensusStudents.length} pendentes`,
    });
  }

  // 1. Check students without assigned class
  if (unassignedClassStudents.length > 0) {
    detectedAnomalies.push({
      id: 'anom-unassigned-students',
      level: 'CRITICAL',
      title: `${unassignedClassStudents.length} Aluno(s) sem Turma Atribuída`,
      description: 'Estudantes matriculados que ainda não foram enturmados para o ano letivo corrente.',
      actionTab: 'STUDENTS',
      actionLabel: 'Alocar em Turmas',
      metricBadge: `${unassignedClassStudents.length} pendentes`,
    });
  }

  // 2. Check offline / pending sync units
  if (pendingSyncUnits > 0) {
    detectedAnomalies.push({
      id: 'anom-pending-sync-units',
      level: 'CRITICAL',
      title: `${pendingSyncUnits} Polo(s) Escolar(es) com Sincronização Atrasada`,
      description: 'Unidades satélites operando offline que estão há mais de 7 dias sem importação de pacote .edusync.',
      actionTab: 'MUNICIPAL_SYNC',
      actionLabel: 'Sincronizar Polos',
      metricBadge: `${pendingSyncUnits} polos pendentes`,
    });
  }

  // 3. Check exams without questions
  const examsWithoutQuestions = exams.filter((e) => !e.questions || e.questions.length === 0);
  if (examsWithoutQuestions.length > 0) {
    detectedAnomalies.push({
      id: 'anom-empty-exams',
      level: 'CRITICAL',
      title: `${examsWithoutQuestions.length} Avaliação(ões) sem Questões Cadastradas`,
      description: 'Provas foram criadas mas ainda não possuem itens BNCC associados para os alunos realizarem.',
      actionTab: 'EXAMS',
      actionLabel: 'Configurar Provas',
      metricBadge: `${examsWithoutQuestions.length} provas`,
    });
  }

  // 4. Check low performing submissions
  const criticalSubmissions = submissions.filter((s) => s.status === 'REPROVADO' || (s.totalScore !== undefined && s.totalScore < 6.0));
  if (criticalSubmissions.length > 0) {
    detectedAnomalies.push({
      id: 'anom-critical-grades',
      level: 'WARNING',
      title: `${criticalSubmissions.length} Estudante(s) em Alerta de Recuperação Pedagógica`,
      description: 'Notas obtidas em avaliações abaixo da média mínima institucional (6.0) demandando intervenção.',
      actionTab: 'PEDAGOGICAL_DASHBOARD',
      actionLabel: 'Ver Diagnóstico Pedagógico',
      metricBadge: `${criticalSubmissions.length} abaixo da média`,
    });
  }

  // 5. Check classes near max capacity
  const fullClasses = classes.filter((c) => {
    const classCount = students.filter((s) => s.classId === c.id && s.status === 'ACTIVE').length;
    return classCount >= c.maxCapacity;
  });
  if (fullClasses.length > 0) {
    detectedAnomalies.push({
      id: 'anom-full-classes',
      level: 'WARNING',
      title: `${fullClasses.length} Turma(s) com Lotação Máxima Atingida`,
      description: 'Salas que atingiram o limite de vagas estipulado na matriz curricular.',
      actionTab: 'CLASSES',
      actionLabel: 'Ajustar Capacidades',
      metricBadge: `${fullClasses.length} turmas lotadas`,
    });
  }

  // 6. Good practices / Info status
  detectedAnomalies.push({
    id: 'anom-backup-ok',
    level: 'INFO',
    title: 'Auditoria & Integridade do Banco de Dados Operando 100%',
    description: 'Armazenamento local persistente ativo com conformidade da Lei Geral de Proteção de Dados (LGPD).',
    actionTab: 'NETWORK_INSTALLER',
    actionLabel: 'Ver Instalador & Backup',
    metricBadge: 'Seguro',
  });

  const filteredAnomalies = detectedAnomalies.filter((a) => {
    if (activeAlertFilter === 'CRITICAL') return a.level === 'CRITICAL';
    if (activeAlertFilter === 'WARNING') return a.level === 'WARNING';
    if (activeAlertFilter === 'INFO') return a.level === 'INFO';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ========================================================= */}
      {/* CABEÇALHO EXECUTIVO MASTER SUCESSOEDU */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Dashbox Principal de Comando & Central de Notificações
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>{settings?.name || 'SucessoEdu Gestão Educacional'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Painel unificado de monitoramento de unidades escolares, auditoria em tempo real, acompanhamento de matrículas por situação e saúde operacional da rede.
            </p>
            {onLogout && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  id="dashboard-btn-logout"
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white text-xs font-bold border border-rose-400/30 transition-all cursor-pointer shadow-xs group"
                  title="Encerrar Sessão e Voltar para a Tela de Login"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Sair do Sistema</span>
                </button>
                <span className="text-[11px] text-indigo-300/80">
                  Operando como: <strong className="text-white">{currentUser?.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Quick Info User / Master Badge */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[130px]">
              <span className="text-[11px] font-bold text-indigo-200 block uppercase">Unidades Ativas</span>
              <span className="text-3xl font-black text-white">{totalUnits}</span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">
                {synchronizedUnits} Sincronizadas
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[130px]">
              <span className="text-[11px] font-bold text-indigo-200 block uppercase">Alunos na Rede</span>
              <span className="text-3xl font-black text-white">{students.length}</span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">
                {activeStudents.length} Ativos
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[130px]">
              <span className="text-[11px] font-bold text-indigo-200 block uppercase">Provas & Itens</span>
              <span className="text-3xl font-black text-amber-300">{exams.length}</span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {submissions.length} Realizadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 1: METRIC CARDS - UNIDADES ESCOLARES & SITUAÇÃO DOS ALUNOS */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span>Indicadores de Unidades Escolares & Censo Discente por Situação</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Ano Letivo Vigente: 2026</span>
        </div>

        {/* Grid of Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Unidades Ativas */}
          <div
            onClick={() => onNavigate('MUNICIPAL_SYNC')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600">Rede</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{totalUnits}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Escolas Ativas</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {offlineUnits > 0 ? `${offlineUnits} polos rurais/off` : '100% online'}
            </div>
          </div>

          {/* Card 2: Alunos Ativos */}
          <div
            onClick={() => onNavigate('STUDENTS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <UserCheck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600">Matrículas</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{activeStudents.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Alunos Ativos</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Frequência regular</div>
          </div>

          {/* Card 3: Alunos Transferidos */}
          <div
            onClick={() => onNavigate('STUDENTS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FolderSync className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-600">Movimentação</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{transferredStudents.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Transferidos</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Guia emitida</div>
          </div>

          {/* Card 4: Alunos Concluídos */}
          <div
            onClick={() => onNavigate('DOCUMENTS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Award className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-600">Formados</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{concludedStudents.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Concluídos</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Certificados prontos</div>
          </div>

          {/* Card 5: Alunos Suspensos / Trancados */}
          <div
            onClick={() => onNavigate('STUDENTS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <UserX className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-rose-600">Risco</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{suspendedStudents.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Trancados / Evasão</div>
            <div className="text-[10px] text-rose-600 mt-0.5">Demanda busca ativa</div>
          </div>

          {/* Card 6: Total de Turmas */}
          <div
            onClick={() => onNavigate('CLASSES')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-600">Salas</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{classes.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Turmas Ativas</div>
            <div className="text-[10px] text-purple-600 mt-0.5">Matrizes alocadas</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO ESPECIAL: DASHBOX DE PENDÊNCIAS DOS POLOS REMOTOS & CENSO */}
      {/* ========================================================= */}
      <CadastralPendingCensusDashbox
        students={students}
        schoolUnits={schoolUnits}
        classes={classes}
        onEditStudent={onEditStudent}
        onOpenImportModal={onOpenImportModal}
        onNavigateToSecretaria={() => onNavigate('STUDENTS')}
      />

      {/* ========================================================= */}
      {/* DASHBOX DE STATUS COM NOVAS ATUALIZAÇÕES DISPONÍVEIS & OTA */}
      {/* ========================================================= */}
      <SystemUpdateStatusDashbox
        onNavigateToUpdates={() => onNavigate('INSTALAFLOW')}
      />

      {/* ========================================================= */}
      {/* SEÇÃO 2: TELA DE NOTIFICAÇÕES, ALERTAS DE ANOMALIAS & PENDÊNCIAS */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Central de Notificações, Anomalias & Auditoria Preventiva</span>
                {detectedAnomalies.filter((a) => a.level === 'CRITICAL').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase">
                    Ação Necessária
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                O sistema analisa continuamente toda a base de dados para apontar pendências cadastrais, pedagógicas e de sincronização.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => setActiveAlertFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeAlertFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({detectedAnomalies.length})
            </button>
            <button
              onClick={() => setActiveAlertFilter('CRITICAL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeAlertFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Críticos ({detectedAnomalies.filter((a) => a.level === 'CRITICAL').length})
            </button>
            <button
              onClick={() => setActiveAlertFilter('WARNING')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeAlertFilter === 'WARNING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              Alertas ({detectedAnomalies.filter((a) => a.level === 'WARNING').length})
            </button>
            <button
              onClick={() => setActiveAlertFilter('INFO')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeAlertFilter === 'INFO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Informativos
            </button>
          </div>
        </div>

        {/* List of Detected Anomalies */}
        <div className="space-y-3">
          {filteredAnomalies.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-sm text-slate-700">Nenhuma pendência encontrada nesta categoria</div>
              <div className="text-xs text-slate-400 mt-1">Todos os registros e regras estão operando em conformidade total.</div>
            </div>
          ) : (
            filteredAnomalies.map((item) => {
              const isCritical = item.level === 'CRITICAL';
              const isWarning = item.level === 'WARNING';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCritical
                      ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                      : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-600 text-white shadow-xs'
                          : isWarning
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {isCritical ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <ShieldCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        {item.metricBadge && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isCritical
                                ? 'bg-rose-200/80 text-rose-800'
                                : isWarning
                                ? 'bg-amber-200/80 text-amber-800'
                                : 'bg-indigo-200/80 text-indigo-800'
                            }`}
                          >
                            {item.metricBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      onClick={() => onNavigate(item.actionTab)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                        isCritical
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : isWarning
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 3: GRADE DE BOTÕES DE AÇÃO RÁPIDA (BENTO BUTTONS) */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span>Módulos de Gestão & Botões de Acesso Direto</span>
          </div>
          <span className="text-xs text-slate-400">Clique para navegar instantaneamente</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Botão 1: Secretaria & Matrículas */}
          <button
            onClick={() => onNavigate('STUDENTS')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-800 text-[10px] font-bold">
                {students.length} Alunos
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Secretaria & Matrículas
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Fichas cadastrais, emissão de RA, transferências e enturmação de alunos.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Acessar Secretaria →
            </div>
          </button>

          {/* Botão 2: Turmas & Matrizes */}
          <button
            onClick={() => onNavigate('CLASSES')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Layers className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-purple-100 text-slate-600 group-hover:text-purple-800 text-[10px] font-bold">
                {classes.length} Turmas
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Turmas & Matrizes Curriculares
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Controle de capacidades, turnos, enturmação e alocação do corpo docente.
              </p>
            </div>
            <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Gerenciar Turmas →
            </div>
          </button>

          {/* Botão 3: Documentos & Certificados */}
          <button
            onClick={() => onNavigate('DOCUMENTS')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-800 text-[10px] font-bold">
                Oficial
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Documentos & Histórico Escolar
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Boletins bimestrais, históricos com autenticação e declarações de matrícula.
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Emitir Documentos →
            </div>
          </button>

          {/* Botão 4: Evolução Pedagógica & Gráficos */}
          <button
            onClick={() => onNavigate('PEDAGOGICAL_DASHBOARD')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 text-[10px] font-bold">
                Gráficos
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Evolução Pedagógica & BNCC
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gráficos de evolução do aluno e turma, taxas de aprovação e diagnóstico.
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Ver Evolução Pedagógica →
            </div>
          </button>

          {/* Botão 5: Banco de Questões BNCC */}
          <button
            onClick={() => onNavigate('QUESTION_BANK')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                <HelpCircle className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-600 group-hover:text-amber-800 text-[10px] font-bold">
                BNCC
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Banco de Questões BNCC
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Itens de múltipla escolha e discursivos com habilidades, gabarito e distratores.
              </p>
            </div>
            <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Acessar Banco de Itens →
            </div>
          </button>

          {/* Botão 6: Gestão de Provas & Exames */}
          <button
            onClick={() => onNavigate('EXAMS')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-rose-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-rose-100 text-slate-600 group-hover:text-rose-800 text-[10px] font-bold">
                {exams.length} Provas
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                Gerador de Provas & Avaliações
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Elaboração de cadernos de prova, gabaritos e correção automática.
              </p>
            </div>
            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Montar Avaliação →
            </div>
          </button>

          {/* Botão 7: Gestão Municipal & Polos Remotos */}
          <button
            onClick={() => onNavigate('MUNICIPAL_SYNC')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-cyan-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-cyan-50 group-hover:bg-cyan-600 text-cyan-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-cyan-100 text-slate-600 group-hover:text-cyan-800 text-[10px] font-bold">
                .edusync
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-600 transition-colors">
                Gestão Municipal & Polos Remotos
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sincronização de escolas sem internet por pendrive e censo unificado.
              </p>
            </div>
            <div className="text-[11px] font-bold text-cyan-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Unificar Polos →
            </div>
          </button>

          {/* Botão 8: WhatsApp & Notificações Administrativas */}
          <button
            onClick={() => onNavigate('WHATSAPP')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                WhatsApp & Avisos aos Pais
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Disparo de alertas de faltas, boletins, busca ativa e comunicados via WhatsApp.
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Abrir WhatsApp →
            </div>
          </button>

          {/* Botão 9: Controle de Usuários & Níveis de Acesso */}
          <button
            onClick={() => onNavigate('USER_CONTROL')}
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-rose-500 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Key className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                👑 Mestre
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                Controle de Usuários & Setores
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Permissões para Diretoria, Coordenação, Secretaria, Professores e Master.
              </p>
            </div>
            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Configurar Acessos →
            </div>
          </button>

          {/* Botão 10: Central de Administração & TI */}
          <button
            onClick={() => onNavigate('ADMIN_TI')}
            className="p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-3xl border-2 border-indigo-200 hover:border-indigo-600 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Sliders className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center gap-1">
                Hub Geral
              </span>
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                Central de Administração & TI
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Painel unificado com todos os 11 módulos de Deploy, Cloud, Builds .EXE e Segurança.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2 border-t border-indigo-100">
              Acessar Hub Central (Alt+M) →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
