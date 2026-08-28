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
} from 'lucide-react';
import {
  Exam,
  Question,
  SchoolClass,
  Subject,
  ExamSubmission,
  SchoolSettings,
} from '../../types';
import { ExamBuilderModal } from './ExamBuilderModal';
import { ExamAnswerKeyModal } from './ExamAnswerKeyModal';

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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [selectedExamForAnswerKey, setSelectedExamForAnswerKey] = useState<Exam | null>(null);

  // Auto open builder if initial questions were passed from Question Bank
  useEffect(() => {
    if (initialSelectedQuestionIds && initialSelectedQuestionIds.length > 0) {
      setExamToEdit(null);
      setIsBuilderOpen(true);
    }
  }, [initialSelectedQuestionIds]);

  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes]
  );

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchSearch =
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClass =
        selectedClassFilter === 'ALL' || exam.classId === selectedClassFilter;

      return matchSearch && matchClass;
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

  const handleOpenAnswerKey = (exam: Exam) => {
    setSelectedExamForAnswerKey(exam);
  };

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
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
                  {cls.name}
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
                        onClick={() => {
                          if (window.confirm(`Deseja excluir a prova "${exam.title}"?`)) {
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAnswerKey(exam)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Abrir Caderno de Questões, Cartão Resposta e Gabarito do Professor"
                    >
                      <FileCheck className="h-4 w-4 text-amber-700" />
                      <span>Caderno & Gabarito</span>
                    </button>

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
      />

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
