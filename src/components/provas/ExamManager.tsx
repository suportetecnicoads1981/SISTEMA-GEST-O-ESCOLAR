import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  BarChart3,
  Edit2,
  Trash2,
  FileText,
  Users,
  Calendar,
  Sparkles,
  FileCheck,
  Printer,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  ArrowLeft,
  Home,
  ChevronRight,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import {
  Exam,
  Question,
  SchoolClass,
  Subject,
  ExamSubmission,
  SchoolSettings,
  Student,
  SchoolUnit,
} from '../../types';
import { ExamBuilderModal } from './ExamBuilderModal';
import { ExamAnswerKeyModal } from './ExamAnswerKeyModal';
import { PaperAnswersModal } from './PaperAnswersModal';
import { classLabelWithSchool } from '../../utils/schoolDataNormalizer';
import { confirmDialog } from '../../utils/dialogs';

interface ExamManagerProps {
  exams: Exam[];
  questions: Question[];
  classes: SchoolClass[];
  subjects: Subject[];
  submissions: ExamSubmission[];
  settings: SchoolSettings;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onTakeExamAsStudent: (examId: string) => void;
  onViewReport: (examId: string) => void;
  initialSelectedQuestionIds?: string[];
  onBatchImportExams?: (exams: Exam[]) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
  /** Alunos (para lançar as respostas da prova de papel). */
  students?: Student[];
  /** Grava as correções lançadas (substitui as do mesmo aluno na prova). */
  onSavePaperSubmissions?: (examId: string, upserts: ExamSubmission[], removeStudentIds: string[]) => void;
  /** Escolas: para mostrar o nome da escola junto da turma. */
  schoolUnits?: SchoolUnit[];
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  questions,
  classes,
  subjects,
  submissions,
  settings,
  onSaveExam,
  onDeleteExam,
  onTakeExamAsStudent,
  onViewReport,
  initialSelectedQuestionIds,
  onBatchImportExams,
  onBack,
  onNavigate,
  students = [],
  onSavePaperSubmissions,
  schoolUnits = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [selectedExamForAnswerKey, setSelectedExamForAnswerKey] = useState<Exam | null>(null);
  const [examForPaperAnswers, setExamForPaperAnswers] = useState<Exam | null>(null);

