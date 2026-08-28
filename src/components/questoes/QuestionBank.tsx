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
} from 'lucide-react';
import { Question, Subject } from '../../types';
import { QuestionModal } from './QuestionModal';
import { QuestionImportModal } from './QuestionImportModal';

interface QuestionBankProps {
  questions: Question[];
  subjects: Subject[];
  onSaveQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onBatchImport: (questions: Question[]) => void;
  onCreateExamWithQuestions?: (questionIds: string[]) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  subjects,
  onSaveQuestion,
  onDeleteQuestion,
  onBatchImport,
  onCreateExamWithQuestions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            Banco Central de Questões & Itens BNCC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acervo categorizado de questões com distratores mapeados, habilidades da BNCC e elaboração direta de avaliações
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExportJSON(false)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Importar Banco / Lote</span>
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
                    {q.options.map((opt, idx) => (
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
              onClick={() => handleExportJSON(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar Selecionadas</span>
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

      {/* Single Question Editor / Creator Modal */}
      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(q) => {
          onSaveQuestion(q);
          setIsModalOpen(false);
        }}
        questionToEdit={questionToEdit}
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
