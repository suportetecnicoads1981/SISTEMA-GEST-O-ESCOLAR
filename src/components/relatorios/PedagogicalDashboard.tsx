import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Filter,
  Lightbulb,
  FileSpreadsheet,
  ShieldCheck,
  Server,
  Zap,
  BookOpen,
  Sliders,
  Maximize2,
  Minimize2,
  Palette,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Settings2,
  Monitor,
  X,
  ArrowLeft,
  Home,
  ChevronRight,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Exam,
  Question,
  Student,
  SchoolClass,
  ExamSubmission,
  PedagogicalReport,
  SchoolUnit,
  Subject,
  SchoolSettings,
  AcademicHistory,
} from '../../types';
import { generatePedagogicalReport } from '../../data/storage';
import { EnvironmentService } from '../../services/environmentService';
import { AssessmentResultsReport } from './AssessmentResultsReport';
import { PedagogicalEvolution } from './PedagogicalEvolution';
import { BimonthlyAcademicEvolutionCard } from './BimonthlyAcademicEvolutionCard';
import {
  CustomizableChartModal,
  ChartDatasetOption,
} from '../common/CustomizableChartModal';
import {
  ConfigurablePrintModal,
  PrintColumnConfig,
  AppliedFilterItem,
  SummaryMetricItem,
} from '../common/ConfigurablePrintModal';
import { confirmDialog } from '../../utils/dialogs';