  // Auto open builder if initial questions were passed from Question Bank
  useEffect(() => {
    if (initialSelectedQuestionIds && initialSelectedQuestionIds.length > 0) {
      setExamToEdit(null);
      setIsBuilderOpen(true);
    }
  }, [initialSelectedQuestionIds]);

  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, classLabelWithSchool(c, schoolUnits)])),
    [classes, schoolUnits]
  );

  const filteredExams = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return exams.filter((exam) => {
      if (!exam) return false;
      const matchSearch =
        !q ||
        (exam.title && exam.title.toLowerCase().includes(q)) ||
        (exam.subject && exam.subject.toLowerCase().includes(q)) ||
        (exam.teacherName && exam.teacherName.toLowerCase().includes(q));

      const matchClass =
        selectedClassFilter === 'ALL' || exam.classId === selectedClassFilter;

      return Boolean(matchSearch && matchClass);
    });
  }, [exams, searchTerm, selectedClassFilter]);

  const handleOpenAdd = () => {
    setExamToEdit(null);
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setExamToEdit(exam);
    setIsBuilderOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Título da Prova', 'Disciplina', 'Turma', 'Professor', 'Questões', 'Valor Total', 'Tempo (min)', 'Data Limite'];
    const rows = filteredExams.map((e) => [
      `"${e.title}"`,
      `"${e.subject}"`,
      `"${classMap.get(e.classId) || e.classId}"`,
      `"${e.teacherName}"`,
      e.questions?.length ?? (e as any).questionIds?.length ?? 0,
      e.totalPoints ?? (e as any).totalScore ?? 10,
      e.timeLimitMinutes || 45,
      `"${e.dueDateTime || (e as any).deadline || 'Sem prazo'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relacao_avaliacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    try {
      let imported: Exam[] = [];
      const trimmed = importText.trim();
      if (!trimmed) {
        setImportFeedback('Insira dados no formato JSON ou CSV.');
        return;
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        imported = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        const defaultClassId = classes[0]?.id || 'TURMA-3A';
        const defaultQuestionIds = questions.slice(0, 5).map((q) => q.id);

        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('título')) return;
          const parts = line.includes(';') ? line.split(';') : line.split(',');
          const title = parts[0]?.replace(/"/g, '').trim() || `Avaliação ${idx + 1}`;
          const subject = parts[1]?.replace(/"/g, '').trim() || 'Matemática';
          const teacher = parts[2]?.replace(/"/g, '').trim() || 'Prof. Coordenador';

          imported.push({
            id: `exam-imp-${Date.now()}-${idx}`,
            title,
            description: `Avaliação importada para a disciplina de ${subject}`,
            subject,
            classId: defaultClassId,
            teacherName: teacher,
            schoolYear: new Date().getFullYear(),
            term: '1º Bimestre',
            totalPoints: 10,
            passingScore: 6.0,
            timeLimitMinutes: 60,
            randomizeQuestions: true,
            randomizeOptions: true,
            questions: defaultQuestionIds.map((qid, qIdx) => ({
              questionId: qid,
              points: 2,
              customOrder: qIdx + 1,
            })),
            status: 'PUBLISHED',
            autoCorrectionRules: {
              partialCreditForKeywords: true,
              caseSensitive: false,
              negativeMarking: false,
              penaltyPerWrongOption: 0,
              allowReviewAfterSubmission: true,
              showExplanationInstantly: false,
            },
            scheduledDate: new Date().toISOString().split('T')[0],
            dueDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          });
        });
      }

      if (imported.length > 0) {
        if (onBatchImportExams) {
          onBatchImportExams(imported);
        } else {
          imported.forEach((ex) => onSaveExam(ex));
        }
        setImportFeedback(`Sucesso! ${imported.length} avaliações cadastradas.`);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportFeedback(null);
          setImportText('');
        }, 1200);
      }
    } catch (e: any) {
      setImportFeedback(`Erro no processamento: ${e.message}`);
    }
  };

  const handleOpenAnswerKey = (exam: Exam) => {
    setSelectedExamForAnswerKey(exam);
  };

  return (
    <div className="space-y-4">
      {/* Module Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Gerador & Gestão de Provas</span>
          </div>
        </div>

        {/* Quick Module Navigation Tabs */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onNavigate('EXAMS')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Provas ({exams.length})</span>
            </button>
            <button
              onClick={() => onNavigate('QUESTION_BANK')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>Banco de Questões</span>
            </button>
            <button
              onClick={() => onNavigate('STUDENT_ROOM')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
              <span>Sala de Provas</span>
            </button>
            <button
              onClick={() => onNavigate('PEDAGOGICAL_DASHBOARD')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Pedagógico</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            Controle de Avaliações, Cadernos & Gabaritos Oficiais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie provas personalizadas com cronômetro, pesos por questão, impressão de cartões resposta e espelho de correção do professor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Relatório Geral de Avaliações e Médias"
          >
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Gerar Relatório</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Imprimir Calendário & Relação de Avaliações"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Imprimir Relação</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Importar Provas</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Nova Avaliação</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Provas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{exams.length}</p>
          <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Com gabaritos integrados</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submissões Corrigidas</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{submissions.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Correção automatizada</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tempo Médio Configurado</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">45 min</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Cronômetro ativo</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Diagnóstico de Erros</p>
          <p className="text-2xl font-black text-slate-900 mt-1">100%</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Detecção de distratores</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título da prova, disciplina ou professor..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="ALL">Todas as Turmas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {classLabelWithSchool(cls, schoolUnits)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredExams.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Nenhuma avaliação encontrada para os critérios selecionados.
          </div>
        ) : (
          filteredExams.map((exam) => {
            const examSubmissions = submissions.filter((s) => s.examId === exam.id);
            const avgScore =
              examSubmissions.length > 0
                ? Number(
                    (
                      examSubmissions.reduce((a, b) => a + b.totalScore, 0) /
                      examSubmissions.length
                    ).toFixed(1)
                  )
                : null;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                          {exam.term} • {exam.subject}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {classMap.get(exam.classId) || 'Todas as turmas'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(exam)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Editar Configurações"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDialog(`Deseja excluir a prova "${exam.title}"?`)) {
                            onDeleteExam(exam.id);
                          }
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Excluir Prova"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{exam.description}</p>

                  {/* Badges and Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Duração:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-indigo-600" />
                        {exam.timeLimitMinutes} min
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Questões:</span>
                      <span className="font-bold text-slate-800">{exam.questions.length} itens</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Pontuação:</span>
                      <span className="font-bold text-indigo-700">{exam.totalPoints} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Média da Turma:</span>
                      <span className="font-bold text-emerald-700">
                        {avgScore !== null ? `${avgScore} pts` : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {/* Auto-correction features list */}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Correção Instantânea
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users className="h-3.5 w-3.5" />
                      {examSubmissions.length} entregas realizadas
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenAnswerKey(exam)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Abrir Caderno de Questões, Cartão Resposta e Gabarito do Professor"
                    >
                      <FileCheck className="h-4 w-4 text-amber-700" />
                      <span>Caderno & Gabarito</span>
                    </button>

                    {onSavePaperSubmissions && (
                      <button
                        onClick={() => setExamForPaperAnswers(exam)}
                        className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Digitar as respostas marcadas pelos alunos na prova de papel e corrigir"
                      >
                        <ClipboardList className="h-4 w-4 text-emerald-700" />
                        <span>Lançar respostas</span>
                      </button>
                    )}

                    <button
                      onClick={() => onViewReport(exam.id)}
                      className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Relatório & Erros</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onTakeExamAsStudent(exam.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>Simular Aluno</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Relatório de Avaliações Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Relatório Consolidado de Avaliações & Desempenho
                  </h2>
                  <p className="text-xs text-slate-500">Métricas pedagógicas, volume de respostas e médias</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total de Provas</span>
                  <p className="text-2xl font-black text-slate-900">{exams.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Submissões Realizadas</span>
                  <p className="text-2xl font-black text-emerald-700">{submissions.length}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700">Turmas Atendidas</span>
                  <p className="text-2xl font-black text-indigo-700">
                    {new Set(exams.map((e) => e.classId)).size}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Quadro Sintético de Avaliações</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Título</th>
                        <th className="p-2.5">Disciplina</th>
                        <th className="p-2.5">Turma</th>
                        <th className="p-2.5 text-center">Questões</th>
                        <th className="p-2.5 text-center">Valor</th>
                        <th className="p-2.5 text-center">Respostas</th>
                        <th className="p-2.5 text-center">Média</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exams.map((ex) => {
                        const examSubs = submissions.filter((s) => s.examId === ex.id);
                        const avg =
                          examSubs.length > 0
                            ? (examSubs.reduce((a, b) => a + b.totalScore, 0) / examSubs.length).toFixed(1)
                            : '-';

                        return (
                          <tr key={ex.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">{ex.title}</td>
                            <td className="p-2.5">{ex.subject}</td>
                            <td className="p-2.5">{classMap.get(ex.classId) || ex.classId}</td>
                            <td className="p-2.5 text-center">{ex.questionIds.length}</td>
                            <td className="p-2.5 text-center">{ex.totalScore} pts</td>
                            <td className="p-2.5 text-center font-bold text-indigo-600">{examSubs.length}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-600">{avg}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão de Relação de Provas */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Impressão de Calendário & Relação de Avaliações
                  </h2>
                  <p className="text-xs text-slate-500">Documento oficial da coordenação pedagógica</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between no-print text-xs">
              <p className="text-indigo-900 font-semibold">Total de {filteredExams.length} avaliações listadas</p>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Calendário (Ctrl+P / PDF)</span>
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto bg-white text-slate-900 font-serif leading-relaxed text-sm space-y-4">
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <h1 className="text-base font-bold uppercase tracking-wider font-sans">
                  COORDENAÇÃO PEDAGÓGICA • CALENDÁRIO GERAL DE AVALIAÇÕES
                </h1>
                <p className="text-xs text-slate-600 font-sans">
                  CRONOGRAMA DE PROVAS, TRABALHOS E SIMULADOS • ANO LETIVO 2026
                </p>
                <div className="pt-2 text-xs font-sans flex justify-between border-t border-slate-200 mt-2 text-slate-700">
                  <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>Escola: Unidade Sede Central</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900">
                    <th className="py-2">Título da Prova</th>
                    <th className="py-2">Disciplina</th>
                    <th className="py-2">Turma</th>
                    <th className="py-2">Professor(a)</th>
                    <th className="py-2 text-center">Nº Questões</th>
                    <th className="py-2 text-center">Valor</th>
                    <th className="py-2 text-center">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredExams.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 font-bold">{e.title}</td>
                      <td className="py-2">{e.subject}</td>
                      <td className="py-2">{classMap.get(e.classId) || e.classId}</td>
                      <td className="py-2">{e.teacherName}</td>
                      <td className="py-2 text-center font-mono">{e.questionIds.length}</td>
                      <td className="py-2 text-center font-bold">{e.totalScore} pts</td>
                      <td className="py-2 text-center">{e.timeLimitMinutes || 45} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Provas */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Importação de Avaliações</h2>
                  <p className="text-xs text-slate-500">Cole dados no formato CSV (Título; Disciplina; Professor) ou JSON</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {importFeedback && (
                <div
                  className={`p-3 rounded-xl font-medium ${
                    importFeedback.includes('Sucesso')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importFeedback}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dados de Avaliações (linha CSV ou JSON):
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Exemplo CSV:\nAvaliação Mensal de Matemática; Matemática; Prof. Ricardo Souza\nSimulado ENEM 1º Semestre; Física; Prof. Felipe Martins\nProva Bimestral de História; História; Profa. Camila Duarte`}
                  className="w-full h-44 p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessImport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Cadastrar Avaliações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Builder Modal */}
      <ExamBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={(e) => {
          onSaveExam(e);
          setIsBuilderOpen(false);
        }}
        examToEdit={examToEdit}
        questions={questions}
        classes={classes}
        subjects={subjects}
        initialQuestionIds={initialSelectedQuestionIds}
        schoolUnits={schoolUnits}
      />

      {examForPaperAnswers && onSavePaperSubmissions && (
        <PaperAnswersModal
          exam={examForPaperAnswers}
          questions={questions}
          classes={classes}
          students={students}
          submissions={submissions}
          onSave={onSavePaperSubmissions}
          onClose={() => setExamForPaperAnswers(null)}
          schoolUnits={schoolUnits}
        />
      )}

      {/* Exam Answer Key & Printable Sheets Modal */}
      {selectedExamForAnswerKey && (
        <ExamAnswerKeyModal
          isOpen={!!selectedExamForAnswerKey}
          onClose={() => setSelectedExamForAnswerKey(null)}
          exam={selectedExamForAnswerKey}
          questions={questions}
          schoolClass={classes.find((c) => c.id === selectedExamForAnswerKey.classId)}
          settings={settings}
        />
      )}
    </div>
  );
};
