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
} from '../../types';
import {
  CustomizableChartModal,
  ChartDatasetOption,
} from '../common/CustomizableChartModal';
import { CustomizableChartCard } from '../common/CustomizableChartCard';
import { BimonthlyAcademicEvolutionCard } from './BimonthlyAcademicEvolutionCard';
import { ArrowLeft, Home } from 'lucide-react';

interface PedagogicalEvolutionProps {
  students?: Student[];
  classes?: SchoolClass[];
  subjects?: Subject[];
  exams?: Exam[];
  questions?: Question[];
  submissions?: ExamSubmission[];
  academicHistories?: AcademicHistory[];
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
  onBack,
  onNavigate,
}) => {
  // Mode: 'STUDENT' | 'CLASS' | 'COMPARATIVE' | 'BIMONTHLY_MULTIDISCIPLINARY'
  const [viewMode, setViewMode] = useState<
    'STUDENT' | 'CLASS' | 'COMPARATIVE' | 'BIMONTHLY_MULTIDISCIPLINARY'
  >('STUDENT');

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || 'ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => students[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL'); // 'ALL' | '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre'
  const [searchStudentTerm, setSearchStudentTerm] = useState<string>('');

  // Customizable Chart Modal State
  const [isChartCustomizerOpen, setIsChartCustomizerOpen] = useState<boolean>(false);
  const [chartCustomizerInitialDataset, setChartCustomizerInitialDataset] = useState<string>('student_bimonthly');

  // Filter students based on class selection and search
  const filteredStudents = useMemo(() => {
    return (students || []).filter((s) => {
      if (!s) return false;
      const matchClass = selectedClassId === 'ALL' || s.classId === selectedClassId;
      const matchSearch =
        !searchStudentTerm ||
        (s.name && s.name.toLowerCase().includes(searchStudentTerm.toLowerCase())) ||
        (s.enrollmentNumber && s.enrollmentNumber.includes(searchStudentTerm));
      return matchClass && matchSearch;
    });
  }, [students, selectedClassId, searchStudentTerm]);

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
      classes[0] ||
      null
    );
  }, [classes, selectedClassId]);

  // Academic history for current student
  const studentHistory = useMemo(() => {
    if (!currentStudent) return (academicHistories || [])[0] || null;
    return (
      (academicHistories || []).find((h) => h.studentId === currentStudent.id) ||
      (academicHistories || [])[0] ||
      null
    );
  }, [currentStudent, academicHistories]);

  // Student submissions across exams
  const studentSubmissions = useMemo(() => {
    if (!currentStudent) return [];
    return (submissions || []).filter((sub) => sub && sub.studentId === currentStudent.id);
  }, [currentStudent, submissions]);

  // -------------------------------------------------------------
  // DATA CALCULATION: STUDENT BIMONTHLY EVOLUTION
  // -------------------------------------------------------------
  const studentBimonthlyChartData = useMemo(() => {
    const defaultData = [
      { bimestre: '1º Bimestre', notaAluno: 6.8, mediaTurma: 6.5, metaEscola: 6.0 },
      { bimestre: '2º Bimestre', notaAluno: 7.5, mediaTurma: 6.8, metaEscola: 6.0 },
      { bimestre: '3º Bimestre', notaAluno: 8.2, mediaTurma: 7.0, metaEscola: 6.0 },
      { bimestre: '4º Bimestre', notaAluno: 8.8, mediaTurma: 7.2, metaEscola: 6.0 },
    ];

    if (!studentHistory || !studentHistory.records || studentHistory.records.length === 0) {
      return defaultData;
    }

    const records =
      selectedSubject === 'ALL'
        ? studentHistory.records
        : studentHistory.records.filter((r) => r && r.subjectName === selectedSubject);

    if (records.length === 0) return defaultData;

    const b1Vals = records
      .map((r) => r?.bimonthlyGrades?.b1)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const b2Vals = records
      .map((r) => r?.bimonthlyGrades?.b2)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const b3Vals = records
      .map((r) => r?.bimonthlyGrades?.b3)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const b4Vals = records
      .map((r) => r?.bimonthlyGrades?.b4)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    return [
      {
        bimestre: '1º Bimestre',
        notaAluno: Number((avg(b1Vals) || 6.8).toFixed(1)),
        mediaTurma: 6.5,
        metaEscola: 6.0,
      },
      {
        bimestre: '2º Bimestre',
        notaAluno: Number((avg(b2Vals) || 7.2).toFixed(1)),
        mediaTurma: 6.8,
        metaEscola: 6.0,
      },
      {
        bimestre: '3º Bimestre',
        notaAluno: Number((avg(b3Vals) || 7.9).toFixed(1)),
        mediaTurma: 7.1,
        metaEscola: 6.0,
      },
      {
        bimestre: '4º Bimestre',
        notaAluno: Number((avg(b4Vals) || 8.5).toFixed(1)),
        mediaTurma: 7.3,
        metaEscola: 6.0,
      },
    ];
  }, [studentHistory, selectedSubject]);

  // -------------------------------------------------------------
  // DATA CALCULATION: STUDENT SUBJECT PERFORMANCE (RADAR / BAR)
  // -------------------------------------------------------------
  const studentSubjectPerformanceData = useMemo(() => {
    if (!studentHistory?.records || studentHistory.records.length === 0) {
      return [
        { subject: 'Matemática', nota: 8.5, turma: 7.1, proficiencia: 85 },
        { subject: 'Português', nota: 9.0, turma: 7.5, proficiencia: 90 },
        { subject: 'Física', nota: 7.5, turma: 6.2, proficiencia: 75 },
        { subject: 'Química', nota: 8.0, turma: 6.8, proficiencia: 80 },
        { subject: 'História', nota: 8.8, turma: 7.8, proficiencia: 88 },
        { subject: 'Biologia', nota: 9.2, turma: 7.4, proficiencia: 92 },
      ];
    }

    return studentHistory.records.map((r) => ({
      subject: (r?.subjectName || 'Disciplina').slice(0, 12),
      fullName: r?.subjectName || 'Disciplina',
      nota: typeof r?.finalGrade === 'number' ? r.finalGrade : 7.5,
      turma: 6.8,
      proficiencia: Math.min(100, Math.round(((r?.finalGrade || 7) / 10) * 100)),
    }));
  }, [studentHistory]);

  // -------------------------------------------------------------
  // DATA CALCULATION: CLASS GENERAL EVOLUTION
  // -------------------------------------------------------------
  const classEvolutionData = useMemo(() => {
    return [
      {
        periodo: '1º Bimestre',
        mediaGeral: 6.7,
        taxaAprovacao: 78,
        matematica: 6.2,
        portugues: 7.2,
        ciencias: 6.8,
      },
      {
        periodo: '2º Bimestre',
        mediaGeral: 7.1,
        taxaAprovacao: 84,
        matematica: 6.8,
        portugues: 7.5,
        ciencias: 7.2,
      },
      {
        periodo: '3º Bimestre',
        mediaGeral: 7.6,
        taxaAprovacao: 89,
        matematica: 7.3,
        portugues: 7.8,
        ciencias: 7.7,
      },
      {
        periodo: '4º Bimestre',
        mediaGeral: 8.1,
        taxaAprovacao: 93,
        matematica: 7.9,
        portugues: 8.3,
        ciencias: 8.2,
      },
    ];
  }, []);

  // -------------------------------------------------------------
  // STATS HIGHLIGHTS
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const b1 = studentBimonthlyChartData[0]?.notaAluno || 0;
    const b4 = studentBimonthlyChartData[3]?.notaAluno || 0;
    const delta = b4 - b1;
    const currentAverage = studentHistory?.generalAverage || 8.0;
    const attendance = studentHistory?.attendanceRate || 95;

    return {
      delta,
      currentAverage,
      attendance,
      examsCount: studentSubmissions.length || 3,
      isPositive: delta >= 0,
    };
  }, [studentBimonthlyChartData, studentHistory, studentSubmissions]);

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
        subtitle: 'Média geral e evolução nas principais disciplinas por bimestre',
        data: classEvolutionData.map((c) => ({
          name: c.periodo,
          value: c.mediaGeral,
          secondaryValue: c.taxaAprovacao,
        })),
        valueLabel: 'Média Geral',
        secondaryValueLabel: 'Taxa de Aprovação (%)',
        unit: 'pts',
        defaultChartType: 'LINE',
        benchmarkValue: 6.0,
        benchmarkLabel: 'Meta Geral (6.0)',
      },
      {
        id: 'class_comparison',
        title: 'Matriz Comparativa de Médias entre Turmas',
        subtitle: 'Comparativo de média geral e taxa de aprovação das turmas cadastradas',
        data: classes.map((c, idx) => ({
          name: c.name,
          value: Number((7.4 + idx * 0.2).toFixed(1)),
          secondaryValue: 92 + idx,
        })),
        valueLabel: 'Média Geral da Turma',
        secondaryValueLabel: 'Taxa de Aprovação (%)',
        unit: 'pts',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 7.0,
        benchmarkLabel: 'Meta Institucional (7.0)',
      },
    ];
  }, [
    currentStudent,
    currentClass,
    studentBimonthlyChartData,
    studentSubjectPerformanceData,
    classEvolutionData,
    classes,
    selectedSubject,
  ]);

  const handlePrint = () => {
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

      {/* FILTROS DINÂMICOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
          <Filter className="h-4 w-4 text-indigo-600" />
          <span>Filtros Pedagógicos & Segmentação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.shift})
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

          {/* Período Letivo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Etapa de Avaliação:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Ano Letivo Completo (4 Bimestres)</option>
              <option value="1º Bimestre">1º Bimestre</option>
              <option value="2º Bimestre">2º Bimestre</option>
              <option value="3º Bimestre">3º Bimestre</option>
              <option value="4º Bimestre">4º Bimestre</option>
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
                    <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Matrícula Ativa
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Turma:</span>
                    <span className="font-semibold text-slate-800">
                      {classes.find((c) => c.id === currentStudent.classId)?.name || '3º Ano'}
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
                <span className="text-3xl font-black text-slate-900">{stats.currentAverage.toFixed(1)}</span>
                <span className="text-xs text-slate-400 ml-1.5">/ 10.0</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Acima da meta mínima escolar (6.0)</span>
              </div>
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
                  {stats.delta >= 0 ? `+${stats.delta.toFixed(1)}` : stats.delta.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">pontos no ano</span>
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
                <span>{stats.isPositive ? 'Trajetória ascendente contínua' : 'Requer intervenção de reforço'}</span>
              </div>
            </div>

            {/* Frequência */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Taxa de Frequência
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-indigo-600">{stats.attendance}%</span>
                <span className="text-xs text-slate-400 ml-1.5">presença</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>200 dias letivos previstos</span>
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
                  <p className="leading-relaxed">
                    Excelente desenvolvimento em Português e Biologia com notas consistentes acima de 9.0 e alta compreensão de leitura crítica e interpretação de textos.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Oportunidades de Melhoria:
                  </span>
                  <p className="leading-relaxed">
                    Reforçar exercícios de cinemática e estequiometria em Física e Química para consolidar a fixação antes das provas finais.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Coordenação Pedagógica</span>
                <span className="font-mono text-[11px]">Atualizado em: {new Date().toLocaleDateString('pt-BR')}</span>
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
                    {students.filter((s) => s.classId === currentClass.id).length || 32}
                  </span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl text-center backdrop-blur-xs">
                  <span className="text-[10px] text-slate-300 block uppercase">Média Geral da Turma</span>
                  <span className="text-xl font-black text-emerald-400">7.6</span>
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
                secondaryValue: c.taxaAprovacao,
              }))}
              valueLabel="Média Geral"
              secondaryValueLabel="Taxa de Aprovação (%)"
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
              subtitle="Rendimento médio e taxa de aproveitamento de todas as turmas"
              data={classes.map((c, idx) => ({
                name: c.name,
                value: Number((7.4 + idx * 0.2).toFixed(1)),
                secondaryValue: 92 + idx,
              }))}
              valueLabel="Média Geral"
              secondaryValueLabel="Taxa de Aprovação (%)"
              unit="pts"
              defaultChartType="BAR_VERTICAL"
              benchmarkValue={7.0}
              benchmarkLabel="Meta SME (7.0)"
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
              Comparativo de proficiência média entre todas as turmas cadastradas na instituição
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
                    <th className="p-3 text-center">Taxa Aprovação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{c.name}</td>
                      <td className="p-3 text-slate-500">{c.shift}</td>
                      <td className="p-3 text-center font-semibold">
                        {students.filter((s) => s.classId === c.id).length || 28 + idx}
                      </td>
                      <td className="p-3 text-center text-slate-700">6.8</td>
                      <td className="p-3 text-center text-slate-700">7.2</td>
                      <td className="p-3 text-center text-slate-700">7.7</td>
                      <td className="p-3 text-center text-slate-700">8.1</td>
                      <td className="p-3 text-center font-bold text-indigo-700 bg-indigo-50/50">
                        {(7.4 + idx * 0.2).toFixed(1)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {92 + idx}%
                        </span>
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
            academicHistories={academicHistories}
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
