import React, { useState, useMemo } from 'react';
import { DocumentLetterhead } from '../common/DocumentLetterhead';
import {
  TrendingUp,
  Award,
  Users,
  GraduationCap,
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  LineChart as LineChartIcon,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Student,
  SchoolClass,
  Subject,
  Exam,
  Question,
  ExamSubmission,
  AcademicHistory,
  ClassGradeSheet,
  SchoolUnit,
} from '../../types';
import {
  CustomizableChartModal,
  ChartDatasetOption,
} from '../common/CustomizableChartModal';
import { CustomizableChartCard } from '../common/CustomizableChartCard';
import { BimonthlyAcademicEvolutionCard } from './BimonthlyAcademicEvolutionCard';
import { ArrowLeft, Home } from 'lucide-react';
import { printElementIsolated, printFileName, setPrintTitle } from '../../utils/printIsolated';
import { mergeGradeHistories, studentBimesters, studentFinal, groupStats, BIMESTER_LABELS, fmtGrade, isNum, PASSING_GRADE } from '../../services/gradeAnalytics';
import { ChartScopeBar, useChartScope } from '../common/ChartScopeBar';
import { classLabelWithSchool } from '../../utils/schoolDataNormalizer';

interface PedagogicalEvolutionProps {
  students?: Student[];
  classes?: SchoolClass[];
  subjects?: Subject[];
  exams?: Exam[];
  questions?: Question[];
  submissions?: ExamSubmission[];
  academicHistories?: AcademicHistory[];
  /** Diário de Notas dos professores (fonte principal das notas). */
  classGradeSheets?: ClassGradeSheet[];
  schoolUnits?: SchoolUnit[];
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const PedagogicalEvolution: React.FC<PedagogicalEvolutionProps> = ({
  students = [],
  classes = [],
  subjects = [],
  exams = [],
  questions = [],
  submissions = [],
  academicHistories = [],
  classGradeSheets = [],
  schoolUnits = [],
  onBack,
  onNavigate,
}) => {
  // Notas reais: Diário de Notas + histórico escolar, por aluno.
  const mergedHistories = useMemo(
    () => mergeGradeHistories(academicHistories, classGradeSheets, students),
    [academicHistories, classGradeSheets, students]
  );
  const histByStudent = useMemo(() => new Map(mergedHistories.map((h) => [h.studentId, h])), [mergedHistories]);
  const studentsByClass = useMemo(() => {
    const m = new Map<string, string[]>();
    (students || []).forEach((st) => {
      if (!st?.classId) return;
      if (!m.has(st.classId)) m.set(st.classId, []);
      m.get(st.classId)!.push(st.id);
    });
    return m;
  }, [students]);
  // Recorte por escola/etapa/turno (turmas do filtro e do comparativo).
  const chartScope = useChartScope(classes, schoolUnits);
  const scopedClasses = useMemo(
    () => (classes || []).filter((c) => chartScope.classInScope(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, chartScope.scope]
  );
  // Mode: 'STUDENT' | 'CLASS' | 'COMPARATIVE' | 'BIMONTHLY_MULTIDISCIPLINARY'
  const [viewMode, setViewMode] = useState<
    'STUDENT' | 'CLASS' | 'COMPARATIVE' | 'BIMONTHLY_MULTIDISCIPLINARY'
  >('STUDENT');

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || 'ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => students[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchStudentTerm, setSearchStudentTerm] = useState<string>('');

  // Customizable Chart Modal State
  const [isChartCustomizerOpen, setIsChartCustomizerOpen] = useState<boolean>(false);
  const [chartCustomizerInitialDataset, setChartCustomizerInitialDataset] = useState<string>('student_bimonthly');

  // Filter students based on class selection and search
  const filteredStudents = useMemo(() => {
    return (students || []).filter((s) => {
      if (!s) return false;
      const matchClass = selectedClassId === 'ALL' ? chartScope.studentInScope(s) : s.classId === selectedClassId;
      const matchSearch =
        !searchStudentTerm ||
        (s.name && s.name.toLowerCase().includes(searchStudentTerm.toLowerCase())) ||
        (s.enrollmentNumber && s.enrollmentNumber.includes(searchStudentTerm));
      return matchClass && matchSearch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, selectedClassId, searchStudentTerm, chartScope.scope]);

  // Selected student object
  const currentStudent = useMemo(() => {
    return (
      (students || []).find((s) => s.id === selectedStudentId) ||
      filteredStudents[0] ||
      students[0] ||
      null
    );
  }, [students, selectedStudentId, filteredStudents]);

  // Selected class object
  const currentClass = useMemo(() => {
    return (
      (classes || []).find((c) => c.id === selectedClassId) ||
      scopedClasses[0] ||
      null
    );
  }, [classes, selectedClassId, scopedClasses]);

  // Notas do aluno selecionado (nunca as de outro aluno).
  const studentHistory = useMemo(() => (currentStudent ? histByStudent.get(currentStudent.id) || null : null), [currentStudent, histByStudent]);

  // Student submissions across exams
  const studentSubmissions = useMemo(() => {
    if (!currentStudent) return [];
    return (submissions || []).filter((sub) => sub && sub.studentId === currentStudent.id);
  }, [currentStudent, submissions]);

  // -------------------------------------------------------------
  // NOTAS REAIS (Diário de Notas + histórico). Sem nota → não aparece (nada inventado).
  // -------------------------------------------------------------
  const classmateIds = useMemo(
    () => (currentStudent?.classId ? studentsByClass.get(currentStudent.classId) || [] : []),
    [currentStudent, studentsByClass]
  );

  const studentBimonthlyChartData = useMemo(() => {
    const mine = studentBimesters(studentHistory, selectedSubject);
    const cls = groupStats(classmateIds, histByStudent, selectedSubject).bimesters;
    return BIMESTER_LABELS.map((bimestre, i) => ({ bimestre, notaAluno: mine[i], mediaTurma: cls[i], metaEscola: PASSING_GRADE }))
      .filter((d) => isNum(d.notaAluno))
      .map((d) => ({ ...d, notaAluno: d.notaAluno as number, mediaTurma: isNum(d.mediaTurma) ? d.mediaTurma : undefined }));
  }, [studentHistory, selectedSubject, classmateIds, histByStudent]);

  const studentSubjectPerformanceData = useMemo(() => {
    return (studentHistory?.records || [])
      .filter((r) => r && isNum(r.finalGrade))
      .map((r) => {
        const turma = groupStats(classmateIds, histByStudent, r.subjectName).average;
        return {
          subject: r.subjectName.length > 14 ? r.subjectName.slice(0, 13) + '…' : r.subjectName,
          fullName: r.subjectName,
          nota: r.finalGrade,
          turma: isNum(turma) ? turma : undefined,
          proficiencia: Math.min(100, Math.round((r.finalGrade / 10) * 100)),
        };
      });
  }, [studentHistory, classmateIds, histByStudent]);

  const currentClassStats = useMemo(
    () => (currentClass ? groupStats(studentsByClass.get(currentClass.id) || [], histByStudent, selectedSubject) : null),
    [currentClass, studentsByClass, histByStudent, selectedSubject]
  );

  const classEvolutionData = useMemo(() => {
    if (!currentClassStats) return [];
    return BIMESTER_LABELS.map((periodo, i) => ({
      periodo,
      mediaGeral: currentClassStats.bimesters[i],
      taxaAprovacao: currentClassStats.bimesterApproval[i],
    }))
      .filter((d) => isNum(d.mediaGeral))
      .map((d) => ({ ...d, mediaGeral: d.mediaGeral as number, taxaAprovacao: isNum(d.taxaAprovacao) ? d.taxaAprovacao : undefined }));
  }, [currentClassStats]);

  // Comparativo entre turmas do recorte (só turmas com notas lançadas), da maior média para a menor.
  const classComparisonRows = useMemo(() => {
    const manySchools = new Set(scopedClasses.map((c) => (c as any).schoolUnitId)).size > 1;
    return scopedClasses
      .map((c) => ({
        cls: c,
        label: manySchools ? classLabelWithSchool(c, schoolUnits) : c.name,
        st: groupStats(studentsByClass.get(c.id) || [], histByStudent, selectedSubject),
      }))
      .sort((a, b) => (b.st.average ?? -1) - (a.st.average ?? -1));
  }, [scopedClasses, schoolUnits, studentsByClass, histByStudent, selectedSubject]);
  const classComparisonChart = useMemo(
    () =>
      classComparisonRows
        .filter((r) => isNum(r.st.average))
        .map((r) => ({ name: r.label, value: r.st.average as number })),
    [classComparisonRows]
  );

  // -------------------------------------------------------------
  // INDICADORES DO ALUNO
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const vals = studentBimonthlyChartData.map((d) => d.notaAluno);
    const delta = vals.length >= 2 ? Math.round((vals[vals.length - 1] - vals[0]) * 10) / 10 : null;
    const currentAverage = studentFinal(studentHistory, selectedSubject);
    const attendance = studentHistory && isNum(studentHistory.attendanceRate) && studentHistory.attendanceRate > 0 ? studentHistory.attendanceRate : null;
    return {
      delta,
      currentAverage,
      attendance,
      examsCount: studentSubmissions.length,
      isPositive: (delta ?? 0) >= 0,
    };
  }, [studentBimonthlyChartData, studentHistory, studentSubmissions, selectedSubject]);

  // Diagnóstico a partir das notas lançadas (disciplinas fortes e as que precisam de reforço).
  const diagnosis = useMemo(() => {
    const recs = studentSubjectPerformanceData;
    const strong = recs.filter((r) => r.nota >= 8).sort((a, b) => b.nota - a.nota).slice(0, 3);
    const weak = recs.filter((r) => r.nota < PASSING_GRADE).sort((a, b) => a.nota - b.nota);
    const list = (arr: typeof recs) => arr.map((r) => `${r.fullName} (${fmtGrade(r.nota)})`).join(', ');
    return {
      hasData: recs.length > 0,
      strengths: strong.length ? `Melhores resultados em ${list(strong)}.` : 'Nenhuma disciplina com média 8,0 ou mais até agora.',
      improve: weak.length
        ? `Abaixo da média ${fmtGrade(PASSING_GRADE)} em ${list(weak)}. Sugere-se recuperação paralela e acompanhamento.`
        : `Todas as disciplinas com média ${fmtGrade(PASSING_GRADE)} ou mais.`,
    };
  }, [studentSubjectPerformanceData]);

  // Available Datasets for Customizer Modal
  const availableChartDatasets: ChartDatasetOption[] = useMemo(() => {
    return [
      {
        id: 'student_bimonthly',
        title: `Curva de Evolução Bimestral — ${currentStudent?.name || 'Estudante'}`,
        subtitle: `Desempenho comparado à média da turma e meta escolar (${selectedSubject === 'ALL' ? 'Todas Disciplinas' : selectedSubject})`,
        data: studentBimonthlyChartData.map((d) => ({
          name: d.bimestre,
          value: d.notaAluno,
          secondaryValue: d.mediaTurma,
        })),
        valueLabel: 'Nota do Estudante',
        secondaryValueLabel: 'Média da Turma',
        unit: 'pts',
        defaultChartType: 'AREA',
        benchmarkValue: 6.0,
        benchmarkLabel: 'Meta Mínima (6.0)',
      },
      {
        id: 'student_subjects',
        title: `Desempenho por Disciplina — ${currentStudent?.name || 'Estudante'}`,
        subtitle: 'Média final e proficiência por componente curricular',
        data: studentSubjectPerformanceData.map((s) => ({
          name: s.subject,
          value: s.nota,
          secondaryValue: s.turma,
        })),
        valueLabel: 'Nota do Aluno',
        secondaryValueLabel: 'Média da Turma',
        unit: 'pts',
        defaultChartType: 'RADAR',
        benchmarkValue: 6.0,
        benchmarkLabel: 'Corte de Aprovação (6.0)',
      },
      {
        id: 'class_evolution',
        title: `Evolução Coletiva da Turma — ${currentClass?.name || 'Turma'}`,
        subtitle: "Média geral da turma (0 a 10) por bimestre, com as notas do Diário de Notas",
        data: classEvolutionData.map((c) => ({
          name: c.periodo,
          value: c.mediaGeral,
        })),
        valueLabel: 'Média Geral',
        unit: 'pts',
        defaultChartType: 'LINE',
        benchmarkValue: 6.0,
        benchmarkLabel: 'Meta Geral (6.0)',
      },
      {
        id: 'class_comparison',
        title: 'Matriz Comparativa de Médias entre Turmas',
        subtitle: 'Comparativo de média geral e taxa de aprovação das turmas cadastradas',
        data: classComparisonChart,
        valueLabel: 'Média Geral da Turma',
        secondaryValueLabel: 'Taxa de Aprovação (%)',
        unit: 'pts',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 6.0,
        benchmarkLabel: 'Média mínima (6,0)',
      },
    ];
  }, [
    currentStudent,
    currentClass,
    studentBimonthlyChartData,
    studentSubjectPerformanceData,
    classEvolutionData,
    classComparisonChart,
    selectedSubject,
  ]);

  const handlePrint = () => {
    setPrintTitle(printFileName('Evolucao Pedagogica', viewMode));
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Timbre padrão: aparece só na impressão */}
      <div className="hidden print:block">
        <DocumentLetterhead classId={selectedClassId !== 'ALL' ? selectedClassId : undefined} />
      </div>
      {/* Module Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (viewMode !== 'STUDENT') {
                setViewMode('STUDENT');
              } else if (onBack) {
                onBack();
              } else {
                onNavigate?.('MAIN_DASHBOARD');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title={viewMode !== 'STUDENT' ? 'Voltar para Visão por Estudante' : 'Voltar ao Painel Anterior'}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{viewMode !== 'STUDENT' ? 'Voltar (Por Estudante)' : onBack ? 'Voltar ao Painel' : 'Voltar ao Início'}</span>
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Voltar ao Painel Pedagógico Principal"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Painel Pedagógico</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 ml-1">
            <span>Pedagógico</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Evolução & Desempenho</span>
          </div>
        </div>

        {/* Sub-view switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setViewMode('STUDENT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'STUDENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Por Estudante</span>
          </button>
          <button
            onClick={() => setViewMode('CLASS')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'CLASS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Por Turma</span>
          </button>
          <button
            onClick={() => setViewMode('COMPARATIVE')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'COMPARATIVE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Matriz Comparativa</span>
          </button>
          <button
            onClick={() => setViewMode('BIMONTHLY_MULTIDISCIPLINARY')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'BIMONTHLY_MULTIDISCIPLINARY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Comparativo Multidisciplinar de Notas Bimestrais com Recharts"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Evolução Bimestral por Disciplina</span>
          </button>
        </div>
      </div>

      {/* Top Banner & Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Evolução Pedagógica & Matriz de Aprendizagem
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhamento longitudinal de desempenho, proficiência por componente e curva de evolução
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setChartCustomizerInitialDataset(
                viewMode === 'STUDENT' ? 'student_bimonthly' : viewMode === 'CLASS' ? 'class_evolution' : 'class_comparison'
              );
              setIsChartCustomizerOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Gerar Gráficos Personalizados</span>
          </button>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setViewMode('STUDENT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'STUDENT'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Por Estudante</span>
            </button>
            <button
              onClick={() => setViewMode('CLASS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'CLASS'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Por Turma</span>
            </button>
            <button
              onClick={() => setViewMode('COMPARATIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'COMPARATIVE'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Matriz Comparativa</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECORTE: escola, etapa/série e turno */}
      <ChartScopeBar
        scope={chartScope.scope}
        onChange={(next) => {
          chartScope.setScope(next);
          setSelectedClassId('ALL');
        }}
        classes={classes}
        schoolUnits={schoolUnits}
        appliesTo="turmas e gráficos"
        countText={`${scopedClasses.length} turma(s) no recorte`}
      />

      {/* FILTROS DINÂMICOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
          <Filter className="h-4 w-4 text-indigo-600" />
          <span>Filtros Pedagógicos & Segmentação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Turma */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Turma / Matriz:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const firstInClass = students.find((s) => e.target.value === 'ALL' || s.classId === e.target.value);
                if (firstInClass) setSelectedStudentId(firstInClass.id);
              }}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas as Turmas</option>
              {scopedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabelWithSchool(c, schoolUnits)} ({c.shift})
                </option>
              ))}
            </select>
          </div>

          {/* Estudante (When in Student Mode) */}
          {viewMode === 'STUDENT' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Estudante:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (RA: {s.enrollmentNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Disciplina */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Disciplina / Componente:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas as Disciplinas</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: VISÃO DO ESTUDANTE INDIVIDUAL */}
      {/* ========================================================= */}
      {viewMode === 'STUDENT' && currentStudent && (
        <div className="space-y-6">
          {/* Student Profile & Key Evolution Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Student Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg border border-indigo-200">
                    {currentStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{currentStudent.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">RA: {currentStudent.enrollmentNumber}</p>
                    <span
                      className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold ${
                        currentStudent.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentStudent.status === 'ACTIVE' ? 'Matrícula Ativa' : 'Matrícula não ativa'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Turma:</span>
                    <span className="font-semibold text-slate-800">
                      {classes.find((c) => c.id === currentStudent.classId)?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Responsável:</span>
                    <span className="font-semibold text-slate-800">{currentStudent.guardianName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={handlePrint}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir Boletim Evolutivo</span>
                </button>
              </div>
            </div>

            {/* Média Atual */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Média Geral Acumulada
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-slate-900">{fmtGrade(stats.currentAverage)}</span>
                <span className="text-xs text-slate-400 ml-1.5">/ 10,0</span>
              </div>
              {isNum(stats.currentAverage) ? (
                <div className={`flex items-center gap-1 text-xs font-bold ${stats.currentAverage >= PASSING_GRADE ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.currentAverage >= PASSING_GRADE ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{stats.currentAverage >= PASSING_GRADE ? 'Na média mínima (6,0) ou acima' : 'Abaixo da média mínima (6,0)'}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-semibold">Sem notas lançadas no Diário de Notas</div>
              )}
            </div>

            {/* Evolução Bimestral (Delta) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Crescimento Anual
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black ${
                    stats.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {stats.delta === null ? '—' : stats.delta >= 0 ? `+${fmtGrade(stats.delta)}` : fmtGrade(stats.delta)}
                </span>
                <span className="text-xs text-slate-500">{stats.delta === null ? 'precisa de 2 bimestres' : 'do 1º ao último bimestre lançado'}</span>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold ${
                  stats.isPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {stats.isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span>{stats.delta === null ? 'Aguardando notas' : stats.isPositive ? 'Evolução positiva ou estável' : 'Queda: avaliar reforço'}</span>
              </div>
            </div>

            {/* Frequência */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Taxa de Frequência
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-indigo-600">{stats.attendance === null ? '—' : `${stats.attendance}%`}</span>
                <span className="text-xs text-slate-400 ml-1.5">{stats.attendance === null ? 'sem registro no histórico' : 'presença'}</span>
              </div>
            </div>
          </div>

          {/* Gráfico 1: Linha do Tempo de Evolução Bimestral */}
          <div>
            <CustomizableChartCard
              title="Curva de Evolução Bimestral do Estudante vs. Média da Turma"
              subtitle={`Comparativo longitudinal de rendimento (${selectedSubject === 'ALL' ? 'Geral de todas as disciplinas' : selectedSubject})`}
              data={studentBimonthlyChartData.map((d) => ({
                name: d.bimestre,
                value: d.notaAluno,
                secondaryValue: d.mediaTurma,
              }))}
              valueLabel="Nota do Estudante"
              secondaryValueLabel="Média da Turma"
              unit="pts"
              defaultChartType="AREA"
              benchmarkValue={6.0}
              benchmarkLabel="Meta Mínima (6.0)"
              height={290}
              onOpenFullCustomizer={() => {
                setChartCustomizerInitialDataset('student_bimonthly');
                setIsChartCustomizerOpen(true);
              }}
            />
          </div>

          {/* Gráfico 2: Desempenho por Disciplina & Radar BNCC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            {/* Barras de Proficiência por Componente */}
            <div className="min-w-0">
              <CustomizableChartCard
                title="Desempenho por Componente Curricular"
                subtitle="Média final e proficiência por disciplina"
                data={studentSubjectPerformanceData.map((s) => ({
                  name: s.subject,
                  value: s.nota,
                  secondaryValue: s.turma,
                }))}
                valueLabel="Nota Aluno"
                secondaryValueLabel="Média Turma"
                unit="pts"
                defaultChartType="BAR_HORIZONTAL"
                benchmarkValue={6.0}
                benchmarkLabel="Corte (6.0)"
                height={260}
                onOpenFullCustomizer={() => {
                  setChartCustomizerInitialDataset('student_subjects');
                  setIsChartCustomizerOpen(true);
                }}
              />
            </div>

            {/* Parecer Pedagógico Diagnóstico e Intervenções */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between min-w-0">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Diagnóstico Pedagógico Individual
                </h4>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Pontos Fortes & Altas Habilidades:
                  </span>
                  <p className="leading-relaxed">{diagnosis.hasData ? diagnosis.strengths : 'Sem notas lançadas para este estudante.'}</p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Oportunidades de Melhoria:
                  </span>
                  <p className="leading-relaxed">{diagnosis.hasData ? diagnosis.improve : 'O diagnóstico aparece quando houver notas no Diário de Notas.'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Coordenação Pedagógica</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: VISÃO GERAL DA TURMA */}
      {/* ========================================================= */}
      {viewMode === 'CLASS' && (
        <div className="space-y-6">
          {/* Class Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                  Diagnóstico Coletivo da Turma
                </span>
                <h3 className="text-xl font-black mt-1">{currentClass.name}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Segmento: {currentClass.segment.replace('_', ' ')} • Turno: {currentClass.shift} • {currentClass.schoolYear}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="p-3 bg-white/10 rounded-xl text-center backdrop-blur-xs">
                  <span className="text-[10px] text-slate-300 block uppercase">Alunos na Turma</span>
                  <span className="text-xl font-black text-white">
                    {(studentsByClass.get(currentClass.id) || []).length}
                  </span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl text-center backdrop-blur-xs">
                  <span className="text-[10px] text-slate-300 block uppercase">Alunos com média ≥ 6,0</span>
                  <span className="text-xl font-black text-white">{isNum(currentClassStats?.approval) ? `${currentClassStats?.approval}%` : '—'}</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl text-center backdrop-blur-xs">
                  <span className="text-[10px] text-slate-300 block uppercase">Média Geral da Turma</span>
                  <span className="text-xl font-black text-emerald-400">{fmtGrade(currentClassStats?.average)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico da Evolução da Turma */}
          <div>
            <CustomizableChartCard
              title="Evolução da Média da Turma & Desempenho Bimestral"
              subtitle="Média geral da turma ao longo dos bimestres letivos"
              data={classEvolutionData.map((c) => ({
                name: c.periodo,
                value: c.mediaGeral,
              }))}
              valueLabel="Média Geral"
              unit="pts"
              defaultChartType="LINE"
              benchmarkValue={6.0}
              benchmarkLabel="Meta Geral (6.0)"
              height={300}
              onOpenFullCustomizer={() => {
                setChartCustomizerInitialDataset('class_evolution');
                setIsChartCustomizerOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: MATRIZ COMPARATIVA GERAL */}
      {/* ========================================================= */}
      {viewMode === 'COMPARATIVE' && (
        <div className="space-y-6">
          <div>
            <CustomizableChartCard
              title="Comparativo de Médias Gerais entre Turmas"
              subtitle={`Média geral (0 a 10) das turmas com notas lançadas: ${classComparisonChart.length} de ${scopedClasses.length}. A % de alunos com média ≥ 6,0 está na tabela abaixo.`}
              data={classComparisonChart}
              valueLabel="Média Geral"
              secondaryValueLabel="Taxa de Aprovação (%)"
              unit="pts"
              defaultChartType="BAR_VERTICAL"
              benchmarkValue={PASSING_GRADE}
              benchmarkLabel="Média mínima (6,0)"
              height={300}
              onOpenFullCustomizer={() => {
                setChartCustomizerInitialDataset('class_comparison');
                setIsChartCustomizerOpen(true);
              }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Matriz Comparativa de Turmas & Disciplinas
            </h4>
            <p className="text-xs text-slate-500">
              Médias por bimestre calculadas com as notas do Diário de Notas (e do histórico escolar, quando houver). "—" = sem nota lançada.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Turma</th>
                    <th className="p-3">Turno</th>
                    <th className="p-3 text-center">Nº Alunos</th>
                    <th className="p-3 text-center">Média 1º Bim</th>
                    <th className="p-3 text-center">Média 2º Bim</th>
                    <th className="p-3 text-center">Média 3º Bim</th>
                    <th className="p-3 text-center">Média 4º Bim</th>
                    <th className="p-3 text-center font-black text-indigo-700">Média Geral</th>
                    <th className="p-3 text-center">Média ≥ 6,0</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classComparisonRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400">Nenhuma turma no filtro selecionado.</td>
                    </tr>
                  )}
                  {classComparisonRows.map(({ cls: c, label, st }) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{label}</td>
                      <td className="p-3 text-slate-500">{c.shift}</td>
                      <td className="p-3 text-center font-semibold">{st.students}</td>
                      {st.bimesters.map((b, i) => (
                        <td key={i} className="p-3 text-center text-slate-700">{fmtGrade(b)}</td>
                      ))}
                      <td className="p-3 text-center font-bold text-indigo-700 bg-indigo-50/50">{fmtGrade(st.average)}</td>
                      <td className="p-3 text-center">
                        {isNum(st.approval) ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.approval >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st.approval}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">sem notas</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 4: EVOLUÇÃO BIMESTRAL COMPARATIVA MULTIDISCIPLINAR (RECHARTS) */}
      {/* ========================================================= */}
      {viewMode === 'BIMONTHLY_MULTIDISCIPLINARY' && (
        <div className="space-y-6">
          <BimonthlyAcademicEvolutionCard
            students={students}
            classes={classes}
            subjects={subjects}
            academicHistories={mergedHistories}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* Universal Customizable Chart Generator Modal */}
      <CustomizableChartModal
        isOpen={isChartCustomizerOpen}
        onClose={() => setIsChartCustomizerOpen(false)}
        reportTitle="Evolução Pedagógica & Matriz de Aprendizagem"
        datasets={availableChartDatasets}
        initialDatasetId={chartCustomizerInitialDataset}
      />
    </div>
  );
};
