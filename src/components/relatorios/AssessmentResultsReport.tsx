import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Printer,
  Download,
  Building,
  GraduationCap,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Search,
  Sliders,
  ChevronRight,
  PieChart as PieChartIcon,
  ShieldCheck,
  FileDown,
  Sparkles,
  School,
  X,
  Eye,
  Palette,
  ArrowLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  SchoolUnit,
  Subject,
  SchoolSettings,
} from '../../types';
import { triggerPrint, downloadPrintableHtml } from '../../utils/printHelper';
import { PrintExportModal, ColumnDefinition } from '../common/PrintExportModal';
import {
  CustomizableChartModal,
  ChartDatasetOption,
} from '../common/CustomizableChartModal';
import { CustomizableChartCard } from '../common/CustomizableChartCard';

interface AssessmentResultsReportProps {
  exams: Exam[];
  questions: Question[];
  students: Student[];
  classes: SchoolClass[];
  submissions: ExamSubmission[];
  schoolUnits?: SchoolUnit[];
  subjects?: Subject[];
  settings?: SchoolSettings;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const AssessmentResultsReport: React.FC<AssessmentResultsReportProps> = ({
  exams,
  questions,
  students,
  classes,
  submissions,
  schoolUnits = [],
  subjects = [],
  settings,
  onBack,
  onNavigate,
}) => {
  // Filters
  const [selectedSchoolUnitId, setSelectedSchoolUnitId] = useState<string>('ALL');
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewTab, setViewTab] = useState<'OVERVIEW' | 'BY_SCHOOL' | 'BY_LEVEL' | 'DETAILED_TABLE'>('OVERVIEW');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isChartCustomizerOpen, setIsChartCustomizerOpen] = useState<boolean>(false);
  const [chartCustomizerInitialDataset, setChartCustomizerInitialDataset] = useState<string>('school_ranking');
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Helper mapping
  const classesById = useMemo(() => {
    const map = new Map<string, SchoolClass>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const studentsById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const schoolUnitsById = useMemo(() => {
    const map = new Map<string, SchoolUnit>();
    schoolUnits.forEach((u) => map.set(u.id, u));
    return map;
  }, [schoolUnits]);

  const examsById = useMemo(() => {
    const map = new Map<string, Exam>();
    exams.forEach((e) => map.set(e.id, e));
    return map;
  }, [exams]);

  // Consolidate submissions with full student, class, school and exam metadata
  const enrichedSubmissions = useMemo(() => {
    return submissions.map((sub) => {
      const student = studentsById.get(sub.studentId);
      const studentClass = student ? classesById.get(student.classId) : undefined;
      const schoolUnit = studentClass?.schoolUnitId
        ? schoolUnitsById.get(studentClass.schoolUnitId)
        : schoolUnits[0];
      const exam = examsById.get(sub.examId);

      // Determine segment / school level
      let segment = studentClass?.segment || 'ENSINO_FUNDAMENTAL';
      let gradeLevel = studentClass?.gradeLevel || 'Ensino Fundamental';

      // Score percentage
      const totalPoints = exam?.totalPoints || 10;
      const rawScore = (sub as any).totalScore ?? (sub as any).score ?? 0;
      const scorePct = totalPoints > 0 ? Math.round((rawScore / totalPoints) * 100) : rawScore * 10;

      // Proficiency level
      let proficiency: 'AVANCADO' | 'ADEQUADO' | 'BASICO' | 'ABAIXO_DO_BASICO' = 'ADEQUADO';
      if (scorePct >= 80) proficiency = 'AVANCADO';
      else if (scorePct >= 60) proficiency = 'ADEQUADO';
      else if (scorePct >= 50) proficiency = 'BASICO';
      else proficiency = 'ABAIXO_DO_BASICO';

      return {
        ...sub,
        score: rawScore,
        totalScore: rawScore,
        studentName: student?.name || 'Aluno Desconhecido',
        enrollmentNumber: student?.enrollmentNumber || '—',
        classId: studentClass?.id || '—',
        className: studentClass?.name || 'Turma Não Identificada',
        gradeLevel,
        segment,
        schoolUnitId: schoolUnit?.id || 'unit-default',
        schoolUnitName: schoolUnit?.name || 'Unidade Sede Central',
        schoolZone: schoolUnit?.locationZone === 'ZONA_RURAL' || schoolUnit?.locationZone === 'RURAL' ? 'Rural' : 'Urbana',
        examTitle: exam?.title || 'Avaliação Geral',
        subjectName: exam?.subject || 'Geral',
        totalPoints,
        scorePct,
        proficiency,
      };
    });
  }, [submissions, studentsById, classesById, schoolUnitsById, examsById, schoolUnits]);

  // Filtered submissions based on user selection
  const filteredSubmissions = useMemo(() => {
    return enrichedSubmissions.filter((item) => {
      const matchSchool =
        selectedSchoolUnitId === 'ALL' || item.schoolUnitId === selectedSchoolUnitId;
      const matchSegment =
        selectedSegment === 'ALL' ||
        item.segment === selectedSegment ||
        (selectedSegment === 'FUNDAMENTAL_1' && item.gradeLevel.match(/[1-5]º/)) ||
        (selectedSegment === 'FUNDAMENTAL_2' && item.gradeLevel.match(/[6-9]º/));
      const matchExam = selectedExamId === 'ALL' || item.examId === selectedExamId;
      const subIdFilter = (selectedSubjectId || '').toLowerCase().trim();
      const matchSubject =
        selectedSubjectId === 'ALL' ||
        (item.subjectName && item.subjectName.toLowerCase().includes(subIdFilter));
      const q = (searchTerm || '').toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.studentName && item.studentName.toLowerCase().includes(q)) ||
        (item.enrollmentNumber && item.enrollmentNumber.toLowerCase().includes(q)) ||
        (item.className && item.className.toLowerCase().includes(q));

      return matchSchool && matchSegment && matchExam && matchSubject && matchSearch;
    });
  }, [enrichedSubmissions, selectedSchoolUnitId, selectedSegment, selectedExamId, selectedSubjectId, searchTerm]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    if (total === 0) {
      return {
        totalEvaluated: 0,
        averageScore: 0,
        averagePct: 0,
        avancadoCount: 0,
        adequadoCount: 0,
        basicoCount: 0,
        abaixoBasicoCount: 0,
        avancadoPct: 0,
        adequadoPct: 0,
        basicoPct: 0,
        abaixoBasicoPct: 0,
        passRate: 0,
      };
    }

    const sumPct = filteredSubmissions.reduce((acc, curr) => acc + curr.scorePct, 0);
    const sumScore = filteredSubmissions.reduce((acc, curr) => acc + curr.score, 0);
    const avgPct = Math.round(sumPct / total);
    const avgScore = Number((sumScore / total).toFixed(1));

    const avancadoCount = filteredSubmissions.filter((s) => s.proficiency === 'AVANCADO').length;
    const adequadoCount = filteredSubmissions.filter((s) => s.proficiency === 'ADEQUADO').length;
    const basicoCount = filteredSubmissions.filter((s) => s.proficiency === 'BASICO').length;
    const abaixoBasicoCount = filteredSubmissions.filter((s) => s.proficiency === 'ABAIXO_DO_BASICO').length;

    const passCount = avancadoCount + adequadoCount;
    const passRate = Math.round((passCount / total) * 100);

    return {
      totalEvaluated: total,
      averageScore: avgScore,
      averagePct: avgPct,
      avancadoCount,
      adequadoCount,
      basicoCount,
      abaixoBasicoCount,
      avancadoPct: Math.round((avancadoCount / total) * 100),
      adequadoPct: Math.round((adequadoCount / total) * 100),
      basicoPct: Math.round((basicoCount / total) * 100),
      abaixoBasicoPct: Math.round((abaixoBasicoCount / total) * 100),
      passRate,
    };
  }, [filteredSubmissions]);

  // Aggregation by School Unit
  const schoolAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        schoolUnitId: string;
        schoolName: string;
        schoolZone: string;
        totalCount: number;
        sumPct: number;
        avancado: number;
        adequado: number;
        basico: number;
        abaixoBasico: number;
      }
    >();

    // Initialize all schools
    schoolUnits.forEach((u) => {
      const isRural = u.locationZone === 'ZONA_RURAL' || u.locationZone === 'RURAL';
      map.set(u.id, {
        schoolUnitId: u.id,
        schoolName: u.name,
        schoolZone: isRural ? 'Rural' : 'Urbana',
        totalCount: 0,
        sumPct: 0,
        avancado: 0,
        adequado: 0,
        basico: 0,
        abaixoBasico: 0,
      });
    });

    enrichedSubmissions.forEach((sub) => {
      let entry = map.get(sub.schoolUnitId);
      if (!entry) {
        entry = {
          schoolUnitId: sub.schoolUnitId,
          schoolName: sub.schoolUnitName,
          schoolZone: sub.schoolZone,
          totalCount: 0,
          sumPct: 0,
          avancado: 0,
          adequado: 0,
          basico: 0,
          abaixoBasico: 0,
        };
        map.set(sub.schoolUnitId, entry);
      }

      entry.totalCount += 1;
      entry.sumPct += sub.scorePct;
      if (sub.proficiency === 'AVANCADO') entry.avancado += 1;
      else if (sub.proficiency === 'ADEQUADO') entry.adequado += 1;
      else if (sub.proficiency === 'BASICO') entry.basico += 1;
      else entry.abaixoBasico += 1;
    });

    return Array.from(map.values())
      .map((item) => {
        const avg = item.totalCount > 0 ? Math.round(item.sumPct / item.totalCount) : 0;
        return {
          ...item,
          averagePct: avg,
          passRate:
            item.totalCount > 0
              ? Math.round(((item.avancado + item.adequado) / item.totalCount) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.averagePct - a.averagePct);
  }, [schoolUnits, enrichedSubmissions]);

  // Aggregation by Grade Level / Segment
  const gradeLevelAggregates = useMemo(() => {
    const levelMap = new Map<
      string,
      {
        levelName: string;
        totalCount: number;
        sumPct: number;
        avancado: number;
        adequado: number;
        basico: number;
        abaixoBasico: number;
      }
    >();

    const defaultLevels = [
      'Educação Infantil',
      '1º Ano - Fund. I',
      '2º Ano - Fund. I',
      '3º Ano - Fund. I',
      '4º Ano - Fund. I',
      '5º Ano - Fund. I',
      '6º Ano - Fund. II',
      '7º Ano - Fund. II',
      '8º Ano - Fund. II',
      '9º Ano - Fund. II',
      'Ensino Médio',
      'EJA',
    ];

    defaultLevels.forEach((lvl) => {
      levelMap.set(lvl, {
        levelName: lvl,
        totalCount: 0,
        sumPct: 0,
        avancado: 0,
        adequado: 0,
        basico: 0,
        abaixoBasico: 0,
      });
    });

    enrichedSubmissions.forEach((sub) => {
      let key = 'Ensino Fundamental';
      if (sub.segment === 'EDUCACAO_INFANTIL') key = 'Educação Infantil';
      else if (sub.segment === 'ENSINO_MEDIO') key = 'Ensino Médio';
      else if (sub.segment === 'EJA') key = 'EJA';
      else {
        const found = defaultLevels.find((d) => sub.gradeLevel.includes(d.split(' ')[0]));
        if (found) key = found;
        else key = sub.gradeLevel;
      }

      let entry = levelMap.get(key);
      if (!entry) {
        entry = {
          levelName: key,
          totalCount: 0,
          sumPct: 0,
          avancado: 0,
          adequado: 0,
          basico: 0,
          abaixoBasico: 0,
        };
        levelMap.set(key, entry);
      }

      entry.totalCount += 1;
      entry.sumPct += sub.scorePct;
      if (sub.proficiency === 'AVANCADO') entry.avancado += 1;
      else if (sub.proficiency === 'ADEQUADO') entry.adequado += 1;
      else if (sub.proficiency === 'BASICO') entry.basico += 1;
      else entry.abaixoBasico += 1;
    });

    return Array.from(levelMap.values())
      .filter((l) => l.totalCount > 0)
      .map((l) => ({
        ...l,
        averagePct: Math.round(l.sumPct / l.totalCount),
        passRate: Math.round(((l.avancado + l.adequado) / l.totalCount) * 100),
      }));
  }, [enrichedSubmissions]);

  // Chart Data for Proficiency Donut
  const proficiencyChartData = useMemo(() => {
    return [
      { name: 'Avançado (>=80%)', value: stats.avancadoCount, color: '#10b981' },
      { name: 'Adequado (60-79%)', value: stats.adequadoCount, color: '#3b82f6' },
      { name: 'Básico (50-59%)', value: stats.basicoCount, color: '#f59e0b' },
      { name: 'Abaixo do Básico (<50%)', value: stats.abaixoBasicoCount, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Aggregation by Subject
  const subjectAggregates = useMemo(() => {
    const map = new Map<string, { subject: string; sumPct: number; count: number }>();
    enrichedSubmissions.forEach((sub) => {
      const subj = sub.subjectName || 'Geral';
      const existing = map.get(subj) || { subject: subj, sumPct: 0, count: 0 };
      existing.sumPct += sub.scorePct;
      existing.count += 1;
      map.set(subj, existing);
    });
    return Array.from(map.values()).map((s) => ({
      name: s.subject,
      value: Math.round(s.sumPct / (s.count || 1)),
      secondaryValue: 70,
    }));
  }, [enrichedSubmissions]);

  // Available Datasets for the Universal Customizable Chart Generator
  const availableChartDatasets: ChartDatasetOption[] = useMemo(() => {
    return [
      {
        id: 'school_ranking',
        title: 'Desempenho Médio por Unidade Escolar',
        subtitle: 'Média percentual de aproveitamento por escola da rede municipal',
        data: schoolAggregates.map((s) => ({
          name: s.schoolName,
          value: s.averagePct,
          secondaryValue: s.passRate,
        })),
        valueLabel: 'Média de Rendimento',
        secondaryValueLabel: 'Proficiência Plena',
        unit: '%',
        defaultChartType: 'BAR_HORIZONTAL',
        benchmarkValue: 70,
        benchmarkLabel: 'Meta Municipal (70%)',
      },
      {
        id: 'grade_level',
        title: 'Desempenho por Etapa / Nível Escolar',
        subtitle: 'Comparativo de médias do 1º ao 9º Ano e Ensino Médio',
        data: gradeLevelAggregates.map((g) => ({
          name: g.levelName,
          value: g.averagePct,
          secondaryValue: g.passRate,
        })),
        valueLabel: 'Média do Nível',
        secondaryValueLabel: 'Proficiência Plena',
        unit: '%',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 70,
        benchmarkLabel: 'Meta SME (70%)',
      },
      {
        id: 'proficiency_dist',
        title: 'Distribuição dos Níveis de Proficiência',
        subtitle: 'Classificação dos estudantes por faixas pedagógicas',
        data: [
          { name: 'Avançado (>=80%)', value: stats.avancadoPct, count: stats.avancadoCount, color: '#10b981' },
          { name: 'Adequado (60-79%)', value: stats.adequadoPct, count: stats.adequadoCount, color: '#3b82f6' },
          { name: 'Básico (50-59%)', value: stats.basicoPct, count: stats.basicoCount, color: '#f59e0b' },
          { name: 'Abaixo do Básico (<50%)', value: stats.abaixoBasicoPct, count: stats.abaixoBasicoCount, color: '#ef4444' },
        ],
        valueLabel: 'Percentual de Estudantes',
        unit: '%',
        defaultChartType: 'DONUT',
      },
      {
        id: 'pass_rate',
        title: 'Taxa de Proficiência Plena por Escola',
        subtitle: 'Percentual de alunos com rendimento Adequado ou Avançado',
        data: schoolAggregates.map((s) => ({
          name: s.schoolName,
          value: s.passRate,
          secondaryValue: 75,
        })),
        valueLabel: 'Taxa de Aprovação/Proficiência',
        unit: '%',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 75,
        benchmarkLabel: 'Meta IDEB (75%)',
      },
      {
        id: 'subject_ranking',
        title: 'Desempenho por Componente Curricular',
        subtitle: 'Média de rendimento em cada disciplina avaliada',
        data: subjectAggregates,
        valueLabel: 'Média da Disciplina',
        unit: '%',
        defaultChartType: 'RADAR',
        benchmarkValue: 70,
        benchmarkLabel: 'Meta Curricular (70%)',
      },
    ];
  }, [schoolAggregates, gradeLevelAggregates, stats, subjectAggregates]);

  // Print columns
  const reportColumns: ColumnDefinition<any>[] = [
    { key: 'studentName', label: 'Estudante' },
    { key: 'enrollmentNumber', label: 'Matrícula' },
    { key: 'schoolUnitName', label: 'Escola' },
    { key: 'className', label: 'Turma' },
    { key: 'gradeLevel', label: 'Etapa / Série' },
    { key: 'examTitle', label: 'Avaliação / Prova' },
    { key: 'subjectName', label: 'Disciplina' },
    {
      key: 'score',
      label: 'Nota / Pontos',
      getValue: (item) => `${item.score}/${item.totalPoints}`,
    },
    {
      key: 'scorePct',
      label: 'Aproveitamento (%)',
      getValue: (item) => `${item.scorePct}%`,
    },
    {
      key: 'proficiency',
      label: 'Nível de Proficiência',
      getValue: (item) => {
        if (item.proficiency === 'AVANCADO') return 'Avançado';
        if (item.proficiency === 'ADEQUADO') return 'Adequado';
        if (item.proficiency === 'BASICO') return 'Básico';
        return 'Abaixo do Básico';
      },
    },
  ];

  const handlePrintReport = () => {
    setIsPrintModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Estudante',
      'Matrícula',
      'Unidade Escolar',
      'Zona',
      'Turma',
      'Etapa/Série',
      'Avaliação',
      'Disciplina',
      'Nota',
      'Total Pontos',
      'Aproveitamento (%)',
      'Proficiência',
    ];

    const rows = filteredSubmissions.map((s) => [
      `"${s.studentName}"`,
      `"${s.enrollmentNumber}"`,
      `"${s.schoolUnitName}"`,
      `"${s.schoolZone}"`,
      `"${s.className}"`,
      `"${s.gradeLevel}"`,
      `"${s.examTitle}"`,
      `"${s.subjectName}"`,
      s.score,
      s.totalPoints,
      `"${s.scorePct}%"`,
      `"${s.proficiency}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_avaliacoes_nivel_escola_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Painel Pedagógico ou Início"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{onBack ? 'Voltar ao Diagnóstico' : 'Voltar ao Início'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>Pedagógico</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Resultados por Escola & Nível</span>
          </div>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onNavigate('PEDAGOGICAL_DASHBOARD')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Painel Pedagógico</span>
            </button>
            <button
              onClick={() => onNavigate('EXAMS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Award className="h-3.5 w-3.5 text-slate-500" />
              <span>Provas</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
              <span>Secretaria & Gestão Pedagógica</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-indigo-600 font-bold">Relatório Oficial de Avaliações</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Resultados de Avaliações por Nível Escolar & Unidade Escolar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Análise comparativa de proficiência, rendimento acadêmico e desempenho entre escolas e etapas de ensino
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setChartCustomizerInitialDataset('school_ranking');
              setIsChartCustomizerOpen(true);
            }}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            title="Abrir gerador e personalizador de gráficos com múltiplos tipos e temas"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Gerar Gráficos Personalizados</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Relatório Oficial (A4)</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filtros Estruturais de Análise
            </span>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {filteredSubmissions.length} Avaliações Selecionadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Unidade Escolar */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>Unidade Escolar / Escola</span>
            </label>
            <select
              value={selectedSchoolUnitId}
              onChange={(e) => setSelectedSchoolUnitId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">🏢 Todas as Escolas da Rede Municipal</option>
              {schoolUnits.map((u) => {
                const isRural = u.locationZone === 'ZONA_RURAL' || u.locationZone === 'RURAL';
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({isRural ? 'Zona Rural' : 'Zona Urbana'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Nível Escolar / Etapa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
              <span>Nível Escolar / Etapa de Ensino</span>
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">🎓 Todos os Níveis Escolares</option>
              <option value="EDUCACAO_INFANTIL">Educação Infantil (Creche & Pré-escola)</option>
              <option value="FUNDAMENTAL_1">Ensino Fundamental I (1º ao 5º Ano)</option>
              <option value="FUNDAMENTAL_2">Ensino Fundamental II (6º ao 9º Ano)</option>
              <option value="ENSINO_FUNDAMENTAL">Ensino Fundamental Completo</option>
              <option value="ENSINO_MEDIO">Ensino Médio</option>
              <option value="EJA">Educação de Jovens e Adultos (EJA)</option>
            </select>
          </div>

          {/* Prova / Avaliação Específica */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <span>Instrumento de Avaliação</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">📝 Todas as Provas e Simulados</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Busca Aluno / Turma */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Busca Rápida</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Aluno, Matrícula ou Turma..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Média Geral */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Média de Rendimento
            </span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              stats.averagePct >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.averagePct}%</span>
            <span className="text-xs font-bold text-slate-400">({stats.averageScore} pts)</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <span className={stats.averagePct >= 60 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {stats.averagePct >= 70 ? '★ Desempenho Adequado' : stats.averagePct >= 50 ? '● Básico' : '▲ Requer Intervenção'}
            </span>
          </div>
        </div>

        {/* Alunos Avaliados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alunos Avaliados
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalEvaluated}</span>
            <span className="text-xs font-semibold text-slate-500">entregas</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Amostra válida em {classes.length} turmas da rede
          </div>
        </div>

        {/* Taxa de Aprovação / Proficiência Satisfatória */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Proficiência Plena
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{stats.passRate}%</span>
            <span className="text-xs font-semibold text-slate-500">
              ({stats.avancadoCount + stats.adequadoCount} alunos)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Níveis Avançado e Adequado
          </div>
        </div>

        {/* Alunos em Atenção / Crítico */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Abaixo do Básico / Alerta
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{stats.abaixoBasicoPct}%</span>
            <span className="text-xs font-semibold text-slate-500">({stats.abaixoBasicoCount} alunos)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Encaminhar para reforço escolar
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto bg-white p-2 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setViewTab('OVERVIEW')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            viewTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Visão Geral & Gráficos</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('BY_SCHOOL')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            viewTab === 'BY_SCHOOL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Comparativo por Escola ({schoolAggregates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('BY_LEVEL')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            viewTab === 'BY_LEVEL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Comparativo por Nível Escolar</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('DETAILED_TABLE')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            viewTab === 'DETAILED_TABLE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Tabela Discriminada ({filteredSubmissions.length})</span>
        </button>
      </div>

      {/* =====================================================================
          SUB-TAB 1: VISÃO GERAL & GRÁFICOS PERSONALIZÁVEIS
          ===================================================================== */}
      {viewTab === 'OVERVIEW' && (
        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
            {/* Ranking por Escola - Card Interativo */}
            <div className="lg:col-span-2 min-w-0">
              <CustomizableChartCard
                title="Desempenho Médio por Unidade Escolar (%)"
                subtitle="Média geral de rendimento acadêmico por escola da rede municipal"
                data={schoolAggregates.map((s) => ({
                  name: s.schoolName,
                  value: s.averagePct,
                  secondaryValue: s.passRate,
                }))}
                valueLabel="Média de Rendimento"
                secondaryValueLabel="Proficiência Plena"
                unit="%"
                defaultChartType="BAR_HORIZONTAL"
                benchmarkValue={70}
                benchmarkLabel="Meta SME (70%)"
                height={290}
                onOpenFullCustomizer={() => {
                  setChartCustomizerInitialDataset('school_ranking');
                  setIsChartCustomizerOpen(true);
                }}
              />
            </div>

            {/* Distribuição de Proficiência - Card Interativo */}
            <div className="lg:col-span-1 min-w-0">
              <CustomizableChartCard
                title="Níveis de Proficiência"
                subtitle="Classificação pedagógica dos estudantes avaliados"
                data={[
                  { name: 'Avançado (>=80%)', value: stats.avancadoPct, count: stats.avancadoCount },
                  { name: 'Adequado (60-79%)', value: stats.adequadoPct, count: stats.adequadoCount },
                  { name: 'Básico (50-59%)', value: stats.basicoPct, count: stats.basicoCount },
                  { name: 'Abaixo Básico (<50%)', value: stats.abaixoBasicoPct, count: stats.abaixoBasicoCount },
                ]}
                valueLabel="Estudantes (%)"
                unit="%"
                defaultChartType="DONUT"
                height={290}
                onOpenFullCustomizer={() => {
                  setChartCustomizerInitialDataset('proficiency_dist');
                  setIsChartCustomizerOpen(true);
                }}
              />
            </div>
          </div>

          {/* Comparativo de Médias por Nível de Ensino - Card Interativo */}
          <div className="min-w-0">
            <CustomizableChartCard
              title="Desempenho por Etapa / Nível Escolar (1º ao 9º Ano e Médio)"
              subtitle="Comparativo evolutivo e diagnóstico por ano/ciclo de ensino"
              data={gradeLevelAggregates.map((g) => ({
                name: g.levelName,
                value: g.averagePct,
                secondaryValue: g.passRate,
              }))}
              valueLabel="Média de Aproveitamento"
              secondaryValueLabel="Taxa de Proficiência Plena"
              unit="%"
              defaultChartType="BAR_VERTICAL"
              benchmarkValue={70}
              benchmarkLabel="Meta Municipal (70%)"
              height={280}
              onOpenFullCustomizer={() => {
                setChartCustomizerInitialDataset('grade_level');
                setIsChartCustomizerOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: COMPARATIVO DETALHADO POR ESCOLA
          ===================================================================== */}
      {viewTab === 'BY_SCHOOL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quadro Comparativo de Desempenho por Unidade Escolar
              </h3>
              <p className="text-xs text-slate-500">
                Classificação, taxa de proficiência e distribuição de alunos por polo e unidade da rede
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Posição</th>
                  <th className="p-3">Unidade Escolar</th>
                  <th className="p-3">Localidade</th>
                  <th className="p-3 text-center">Avaliados</th>
                  <th className="p-3 text-center">Média Geral</th>
                  <th className="p-3 text-center">Proficiência Plena</th>
                  <th className="p-3 text-center">Avançado</th>
                  <th className="p-3 text-center">Adequado</th>
                  <th className="p-3 text-center">Básico</th>
                  <th className="p-3 text-center">Abaixo do Básico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schoolAggregates.map((school, index) => (
                  <tr key={school.schoolUnitId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-500">
                      {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{school.schoolName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        school.schoolZone === 'Rural' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Zona {school.schoolZone}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{school.totalCount}</td>
                    <td className="p-3 text-center">
                      <span className={`font-black px-2.5 py-1 rounded-lg ${
                        school.averagePct >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : school.averagePct >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {school.averagePct}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-700">{school.passRate}%</td>
                    <td className="p-3 text-center text-emerald-700 font-semibold">{school.avancado}</td>
                    <td className="p-3 text-center text-blue-700 font-semibold">{school.adequado}</td>
                    <td className="p-3 text-center text-amber-700 font-semibold">{school.basico}</td>
                    <td className="p-3 text-center text-rose-700 font-semibold">{school.abaixoBasico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: COMPARATIVO DETALHADO POR NÍVEL ESCOLAR
          ===================================================================== */}
      {viewTab === 'BY_LEVEL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Desempenho Consolidado por Nível Escolar & Etapa
              </h3>
              <p className="text-xs text-slate-500">
                Aproveitamento pedagógico segmentado por ano letivo e ciclo de formação
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Etapa / Nível Escolar</th>
                  <th className="p-3 text-center">Total Avaliados</th>
                  <th className="p-3 text-center">Média de Rendimento</th>
                  <th className="p-3 text-center">Proficiência Plena</th>
                  <th className="p-3 text-center">Avançado</th>
                  <th className="p-3 text-center">Adequado</th>
                  <th className="p-3 text-center">Básico</th>
                  <th className="p-3 text-center">Abaixo do Básico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gradeLevelAggregates.map((lvl) => (
                  <tr key={lvl.levelName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{lvl.levelName}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{lvl.totalCount}</td>
                    <td className="p-3 text-center">
                      <span className={`font-black px-2.5 py-1 rounded-lg ${
                        lvl.averagePct >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : lvl.averagePct >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {lvl.averagePct}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-700">{lvl.passRate}%</td>
                    <td className="p-3 text-center text-emerald-700 font-semibold">{lvl.avancado}</td>
                    <td className="p-3 text-center text-blue-700 font-semibold">{lvl.adequado}</td>
                    <td className="p-3 text-center text-amber-700 font-semibold">{lvl.basico}</td>
                    <td className="p-3 text-center text-rose-700 font-semibold">{lvl.abaixoBasico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: TABELA DISCRIMINADA DE AVALIAÇÕES
          ===================================================================== */}
      {viewTab === 'DETAILED_TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Listagem Nominal & Discriminada de Avaliações
              </h3>
              <p className="text-xs text-slate-500">
                Registros individuais com pontuação, aproveitamento e enquadramento de proficiência
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {filteredSubmissions.length} registros
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Estudante</th>
                  <th className="p-2.5">Escola</th>
                  <th className="p-2.5">Turma / Etapa</th>
                  <th className="p-2.5">Avaliação</th>
                  <th className="p-2.5">Disciplina</th>
                  <th className="p-2.5 text-center">Nota</th>
                  <th className="p-2.5 text-center">Aproveitamento</th>
                  <th className="p-2.5 text-center">Proficiência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      Nenhuma avaliação encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, idx) => (
                    <tr key={sub.id || idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-mono text-[10px] text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        <div>{sub.studentName}</div>
                        <div className="text-[10px] font-normal text-slate-400 font-mono">
                          Mat: {sub.enrollmentNumber}
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <div className="font-semibold">{sub.schoolUnitName}</div>
                        <div className="text-[10px] text-slate-400">Zona {sub.schoolZone}</div>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <div className="font-semibold">{sub.className}</div>
                        <div className="text-[10px] text-slate-400">{sub.gradeLevel}</div>
                      </td>
                      <td className="p-2.5 text-slate-800 font-medium">{sub.examTitle}</td>
                      <td className="p-2.5 text-slate-600">{sub.subjectName}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">
                        {sub.score}/{sub.totalPoints}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded-md ${
                          sub.scorePct >= 70
                            ? 'bg-emerald-50 text-emerald-700'
                            : sub.scorePct >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {sub.scorePct}%
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.proficiency === 'AVANCADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.proficiency === 'ADEQUADO'
                            ? 'bg-blue-100 text-blue-800'
                            : sub.proficiency === 'BASICO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sub.proficiency === 'AVANCADO'
                            ? 'Avançado'
                            : sub.proficiency === 'ADEQUADO'
                            ? 'Adequado'
                            : sub.proficiency === 'BASICO'
                            ? 'Básico'
                            : 'Abaixo do Básico'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Universal Customizable Chart Generator Modal */}
      <CustomizableChartModal
        isOpen={isChartCustomizerOpen}
        onClose={() => setIsChartCustomizerOpen(false)}
        reportTitle="Relatório de Avaliações por Nível Escolar e Escola"
        datasets={availableChartDatasets}
        initialDatasetId={chartCustomizerInitialDataset}
      />

      {/* Official Print Modal */}
      <PrintExportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Relatório Geral de Avaliações por Nível Escolar e Unidade Escolar"
        subtitle="Consolidado Municipal de Rendimento Acadêmico e Diagnóstico de Proficiência"
        documentCategory="RELATÓRIO PEDAGÓGICO OFICIAL • SME"
        items={filteredSubmissions}
        columns={reportColumns}
        settings={settings}
        extraHeaderInfo={[
          {
            label: 'Unidade Escolar',
            value:
              selectedSchoolUnitId === 'ALL'
                ? 'Todas as Unidades da Rede'
                : schoolUnitsById.get(selectedSchoolUnitId)?.name || 'Sede Central',
          },
          {
            label: 'Nível / Etapa',
            value: selectedSegment === 'ALL' ? 'Todos os Níveis' : selectedSegment,
          },
          {
            label: 'Avaliação',
            value:
              selectedExamId === 'ALL'
                ? 'Todas as Provas'
                : examsById.get(selectedExamId)?.title || 'Geral',
          },
          {
            label: 'Ano Letivo',
            value: '2026',
          },
        ]}
        summaryMetrics={[
          { label: 'Avaliados', value: stats.totalEvaluated, colorClass: 'text-indigo-600' },
          { label: 'Média Geral', value: `${stats.averagePct}%`, colorClass: 'text-emerald-600' },
          { label: 'Proficiência Plena', value: `${stats.passRate}%`, colorClass: 'text-blue-600' },
          { label: 'Abaixo do Básico', value: `${stats.abaixoBasicoPct}%`, colorClass: 'text-rose-600' },
        ]}
        defaultFileName="relatorio_avaliacoes_nivel_escola"
      />
    </div>
  );
};
