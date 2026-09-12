import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CheckSquare,
  Square,
  ListPlus,
  Layers,
  Award,
  X,
  Printer,
  BarChart3,
  FileSpreadsheet,
  FileText,
  ArrowLeft,
  Home,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Question, Subject } from '../../types';
import { QuestionModal } from './QuestionModal';
import { QuestionImportModal } from './QuestionImportModal';
import { triggerPrint } from '../../utils/printHelper';

interface QuestionBankProps {
  questions: Question[];
  subjects: Subject[];
  onSaveQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onBatchImport: (questions: Question[]) => void;
  onCreateExamWithQuestions?: (questionIds: string[]) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  subjects,
  onSaveQuestion,
  onDeleteQuestion,
  onBatchImport,
  onCreateExamWithQuestions,
  onBack,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printIncludeAnswers, setPrintIncludeAnswers] = useState(true);
  const [printIncludeDistractors, setPrintIncludeDistractors] = useState(true);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);

  const subjectNames = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.name))),
    [subjects]
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        q.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.bnccSkill && q.bnccSkill.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSubject = subjectFilter === 'ALL' || q.subject === subjectFilter;
      const matchDiff = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
      const matchType = typeFilter === 'ALL' || q.type === typeFilter;

      return matchSearch && matchSubject && matchDiff && matchType;
    });
  }, [questions, searchTerm, subjectFilter, difficultyFilter, typeFilter]);

  const handleOpenAdd = () => {
    setQuestionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setQuestionToEdit(q);
    setIsModalOpen(true);
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map((q) => q.id));
    }
  };

  const handleExportJSON = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? questions.filter((q) => selectedQuestionIds.includes(q.id))
      : filteredQuestions;

    const blob = new Blob([JSON.stringify(listToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banco_questoes_${selectedOnly ? 'selecionadas_' : ''}${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? questions.filter((q) => selectedQuestionIds.includes(q.id))
      : filteredQuestions;

    const headers = ['Código', 'Disciplina', 'Tópico', 'Dificuldade', 'Tipo', 'BNCC', 'Enunciado', 'Gabarito', 'Tags'];
    const rows = listToExport.map((q) => {
      const gabarito = q.type === 'ESSAY_KEYWORD'
        ? q.essayKeywords?.join('; ') || ''
        : q.options?.find((o) => o.isCorrect)?.text || '';

      return [
        `"${q.code}"`,
        `"${q.subject}"`,
        `"${q.topic}"`,
        q.difficulty,
        q.type,
        `"${q.bnccSkill || ''}"`,
        `"${q.stem.replace(/"/g, '""')}"`,
        `"${gabarito.replace(/"/g, '""')}"`,
        `"${q.tags.join(', ')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `banco_questoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchDeleteSelected = () => {
    if (
      window.confirm(
        `Deseja realmente excluir as ${selectedQuestionIds.length} questões selecionadas do banco?`
      )
    ) {
      selectedQuestionIds.forEach((id) => onDeleteQuestion(id));
      setSelectedQuestionIds([]);
    }
  };

  const handleCreateExamWithSelected = () => {
    if (selectedQuestionIds.length === 0) return;
    if (onCreateExamWithQuestions) {
      onCreateExamWithQuestions(selectedQuestionIds);
    }
  };

  const handlePrintExamPaper = () => {
    const printContainer = document.getElementById('printable-question-bank-paper');
    if (printContainer) {
      triggerPrint(printContainer, {
        title: 'Caderno de Questões BNCC - SucessoEdu',
        documentCategory: 'Banco Oficial de Questões e Avaliações',
      });
    } else {
      triggerPrint(null, {
        title: 'Caderno de Questões BNCC - SucessoEdu',
      });
    }
  };

  // Grouping stats for report
  const subjectStats = useMemo(() => {
    const counts: Record<string, { total: number; easy: number; medium: number; hard: number; bncc: number }> = {};
    questions.forEach((q) => {
      if (!counts[q.subject]) {
        counts[q.subject] = { total: 0, easy: 0, medium: 0, hard: 0, bncc: 0 };
      }
      counts[q.subject].total += 1;
      if (q.difficulty === 'FACIL') counts[q.subject].easy += 1;
      if (q.difficulty === 'MEDIO') counts[q.subject].medium += 1;
      if (q.difficulty === 'DIFICIL') counts[q.subject].hard += 1;
      if (q.bnccSkill) counts[q.subject].bncc += 1;
    });
    return counts;
  }, [questions]);

  const questionsToPrint = useMemo(() => {
    return selectedQuestionIds.length > 0
      ? questions.filter((q) => selectedQuestionIds.includes(q.id))
      : filteredQuestions;
  }, [questions, selectedQuestionIds, filteredQuestions]);

  return (
    <div className="space-y-4 pb-12">
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
            <span className="font-bold text-slate-800">Banco de Questões</span>
          </div>
        </div>

        {/* Quick Module Navigation Tabs */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onNavigate('QUESTION_BANK')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Banco ({questions.length})</span>
            </button>
            <button
              onClick={() => onNavigate('EXAMS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Gerador de Provas</span>
            </button>
            <button
              onClick={() => onNavigate('STUDENT_ROOM')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
              <span>Sala do Estudante</span>
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
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            Banco Central de Questões & Itens BNCC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acervo categorizado de questões com distratores mapeados, habilidades da BNCC e relatórios psicométricos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Gerar Relatório Estatístico do Banco"
          >
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Gerar Relatório</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Imprimir Caderno de Questões / Gabarito"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Imprimir Caderno</span>
          </button>
          <button
            onClick={() => handleExportCSV(false)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Exportar dados do Banco em planilha CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExportJSON(false)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Exportar JSON para backup ou compartilhamento"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Importar Banco</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Questão</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Questões</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{questions.length}</p>
          <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Prontas para provas</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Objetivas (Múltipla Escolha)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Correção imediata</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Discursivas (Palavras-Chave)</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {questions.filter((q) => q.type === 'ESSAY_KEYWORD').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Critérios ponderados</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alinhamento BNCC</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {questions.filter((q) => q.bnccSkill).length}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Habilidades catalogadas</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por enunciado, tópico, código, tag ou habilidade BNCC..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="ALL">Todas as Disciplinas</option>
              {subjectNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="ALL">Todas as Dificuldades</option>
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>

            {/* Question Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
              <option value="TRUE_FALSE">Verdadeiro ou Falso</option>
              <option value="ESSAY_KEYWORD">Discursiva Automática</option>
            </select>
          </div>
        </div>

        {/* Selection toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={handleSelectAllFiltered}
            className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer"
          >
            {selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-indigo-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>
              {selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0
                ? 'Desmarcar Todas'
                : `Selecionar Todas (${filteredQuestions.length})`}
            </span>
          </button>

          <span className="text-slate-400 text-[11px]">
            Exibindo {filteredQuestions.length} de {questions.length} questões
          </span>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Nenhuma questão encontrada com os filtros atuais.
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            const isSelected = selectedQuestionIds.includes(q.id);

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-3 ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleToggleSelectQuestion(q.id)}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer mr-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 text-[10px] px-2 py-0.5 rounded-md">
                      {q.code}
                    </span>
                    <span className="font-bold text-slate-800 text-xs">{q.subject}</span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-600 text-xs font-medium">{q.topic}</span>
                    {q.bnccSkill && (
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                        BNCC: {q.bnccSkill}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.difficulty === 'FACIL'
                          ? 'bg-emerald-50 text-emerald-700'
                          : q.difficulty === 'MEDIO'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {q.difficulty === 'FACIL' ? 'Fácil' : q.difficulty === 'MEDIO' ? 'Médio' : 'Difícil'}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {q.type === 'MULTIPLE_CHOICE'
                        ? 'Múltipla Escolha'
                        : q.type === 'TRUE_FALSE'
                        ? 'V/F'
                        : 'Discursiva Auto'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Editar Questão"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir questão ${q.code}?`)) {
                          onDeleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Excluir Questão"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="text-xs text-slate-900 font-medium leading-relaxed">
                  {q.stem}
                </div>

                {/* Options Preview for Multiple Choice */}
                {q.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    {q.options?.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-2 p-1.5 rounded-lg text-xs ${
                          opt.isCorrect
                            ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex-1">
                          <span>{opt.text}</span>
                          {isExpanded && opt.explanation && (
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5 italic">
                              💡 {opt.explanation}
                            </p>
                          )}
                        </div>
                        {opt.isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded shrink-0">
                            Gabarito
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Expand / Collapse Details */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Tags:</span>
                    {q.tags.map((tag) => (
                      <span key={tag} className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Ocultar Justificativas' : 'Ver Resolução & Distratores'}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Action Bar when items are selected */}
      {selectedQuestionIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
              {selectedQuestionIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {selectedQuestionIds.length === 1 ? 'questão selecionada' : 'questões selecionadas'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700"></div>

          <div className="flex items-center gap-2">
            {onCreateExamWithQuestions && (
              <button
                onClick={handleCreateExamWithSelected}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <FileCheck className="h-4 w-4" />
                <span>Elaborar Avaliação</span>
              </button>
            )}

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Selecionadas</span>
            </button>

            <button
              onClick={() => handleExportJSON(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={handleBatchDeleteSelected}
              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir</span>
            </button>

            <button
              onClick={() => setSelectedQuestionIds([])}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              title="Limpar Seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Relatório Estatístico do Banco Modal */}
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
                    Relatório Diagnóstico do Banco de Questões
                  </h2>
                  <p className="text-xs text-slate-500">
                    Métricas de acervo, cobertura de matriz curricular e equilíbrio psicométrico
                  </p>
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
              {/* Top Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total de Questões</span>
                  <p className="text-xl font-black text-slate-900">{questions.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Com Código BNCC</span>
                  <p className="text-xl font-black text-emerald-700">
                    {questions.filter((q) => q.bnccSkill).length}{' '}
                    <span className="text-xs font-normal">
                      ({Math.round((questions.filter((q) => q.bnccSkill).length / (questions.length || 1)) * 100)}%)
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700">Disciplinas Cobertas</span>
                  <p className="text-xl font-black text-indigo-700">{Object.keys(subjectStats).length}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Dificuldade Média</span>
                  <p className="text-xl font-black text-amber-700">Equilibrada</p>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Distribuição por Disciplina & Dificuldade</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Disciplina</th>
                        <th className="p-2.5 text-center">Total</th>
                        <th className="p-2.5 text-center text-emerald-600">Fácil</th>
                        <th className="p-2.5 text-center text-amber-600">Médio</th>
                        <th className="p-2.5 text-center text-rose-600">Difícil</th>
                        <th className="p-2.5 text-center text-indigo-600">Com BNCC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(subjectStats).map(([subj, stat]) => {
                        const s = stat as { total: number; easy: number; medium: number; hard: number; bncc: number };
                        return (
                          <tr key={subj} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">{subj}</td>
                            <td className="p-2.5 text-center font-bold">{s.total}</td>
                            <td className="p-2.5 text-center text-emerald-700">{s.easy}</td>
                            <td className="p-2.5 text-center text-amber-700">{s.medium}</td>
                            <td className="p-2.5 text-center text-rose-700">{s.hard}</td>
                            <td className="p-2.5 text-center text-indigo-700 font-semibold">{s.bncc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1.5">
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Recomendações Psicometria & Montagem de Provas
                </p>
                <ul className="list-disc list-inside text-indigo-800 space-y-1 pl-1">
                  <li>Para provas bimestrais balanceadas, recomendamos proporção de 40% Fácil, 40% Médio e 20% Difícil.</li>
                  <li>Todas as questões objetivas possuem distratores cadastrados para análise de erros comuns.</li>
                  <li>Aproveite o botão "Elaborar Avaliação" com itens selecionados para gerar testes instantâneos.</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleExportCSV(false)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar Relatório CSV</span>
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

      {/* Modal de Impressão Formatada */}
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
                    Impressão de Caderno de Questões ({questionsToPrint.length} itens)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure os parâmetros para impressão limpa para aplicação em sala ou estudo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Print Controls Bar */}
            <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-3 no-print text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printIncludeAnswers}
                    onChange={(e) => setPrintIncludeAnswers(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Imprimir com Gabarito (Professor)</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printIncludeDistractors}
                    onChange={(e) => setPrintIncludeDistractors(e.target.checked)}
                    disabled={!printIncludeAnswers}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Incluir Justificativa dos Distratores</span>
                </label>
              </div>

              <button
                onClick={handlePrintExamPaper}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Agora (Ctrl+P / PDF)</span>
              </button>
            </div>

            {/* Printable Document Preview Area */}
            <div id="printable-question-bank-paper" className="p-8 max-h-[70vh] overflow-y-auto bg-white text-slate-900 font-serif leading-relaxed text-sm space-y-6">
              {/* Header Institucional */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h1 className="text-base font-bold uppercase tracking-wider font-sans">
                  SISTEMA DE ENSINO & GESTÃO ESCOLAR - BANCO OFICIAL DE QUESTÕES
                </h1>
                <p className="text-xs text-slate-600 font-sans">
                  CADERNO DE ITENS AVALIATIVOS ALINHADOS À BNCC • ANO LETIVO 2026
                </p>
                <div className="pt-2 text-xs font-sans flex justify-between border-t border-slate-200 mt-2 text-slate-700">
                  <span>Data: ___/___/2026</span>
                  <span>Estudante: __________________________________________________</span>
                  <span>Turma: _________</span>
                </div>
              </div>

              {/* Questions List Formatted */}
              <div className="space-y-6 divide-y divide-slate-200">
                {questionsToPrint.map((q, qIndex) => (
                  <div key={q.id} className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans text-slate-500">
                      <span className="font-bold text-slate-900">
                        QUESTÃO {qIndex + 1} ({q.code}) • {q.subject}
                      </span>
                      <span>
                        {q.bnccSkill ? `BNCC: ${q.bnccSkill}` : ''} | Dificuldade: {q.difficulty}
                      </span>
                    </div>

                    <p className="text-sm text-slate-900 font-normal leading-relaxed">
                      {q.stem}
                    </p>

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-1.5 pl-2 text-xs font-sans">
                        {q.options?.map((opt, idx) => (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-2 p-1 rounded ${
                              printIncludeAnswers && opt.isCorrect
                                ? 'bg-emerald-100/70 font-bold text-emerald-950'
                                : 'text-slate-800'
                            }`}
                          >
                            <span className="font-bold">({String.fromCharCode(65 + idx)})</span>
                            <span className="flex-1">{opt.text}</span>
                            {printIncludeAnswers && opt.isCorrect && (
                              <span className="text-[10px] font-black uppercase text-emerald-800">[GABARITO]</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'ESSAY_KEYWORD' && (
                      <div className="pt-2">
                        {printIncludeAnswers ? (
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-sans">
                            <p className="font-bold text-slate-700">Palavras-chave esperadas: {q.essayKeywords?.join(', ')}</p>
                            {q.modelAnswer && <p className="text-slate-600 mt-1">Modelo: {q.modelAnswer}</p>}
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2">
                            <div className="border-b border-slate-300 h-6"></div>
                            <div className="border-b border-slate-300 h-6"></div>
                            <div className="border-b border-slate-300 h-6"></div>
                          </div>
                        )}
                      </div>
                    )}

                    {printIncludeAnswers && printIncludeDistractors && q.explanation && (
                      <div className="p-2 bg-slate-50 rounded text-[11px] font-sans text-slate-600 border border-slate-200">
                        <span className="font-bold">Resolução/Comentário: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Question Editor / Creator Modal */}
      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(q) => {
          onSaveQuestion(q);
          setIsModalOpen(false);
        }}
        questionToEdit={questionToEdit}
        availableSubjects={subjectNames}
        subjects={subjects}
      />

      {/* Batch / Multi-format Importer Modal */}
      <QuestionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportQuestions={(imported) => {
          onBatchImport(imported);
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