interface PedagogicalDashboardProps {
  exams: Exam[];
  questions: Question[];
  students: Student[];
  classes: SchoolClass[];
  submissions: ExamSubmission[];
  schoolUnits?: SchoolUnit[];
  subjects?: Subject[];
  settings?: SchoolSettings;
  academicHistories?: AcademicHistory[];
  initialSection?: 'DASHBOARD' | 'RESULTS_BY_SCHOOL_LEVEL' | 'EVOLUTION';
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

interface DashBoxConfig {
  tileStudents: boolean;
  tileAverage: boolean;
  tileApproval: boolean;
  tileServer: boolean;
  tileEvolution: boolean;
  tileBimonthlyEvolution: boolean;
  tileDistribution: boolean;
  tileAccuracy: boolean;
  tileAiDiagnosis: boolean;
  tileDevCard: boolean;
  tileCommonMistakes: boolean;
  tileStudentTable: boolean;
}

const DEFAULT_DASHBOX_CONFIG: DashBoxConfig = {
  tileStudents: true,
  tileAverage: true,
  tileApproval: true,
  tileServer: true,
  tileEvolution: true,
  tileBimonthlyEvolution: true,
  tileDistribution: true,
  tileAccuracy: true,
  tileAiDiagnosis: true,
  tileDevCard: true,
  tileCommonMistakes: true,
  tileStudentTable: true,
};

export const PedagogicalDashboard: React.FC<PedagogicalDashboardProps> = ({
  exams = [],
  questions = [],
  students = [],
  classes = [],
  submissions = [],
  schoolUnits = [],
  subjects = [],
  settings,
  academicHistories = [],
  initialSection = 'DASHBOARD',
  onBack,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<'DASHBOARD' | 'RESULTS_BY_SCHOOL_LEVEL' | 'EVOLUTION'>(initialSection);
  const [selectedExamId, setSelectedExamId] = useState<string>(exams?.[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Customizable Chart Modal State
  const [isChartCustomizerOpen, setIsChartCustomizerOpen] = useState<boolean>(false);
  const [chartCustomizerInitialDataset, setChartCustomizerInitialDataset] = useState<string>('grade_distribution');

  // Configurable Dash Box Panel states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [theme, setTheme] = useState<'LIGHT' | 'DARK' | 'INDIGO'>(() => {
    return (localStorage.getItem('edugestao_dash_theme') as any) || 'LIGHT';
  });

  const [dashBoxes, setDashBoxes] = useState<DashBoxConfig>(() => {
    const saved = localStorage.getItem('edugestao_dashbox_config');
    if (saved) {
      try {
        return { ...DEFAULT_DASHBOX_CONFIG, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_DASHBOX_CONFIG;
      }
    }
    return DEFAULT_DASHBOX_CONFIG;
  });

  // Save config changes
  useEffect(() => {
    localStorage.setItem('edugestao_dashbox_config', JSON.stringify(dashBoxes));
  }, [dashBoxes]);

  useEffect(() => {
    localStorage.setItem('edugestao_dash_theme', theme);
  }, [theme]);

  const toggleDashBox = (key: keyof DashBoxConfig) => {
    setDashBoxes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (preset: 'ALL' | 'EXECUTIVE' | 'PEDAGOGICAL') => {
    if (preset === 'ALL') {
      setDashBoxes(DEFAULT_DASHBOX_CONFIG);
    } else if (preset === 'EXECUTIVE') {
      setDashBoxes({
        tileStudents: true,
        tileAverage: true,
        tileApproval: true,
        tileServer: true,
        tileEvolution: true,
        tileBimonthlyEvolution: true,
        tileDistribution: true,
        tileAccuracy: false,
        tileAiDiagnosis: true,
        tileDevCard: false,
        tileCommonMistakes: false,
        tileStudentTable: true,
      });
    } else if (preset === 'PEDAGOGICAL') {
      setDashBoxes({
        tileStudents: false,
        tileAverage: true,
        tileApproval: true,
        tileServer: false,
        tileEvolution: true,
        tileBimonthlyEvolution: true,
        tileDistribution: true,
        tileAccuracy: true,
        tileAiDiagnosis: true,
        tileDevCard: false,
        tileCommonMistakes: true,
        tileStudentTable: true,
      });
    }
  };

  const selectedExam = (exams || []).find((e) => e.id === selectedExamId) || exams?.[0];

  const [isGeneratingAiInsight, setIsGeneratingAiInsight] = useState(false);
  const [aiInsightData, setAiInsightData] = useState<{
    source: string;
    text?: string;
    recommendations?: string[];
  } | null>(null);

  // Generate pedagogical report for selected exam
  const report: PedagogicalReport | null = useMemo(() => {
    if (!selectedExam) return null;
    return generatePedagogicalReport(selectedExam, questions, students, submissions);
  }, [selectedExam, questions, students, submissions]);

  const handleGenerateAiInsight = async () => {
    if (!selectedExam) return;
    setIsGeneratingAiInsight(true);
    try {
      const className = classes.find((c) => c.id === selectedExam.classId)?.name || 'Turma Geral';
      const topicMastery: Record<string, number> = {};
      report?.questionStats?.forEach((qs) => {
        topicMastery[qs.topic] = qs.correctPercentage;
      });

      const res = await EnvironmentService.requestPedagogicalInsights({
        examTitle: selectedExam.title,
        subject: selectedExam.subject,
        className,
        averageScore: report ? Number(report.averageScore.toFixed(1)) : 7.0,
        commonErrors: report?.commonErrors?.map((e) => ({ topic: e.topic, errorRate: e.errorPercentage })) || [],
        topicMastery,
      });
      setAiInsightData(res);
    } catch {
      // handled
    } finally {
      setIsGeneratingAiInsight(false);
    }
  };

  // Overall student performance progress evolution
  const evolutionData = useMemo(() => {
    return exams.map((ex) => {
      const exSubs = submissions.filter((s) => s.examId === ex.id);
      const avg =
        exSubs.length > 0
          ? Number((exSubs.reduce((a, b) => a + b.totalScore, 0) / exSubs.length).toFixed(1))
          : 0;
      return {
        name: ex.title.length > 16 ? ex.title.substring(0, 16) + '...' : ex.title,
        media: avg,
        meta: ex.passingScore,
        totalEntregas: exSubs.length,
      };
    });
  }, [exams, submissions]);

  // Grade Distribution Bracket
  const distributionData = useMemo(() => {
    if (!report) return [];
    let below5 = 0;
    let between5and7 = 0;
    let between7and9 = 0;
    let above9 = 0;

    report.studentResults.forEach((sr) => {
      if (sr.score < 5.0) below5++;
      else if (sr.score < 7.0) between5and7++;
      else if (sr.score < 9.0) between7and9++;
      else above9++;
    });

    return [
      { name: 'Insuficiente (< 5.0)', value: below5, color: '#ef4444' },
      { name: 'Regular (5.0 - 6.9)', value: between5and7, color: '#f59e0b' },
      { name: 'Bom (7.0 - 8.9)', value: between7and9, color: '#6366f1' },
      { name: 'Excelente (9.0 - 10.0)', value: above9, color: '#10b981' },
    ];
  }, [report]);

  // Question hit rate chart data
  const questionAccuracyData = useMemo(() => {
    if (!report) return [];
    return report.questionStats.map((qs, i) => ({
      name: `Q${i + 1}`,
      acerto: qs.correctPercentage,
      erro: 100 - qs.correctPercentage,
      topic: qs.topic,
    }));
  }, [report]);

  // Customizable Chart Datasets
  const availableChartDatasets: ChartDatasetOption[] = useMemo(() => {
    const list: ChartDatasetOption[] = [];

    // 1. Grade Distribution
    if (distributionData.length > 0) {
      list.push({
        id: 'grade_distribution',
        title: 'Distribuição por Faixa de Desempenho',
        subtitle: 'Distribuição dos estudantes por nível de rendimento na avaliação',
        data: distributionData.map((d) => ({
          name: d.name,
          value: d.value,
        })),
        valueLabel: 'Alunos',
        unit: 'estudantes',
        defaultChartType: 'DONUT',
      });
    }

    // 2. Question Accuracy
    if (report && report.questionStats.length > 0) {
      list.push({
        id: 'question_accuracy',
        title: 'Taxa de Acertos por Questão',
        subtitle: 'Índice percentual de acertos e erros por questão do simulado',
        data: report.questionStats.map((qs, i) => ({
          name: `Q${i + 1} (${qs.topic ? qs.topic.substring(0, 15) : 'Geral'})`,
          value: qs.correctPercentage,
          secondaryValue: 100 - qs.correctPercentage,
        })),
        valueLabel: '% Acerto',
        secondaryValueLabel: '% Erro',
        unit: '%',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 60,
        benchmarkLabel: 'Meta Acerto (> 60%)',
      });
    }

    // 3. Student Scores Ranking
    if (report && report.studentResults.length > 0) {
      list.push({
        id: 'student_scores',
        title: 'Desempenho Individual dos Estudantes',
        subtitle: 'Notas finais obtidas na avaliação selecionada',
        data: report.studentResults.map((sr) => ({
          name: sr.studentName.length > 20 ? sr.studentName.substring(0, 20) + '...' : sr.studentName,
          value: Number(sr.score.toFixed(1)),
          secondaryValue: sr.correctCount,
        })),
        valueLabel: 'Nota Final',
        secondaryValueLabel: 'Acertos',
        unit: 'pts',
        defaultChartType: 'BAR_HORIZONTAL',
        benchmarkValue: selectedExam?.passingScore || 6.0,
        benchmarkLabel: `Média de Corte (${selectedExam?.passingScore || 6.0})`,
      });
    }

    // 4. Topic mastery if available
    if (report && report.commonErrors && report.commonErrors.length > 0) {
      list.push({
        id: 'topic_mistakes',
        title: 'Principais Dificuldades & Tópicos Críticos',
        subtitle: 'Taxa de erro por tópico avaliado',
        data: report.commonErrors.map((cm) => ({
          name: cm.topic.length > 25 ? cm.topic.substring(0, 25) + '...' : cm.topic,
          value: cm.errorPercentage,
        })),
        valueLabel: '% de Erro no Tópico',
        unit: '%',
        defaultChartType: 'BAR_VERTICAL',
      });
    }

    return list;
  }, [distributionData, report, selectedExam]);

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Aluno', 'Nota', 'Status', 'Acertos', 'Tempo(seg)'],
      ...report.studentResults.map((sr) => [
        sr.studentName,
        sr.score.toString(),
        sr.status,
        sr.correctCount.toString(),
        sr.timeSpentSeconds.toString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_pedagogico_${selectedExam?.title || 'prova'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Colunas do Painel de Impressão Configurável do Relatório Pedagógico
  const pedagogicalPrintColumns: PrintColumnConfig[] = useMemo(
    () => [
      { id: 'index', label: 'Nº', align: 'center', width: '38px', defaultVisible: true },
      { id: 'studentName', label: 'Nome do Estudante', align: 'left', defaultVisible: true },
      { id: 'enrollmentNumber', label: 'Matrícula (RA)', align: 'center', width: '90px', defaultVisible: true },
      { id: 'correctCount', label: 'Acertos', align: 'center', width: '75px', defaultVisible: true },
      { id: 'score', label: 'Nota Final', align: 'center', width: '80px', defaultVisible: true },
      { id: 'accuracy', label: '% Acertos', align: 'center', width: '75px', defaultVisible: false },
      { id: 'timeSpent', label: 'Tempo Gasto', align: 'center', width: '85px', defaultVisible: false },
      { id: 'status', label: 'Situação', align: 'center', width: '95px', defaultVisible: true },
      { id: 'mistakes', label: 'Pontos de Atenção / Dificuldades', align: 'left', defaultVisible: true },
      { id: 'signature', label: 'Visto Docente', align: 'center', width: '110px', defaultVisible: false },
    ],
    []
  );

  const printPedagogicalAppliedFilters: AppliedFilterItem[] = useMemo(() => {
    const list: AppliedFilterItem[] = [];
    if (selectedExam) {
      list.push({ label: 'Avaliação', value: selectedExam.title });
      list.push({ label: 'Componente', value: selectedExam.subject });
      list.push({ label: 'Bimestre/Etapa', value: selectedExam.term });
    }
    if (selectedClassId !== 'ALL') {
      const cls = classes.find((c) => c.id === selectedClassId);
      list.push({ label: 'Turma', value: cls?.name || selectedClassId });
    } else {
      list.push({ label: 'Turma', value: 'Todas as Turmas da Escola' });
    }
    return list;
  }, [selectedExam, selectedClassId, classes]);

  const printPedagogicalSummaryMetrics: SummaryMetricItem[] = useMemo(() => {
    if (!report) return [];
    return [
      { label: 'Total de Estudantes Avaliados', value: report.studentResults.length, color: 'text-slate-900' },
      { label: 'Média Geral da Avaliação', value: `${report.averageScore.toFixed(1)} pts`, color: 'text-indigo-600' },
      { label: 'Taxa de Aprovação', value: `${report.approvalRate.toFixed(1)}%`, color: 'text-emerald-600' },
      { label: 'Maior Nota Registrada', value: `${report.highestScore.toFixed(1)} pts`, color: 'text-amber-600' },
    ];
  }, [report]);

  const renderPrintPedagogicalCell = (sr: any, colId: string, idx: number) => {
    switch (colId) {
      case 'index':
        return String(idx + 1);
      case 'studentName':
        return sr.studentName;
      case 'enrollmentNumber':
        return sr.enrollmentNumber;
      case 'correctCount':
        return `${sr.correctCount} / ${selectedExam?.questions.length || 0}`;
      case 'score':
        return sr.score.toFixed(1);
      case 'accuracy':
        return `${Math.round((sr.correctCount / (selectedExam?.questions.length || 1)) * 100)}%`;
      case 'timeSpent':
        return `${Math.floor(sr.timeSpentSeconds / 60)}m ${sr.timeSpentSeconds % 60}s`;
      case 'status':
        return sr.status;
      case 'mistakes':
        return (sr.mistakes?.length || 0) > 0 ? sr.mistakes.join('; ') : 'Sem erros críticos';
      case 'signature':
        return <div className="h-4 border-b border-slate-400 w-full" />;
      default:
        return '';
    }
  };

  // Theme-based class helpers
  const cardBgClass =
    theme === 'DARK'
      ? 'bg-slate-900 border-slate-800 text-white'
      : theme === 'INDIGO'
      ? 'bg-slate-900/95 border-indigo-900/50 text-white'
      : 'bg-white border-slate-200 text-slate-900';

  const cardSubtextClass =
    theme === 'DARK' || theme === 'INDIGO' ? 'text-slate-400' : 'text-slate-500';

  const titleClass =
    theme === 'DARK' || theme === 'INDIGO' ? 'text-slate-100' : 'text-slate-800';

  const handleInternalBack = () => {
    if (activeSection !== 'DASHBOARD') {
      setActiveSection('DASHBOARD');
    } else if (onBack) {
      onBack();
    } else {
      onNavigate?.('MAIN_DASHBOARD');
    }
  };

  return (
    <div
      id="bento-dashboard-root"
      className={`space-y-4 transition-colors duration-300 ${
        isPresentationMode
          ? theme === 'DARK'
            ? 'bg-slate-950 p-6 rounded-2xl border border-slate-800'
            : theme === 'INDIGO'
            ? 'bg-slate-900 p-6 rounded-2xl border border-indigo-950'
            : 'bg-slate-100 p-6 rounded-2xl border border-slate-300'
          : ''
      }`}
    >
      {/* Module Navigation Bar (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleInternalBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title={activeSection !== 'DASHBOARD' ? 'Voltar ao Painel Pedagógico Principal' : 'Voltar ao Dashbox Principal'}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{activeSection !== 'DASHBOARD' ? 'Voltar ao Diagnóstico' : 'Voltar ao Início'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">
              {activeSection === 'EVOLUTION'
                ? 'Evolução Pedagógica & Matriz'
                : activeSection === 'RESULTS_BY_SCHOOL_LEVEL'
                ? 'Resultados por Escola & Nível'
                : 'Evolução Pedagógica & Desempenho'}
            </span>
          </div>
        </div>

        {/* Quick Module Navigation Tabs */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => {
                setActiveSection('DASHBOARD');
                onNavigate('PEDAGOGICAL_DASHBOARD');
              }}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Painel Pedagógico</span>
            </button>
            <button
              onClick={() => onNavigate('EXAMS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Gerador de Provas</span>
            </button>
            <button
              onClick={() => onNavigate('QUESTION_BANK')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>Banco de Questões</span>
            </button>
            <button
              onClick={() => onNavigate('STUDENTS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Alunos</span>
            </button>
          </div>
        )}
      </div>

      {/* Internal Sub-View Switcher */}
      <div className="no-print flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('DASHBOARD')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'DASHBOARD'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BrainCircuit className="h-4 w-4" />
          <span>Diagnóstico Pedagógico IA & DashBox</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('RESULTS_BY_SCHOOL_LEVEL')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'RESULTS_BY_SCHOOL_LEVEL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Resultados por Nível & por Escola</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('EVOLUTION')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'EVOLUTION'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Evolução Histórica do Aluno e Turma</span>
        </button>
      </div>

      {activeSection === 'RESULTS_BY_SCHOOL_LEVEL' && (
        <AssessmentResultsReport
          exams={exams}
          questions={questions}
          students={students}
          classes={classes}
          submissions={submissions}
          schoolUnits={schoolUnits}
          subjects={subjects}
          settings={settings}
          onBack={() => setActiveSection('DASHBOARD')}
          onNavigate={onNavigate}
        />
      )}

      {activeSection === 'EVOLUTION' && (
        <PedagogicalEvolution
          exams={exams}
          questions={questions}
          students={students}
          classes={classes}
          subjects={subjects}
          submissions={submissions}
          academicHistories={academicHistories}
          onBack={() => setActiveSection('DASHBOARD')}
          onNavigate={onNavigate}
        />
      )}

      {activeSection === 'DASHBOARD' && (
        <>
          {/* Top Filter & Actions Header */}
      <div
        className={`${cardBgClass} rounded-2xl border p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print transition-all`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Avaliação em Análise
            </label>
            <select
              id="select-bento-exam"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                theme === 'DARK' || theme === 'INDIGO'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} • {ex.subject} ({ex.term})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Turma
            </label>
            <select
              id="select-bento-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                theme === 'DARK' || theme === 'INDIGO'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="ALL">Todas as Turmas da Escola</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          {/* Gerar Gráficos Personalizados Button */}
          <button
            type="button"
            onClick={() => {
              setChartCustomizerInitialDataset('grade_distribution');
              setIsChartCustomizerOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Gerar e personalizar gráficos do painel pedagógico"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Gerar Gráficos Personalizados</span>
          </button>

          {/* Configurar Dash Boxes Button */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Configurar visibilidade dos Dash Boxes e Tema"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Configurar Dash Boxes</span>
          </button>

          {/* Presentation Mode Toggle */}
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isPresentationMode
                ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-sm'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
            title="Ativar/Desativar modo apresentação em tela cheia"
          >
            {isPresentationMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{isPresentationMode ? 'Sair Apresentação' : 'Modo Apresentação'}</span>
          </button>

          <button
            id="btn-bento-export-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="btn-bento-print-pdf"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Abrir Painel de Impressão Configurável (escolher colunas, filtros aplicados e cabeçalhos)"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Painel de Impressão</span>
          </button>
        </div>
      </div>

      {/* Presentation Mode Banner */}
      {isPresentationMode && (
        <div className="bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-800 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider">
                Painel Executivo de Apresentação Pedagógica
              </h2>
              <p className="text-xs text-indigo-100">
                {selectedExam?.title} • {selectedExam?.subject} • Data:{' '}
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Transmissão ao Vivo
            </span>
            <button
              onClick={() => setIsPresentationMode(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* BENTO GRID: 12 Columns Architecture with configurable Dash Boxes */}
      <div className="grid grid-cols-12 gap-4">
        {/* Metric 1: Alunos Ativos */}
        {dashBoxes.tileStudents && (
          <div
            id="bento-tile-students"
            className={`col-span-12 sm:col-span-6 lg:col-span-3 ${cardBgClass} rounded-2xl border p-4 shadow-xs flex flex-col justify-center transition-all`}
          >
            <span className={`text-xs font-bold ${cardSubtextClass} uppercase mb-1`}>Alunos Ativos</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${titleClass}`}>{students.length}</span>
              <span className="text-emerald-500 text-xs font-medium">+100% matriculados</span>
            </div>
          </div>
        )}

        {/* Metric 2: Média Geral */}
        {dashBoxes.tileAverage && (
          <div
            id="bento-tile-average"
            className={`col-span-12 sm:col-span-6 lg:col-span-3 ${cardBgClass} rounded-2xl border p-4 shadow-xs flex flex-col justify-center transition-all`}
          >
            <span className={`text-xs font-bold ${cardSubtextClass} uppercase mb-1`}>
              Média Geral (Simulados)
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${titleClass}`}>
                {report ? report.averageScore.toFixed(2) : '7.80'}
              </span>
              <span className="text-emerald-500 text-xs font-medium">
                Meta: {selectedExam?.passingScore || 6.0} pts
              </span>
            </div>
          </div>
        )}

        {/* Metric 3: Taxa de Aprovação */}
        {dashBoxes.tileApproval && (
          <div
            id="bento-tile-certificates"
            className={`col-span-12 sm:col-span-6 lg:col-span-3 ${cardBgClass} rounded-2xl border p-4 shadow-xs flex flex-col justify-center transition-all`}
          >
            <span className={`text-xs font-bold ${cardSubtextClass} uppercase mb-1`}>Taxa de Aprovação</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${titleClass}`}>
                {report ? `${report.approvalRate.toFixed(0)}%` : '92%'}
              </span>
              <span className="text-indigo-500 text-xs font-medium">Auto-avaliados</span>
            </div>
          </div>
        )}

        {/* Metric 4: Status do Servidor */}
        {dashBoxes.tileServer && (
          <div
            id="bento-tile-server"
            className={`col-span-12 sm:col-span-6 lg:col-span-3 ${cardBgClass} rounded-2xl border p-4 shadow-xs flex flex-col justify-center transition-all`}
          >
            <span className={`text-xs font-bold ${cardSubtextClass} uppercase mb-1`}>Status Servidor</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                \\SRV-ACAD-01\DATABASE
              </span>
            </div>
          </div>
        )}

        {/* Bento Major Tile 1: Historical Performance Chart (8 cols) */}
        {dashBoxes.tileEvolution && (
          <div
            id="bento-tile-evolution-chart"
            className={`col-span-12 lg:col-span-8 ${cardBgClass} rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${titleClass} flex items-center gap-2 text-sm`}>
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  Evolução de Desempenho Pedagógico
                </h3>
                <div className="flex gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                    Médias vs Corte
                  </span>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'DARK' ? '#334155' : '#f1f5f9'} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: theme === 'DARK' ? '#94a3b8' : '#64748b' }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 10, fill: theme === 'DARK' ? '#94a3b8' : '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'DARK' ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        color: theme === 'DARK' ? '#f8fafc' : '#0f172a',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="media"
                      name="Média Obtida"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      name="Corte Mínimo"
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-8 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div>
                <p className={`text-[10px] ${cardSubtextClass} uppercase font-bold`}>Erro Comum Recorrente</p>
                <p className="text-xs font-bold text-rose-500">
                  {report?.commonErrors?.[0]?.topic || 'Cálculo de Proporção'}
                </p>
              </div>
              <div>
                <p className={`text-[10px] ${cardSubtextClass} uppercase font-bold`}>Meta de Aproveitamento</p>
                <p className={`text-xs font-bold ${titleClass}`}>
                  {report ? `${report.approvalRate.toFixed(1)}% atingido` : '85.2% atingido'}
                </p>
              </div>
              <div>
                <p className={`text-[10px] ${cardSubtextClass} uppercase font-bold`}>Tempo Médio</p>
                <p className="text-xs font-bold text-indigo-600">
                  {report ? `${Math.floor(report.averageTimeSpentSeconds / 60)} min` : '18 min'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bento Major Tile 2: Action Card / Central Inteligente */}
        {dashBoxes.tileAiDiagnosis && (
          <div
            id="bento-tile-exam-center"
            className="col-span-12 lg:col-span-4 bg-linear-to-br from-indigo-600 to-indigo-900 rounded-2xl p-5 shadow-lg text-white flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-indigo-200" />
                  Diagnóstico IA (Gemini)
                </h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold text-indigo-100">
                  gemini-3.8-flash
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    BANCO DE QUESTÕES
                  </p>
                  <p className="text-lg font-bold text-white">{questions.length} Questões Ativas</p>
                </div>

                {/* Exibição do Diagnóstico IA gerado */}
                {aiInsightData ? (
                  <div className="bg-white/15 p-3 rounded-xl border border-white/20 text-xs space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300">
                      <span>INTERVENÇÃO PEDAGÓGICA</span>
                      <span className="bg-emerald-500/30 px-1.5 py-0.5 rounded text-white">{aiInsightData.source}</span>
                    </div>
                    {aiInsightData.text ? (
                      <p className="text-[11px] text-indigo-50 leading-relaxed whitespace-pre-line">
                        {aiInsightData.text}
                      </p>
                    ) : (
                      <ul className="list-disc list-inside text-[11px] text-indigo-50 space-y-1">
                        {aiInsightData.recommendations?.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                      SÍNTESE PSICOMÉTRICA
                    </p>
                    <p className="text-xs text-indigo-100 mt-1">
                      Gera recomendações pedagógicas de intervenção baseadas no desempenho da turma.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleGenerateAiInsight}
                disabled={isGeneratingAiInsight}
                className="w-full py-2 px-3 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiInsight ? 'animate-spin' : 'text-indigo-600'}`} />
                <span>{isGeneratingAiInsight ? 'Sintetizando com Gemini AI...' : 'Gerar Diagnóstico IA da Turma'}</span>
              </button>

              <div className="text-[11px] text-indigo-100 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between">
                <span>Mapeamento BNCC</span>
                <span className="font-bold text-emerald-300">100% Coberto</span>
              </div>
            </div>
          </div>
        )}

        {/* Bento Tile 3: Accuracy per Question (6 cols) */}
        {dashBoxes.tileAccuracy && (
          <div
            id="bento-tile-question-accuracy"
            className={`col-span-12 lg:col-span-6 ${cardBgClass} rounded-2xl border p-5 shadow-xs space-y-3 transition-all`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold ${titleClass} uppercase tracking-wider flex items-center gap-2`}>
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Taxa de Acertos por Questão
              </h3>
              <span className="text-[10px] text-slate-400">Verde: Acertos | Vermelho: Erros</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionAccuracyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'DARK' ? '#334155' : '#f1f5f9'} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: theme === 'DARK' ? '#94a3b8' : '#64748b' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: theme === 'DARK' ? '#94a3b8' : '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'DARK' ? '#0f172a' : '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="acerto" name="% Acerto" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="erro" name="% Erro" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Bento Tile 4: Grade Brackets Pie (6 cols) */}
        {dashBoxes.tileDistribution && (
          <div
            id="bento-tile-grade-brackets"
            className={`col-span-12 lg:col-span-6 ${cardBgClass} rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold ${titleClass} uppercase tracking-wider`}>
                Distribuição por Faixa de Desempenho
              </h3>
              <span className="text-[10px] text-slate-400">Desempenho Geral</span>
            </div>

            <div className="grid grid-cols-2 items-center gap-2">
              <div className="h-40 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'DARK' ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {distributionData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className={`flex items-center gap-1.5 ${cardSubtextClass} truncate`}>
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className={`font-bold ${titleClass}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bento Major Tile: Evolução de Desempenho Acadêmico Comparando Notas Bimestrais por Disciplina (Recharts) */}
        {dashBoxes.tileBimonthlyEvolution && (
          <div className="col-span-12">
            <BimonthlyAcademicEvolutionCard
              students={students}
              classes={classes}
              subjects={subjects}
              academicHistories={academicHistories}
              theme={theme}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {/* Bento Tile 6: Dark Card Sobre o Desenvolvedor (6 cols) */}
        {dashBoxes.tileDevCard && (
          <div
            id="bento-tile-dev-card"
            className="col-span-12 lg:col-span-12 bg-slate-900 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold mb-1 text-sm flex items-center gap-2">
                <span>👨‍💻</span> Sobre a Engenharia do Sistema & Dash Boxes
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Plataforma com suporte híbrido para operação local (offline/LAN) e hospedagem em nuvem
                (Cloud Run, VPS, Vercel, Docker). Painel configurável em tempo real.
              </p>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">EduGestão Pro Enterprise</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  suportetecnicoads@gmail.com | Versão 2.4.0
                </p>
              </div>
              <div className="px-3 py-1 bg-indigo-600 rounded-lg font-bold text-white text-xs shadow-sm">
                Cloud & Offline Ready
              </div>
            </div>
          </div>
        )}

        {/* Bento Tile 7: Common Mistakes & Pedagogical Interventions (12 cols) */}
        {dashBoxes.tileCommonMistakes && report && report.commonErrors.length > 0 && (
          <div
            id="bento-tile-common-mistakes"
            className={`col-span-12 ${cardBgClass} rounded-2xl border p-5 shadow-xs space-y-3 transition-all`}
          >
            <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Mapeamento Automatizado de Erros Comuns & Distratores
            </h3>
            <p className={`text-xs ${cardSubtextClass}`}>
              Identificação automática das lacunas de aprendizado baseado nas opções incorretas mais assinaladas
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {report.commonErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-950 dark:text-amber-200">
                      {err.topic} (Código: {err.questionCode})
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                      {err.errorPercentage}% de erro
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{err.mistakeDescription}</p>
                  <p className="text-indigo-900 dark:text-indigo-300 font-semibold text-[11px] pt-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-amber-600 shrink-0" />
                    <span>Intervenção: {err.suggestedIntervention}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bento Tile 8: Individual Student Performance Table (12 cols) */}
        {dashBoxes.tileStudentTable && (
          <div
            id="bento-tile-student-table"
            className={`col-span-12 ${cardBgClass} rounded-2xl border p-5 shadow-xs space-y-3 transition-all`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${titleClass} flex items-center gap-2`}>
                <Users className="h-4 w-4 text-indigo-600" />
                Relatório de Desempenho Individualizado por Estudante
              </h3>
              <span className={`text-xs ${cardSubtextClass} font-medium`}>
                {report?.studentResults.length} alunos avaliados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Estudante</th>
                    <th className="py-2.5 px-3">Matrícula (RA)</th>
                    <th className="py-2.5 px-3 text-center">Acertos</th>
                    <th className="py-2.5 px-3 text-center">Nota Obtida</th>
                    <th className="py-2.5 px-3 text-center">Tempo Gasto</th>
                    <th className="py-2.5 px-3 text-center">Situação</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Pontos de Atenção / Equívocos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report?.studentResults.map((sr) => (
                    <tr key={sr.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className={`py-2.5 px-3 font-bold ${titleClass}`}>{sr.studentName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{sr.enrollmentNumber}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {sr.correctCount} / {selectedExam?.questions.length}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-sm text-indigo-600 dark:text-indigo-400">
                        {sr.score.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                        {Math.floor(sr.timeSpentSeconds / 60)}m {sr.timeSpentSeconds % 60}s
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            sr.status === 'APROVADO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          }`}
                        >
                          {sr.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {(sr.mistakes?.length || 0) > 0 ? (
                          <span className="text-amber-800 dark:text-amber-300 font-medium">
                            {sr.mistakes?.[0]} {(sr.mistakes?.length || 0) > 1 ? `(+${sr.mistakes.length - 1})` : ''}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            Sem erros significativos
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* MODAL: Configuração de Dash Boxes e Layout */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Configurador de Dash Boxes & Painel Apresentável
                  </h2>
                  <p className="text-xs text-slate-500">
                    Personalize quais cards aparecem no dashboard e escolha o tema visual
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Presets Rápidos */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Modelos de Layout Prontos (Presets)</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyPreset('ALL')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 text-left bg-slate-50 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-xs">Completo</p>
                    <p className="text-[10px] text-slate-500">Todos os 11 cards ativos</p>
                  </button>

                  <button
                    onClick={() => applyPreset('EXECUTIVE')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 text-left bg-slate-50 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-xs">Executivo / Diretoria</p>
                    <p className="text-[10px] text-slate-500">Métricas gerais e evolução</p>
                  </button>

                  <button
                    onClick={() => applyPreset('PEDAGOGICAL')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 text-left bg-slate-50 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-xs">Foco Pedagógico</p>
                    <p className="text-[10px] text-slate-500">Erros, BNCC e alunos</p>
                  </button>
                </div>
              </div>

              {/* Tema Visual */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-indigo-600" />
                  <span>Tema Visual do Painel</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme('LIGHT')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                      theme === 'LIGHT'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-white border border-slate-300"></span>
                    <span>Claro Corporativo</span>
                  </button>

                  <button
                    onClick={() => setTheme('DARK')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                      theme === 'DARK'
                        ? 'border-indigo-600 bg-slate-900 text-white font-bold'
                        : 'border-slate-200 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-slate-900 border border-slate-700"></span>
                    <span>Modo Escuro (Dark)</span>
                  </button>

                  <button
                    onClick={() => setTheme('INDIGO')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                      theme === 'INDIGO'
                        ? 'border-indigo-600 bg-indigo-950 text-white font-bold'
                        : 'border-slate-200 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-indigo-700"></span>
                    <span>Azul Executivo</span>
                  </button>
                </div>
              </div>

              {/* Toggles individuais para cada Dash Box */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 text-indigo-600" />
                  <span>Controle de Visibilidade dos Dash Boxes</span>
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'tileStudents', label: 'Card: Alunos Ativos' },
                    { key: 'tileAverage', label: 'Card: Média Geral dos Simulados' },
                    { key: 'tileApproval', label: 'Card: Taxa de Aprovação' },
                    { key: 'tileServer', label: 'Card: Status do Servidor Local / Cloud' },
                    { key: 'tileEvolution', label: 'Gráfico: Evolução de Desempenho Pedagógico' },
                    { key: 'tileBimonthlyEvolution', label: 'Gráfico: Evolução Multidisciplinar Bimestral (Recharts)' },
                    { key: 'tileAiDiagnosis', label: 'Card: Central de Provas Automática & BNCC' },
                    { key: 'tileAccuracy', label: 'Gráfico: Taxa de Acertos por Questão' },
                    { key: 'tileDistribution', label: 'Gráfico: Distribuição por Faixa de Desempenho' },
                    { key: 'tileCommonMistakes', label: 'Painel: Mapeamento de Distratores & Intervenções' },
                    { key: 'tileStudentTable', label: 'Tabela: Desempenho Individual dos Alunos' },
                    { key: 'tileDevCard', label: 'Card: Engenharia e Contato' },
                  ].map((box) => {
                    const isVisible = dashBoxes[box.key as keyof DashBoxConfig];
                    return (
                      <div
                        key={box.key}
                        onClick={() => toggleDashBox(box.key as keyof DashBoxConfig)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          {isVisible ? (
                            <Eye className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          )}
                          <span>{box.label}</span>
                        </span>
                        <div
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 duration-300 cursor-pointer ${
                            isVisible ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={async () => {
                  try {
                    const isLocked = localStorage.getItem('sucessoedu_layout_lock') === 'true';
                    if (isLocked) {
                      const confirmReset = await confirmDialog(
                        'AVISO DE PROTEÇÃO DE LAYOUT DO SUCESSOEDU:\n\n' +
                        'Uma instalação prévia do sistema foi detectada e a proteção do layout está ATIVA para impedir a perda das customizações da escola.\n\n' +
                        'Tem certeza de que deseja sobrescrever o layout atual e restaurar a configuração de fábrica?'
                      );
                      if (!confirmReset) return;
                    }
                  } catch {
                    // ignore
                  }
                  setDashBoxes(DEFAULT_DASHBOX_CONFIG);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restaurar Padrão</span>
              </button>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Concluir & Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CUSTOMIZAÇÃO AVANÇADA DE GRÁFICOS */}
      <CustomizableChartModal
        isOpen={isChartCustomizerOpen}
        onClose={() => setIsChartCustomizerOpen(false)}
        availableDatasets={availableChartDatasets}
        initialDatasetId={chartCustomizerInitialDataset}
      />

      {/* PAINEL DE IMPRESSÃO CONFIGURÁVEL PEDAGÓGICO */}
      <ConfigurablePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={`Relatório de Desempenho e Diagnóstico Pedagógico - ${selectedExam?.title || 'Avaliação'}`}
        subtitle={`Componente: ${selectedExam?.subject || 'Geral'} • Etapa: ${selectedExam?.term || 'Ano Letivo'} • Análise Oficial da Secretaria e Coordenação`}
        columns={pedagogicalPrintColumns}
        data={report?.studentResults || []}
        appliedFilters={printPedagogicalAppliedFilters}
        summaryMetrics={printPedagogicalSummaryMetrics}
        defaultOrientation="landscape"
        renderCell={renderPrintPedagogicalCell}
      />
    </div>
  );
};
