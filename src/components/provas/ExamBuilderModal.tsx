import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Clock,
  Settings,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import {
  Exam,
  Question,
  SchoolClass,
  Subject,
  ExamQuestionConfig,
  AutoCorrectionRules,
} from '../../types';

interface ExamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: Exam) => void;
  examToEdit?: Exam | null;
  questions: Question[];
  classes: SchoolClass[];
  subjects: Subject[];
  initialQuestionIds?: string[];
}

export const ExamBuilderModal: React.FC<ExamBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  examToEdit,
  questions,
  classes,
  subjects,
  initialQuestionIds,
}) => {
  const [formData, setFormData] = useState<Partial<Exam>>({
    title: '',
    description: '',
    subject: subjects[0]?.name || 'Matemática',
    classId: classes[0]?.id || '',
    teacherName: 'Prof. Titular',
    schoolYear: 2026,
    term: '1º Bimestre',
    totalPoints: 10.0,
    passingScore: 6.0,
    timeLimitMinutes: 45,
    timePerQuestionSeconds: 180,
    randomizeQuestions: false,
    randomizeOptions: true,
    status: 'IN_PROGRESS',
    questions: [],
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDateTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  });

  const [autoRules, setAutoRules] = useState<AutoCorrectionRules>({
    partialCreditForKeywords: true,
    caseSensitive: false,
    negativeMarking: false,
    penaltyPerWrongOption: 0,
    allowReviewAfterSubmission: true,
    showExplanationInstantly: true,
  });

  const [selectedQuestions, setSelectedQuestions] = useState<ExamQuestionConfig[]>([]);
  const [questionSearchFilter, setQuestionSearchFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (examToEdit) {
      setFormData(examToEdit);
      setAutoRules(examToEdit.autoCorrectionRules);
      setSelectedQuestions(examToEdit.questions);
    } else {
      setFormData({
        title: '',
        description: 'Avaliação com correção automática instantânea e diagnóstico de erros.',
        subject: subjects[0]?.name || 'Matemática',
        classId: classes[0]?.id || '',
        teacherName: 'Prof. Titular',
        schoolYear: 2026,
        term: '1º Bimestre',
        totalPoints: 10.0,
        passingScore: 6.0,
        timeLimitMinutes: 45,
        timePerQuestionSeconds: 180,
        randomizeQuestions: false,
        randomizeOptions: true,
        status: 'IN_PROGRESS',
        questions: [],
        scheduledDate: new Date().toISOString().split('T')[0],
        dueDateTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      });
      setAutoRules({
        partialCreditForKeywords: true,
        caseSensitive: false,
        negativeMarking: false,
        penaltyPerWrongOption: 0,
        allowReviewAfterSubmission: true,
        showExplanationInstantly: true,
      });
      // Preselect initial questions if provided, otherwise default to 3 questions
      const targetIds =
        initialQuestionIds && initialQuestionIds.length > 0
          ? initialQuestionIds
          : questions.slice(0, 3).map((q) => q.id);

      const count = Math.max(1, targetIds.length);
      const defaultQs = targetIds.map((qId) => ({
        questionId: qId,
        points: Number((10.0 / count).toFixed(2)),
        timeLimitSeconds: 180,
      }));
      setSelectedQuestions(defaultQs);
    }
    setError('');
    // Reinicia só ao abrir ou trocar de prova: listas recriadas pelo componente pai apagavam o que foi digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examToEdit?.id, isOpen]);

  if (!isOpen) return null;

  const handleToggleQuestionSelection = (questionId: string) => {
    const exists = selectedQuestions.some((sq) => sq.questionId === questionId);
    if (exists) {
      setSelectedQuestions(selectedQuestions.filter((sq) => sq.questionId !== questionId));
    } else {
      const remainingCount = selectedQuestions.length + 1;
      const pointPerQ = Number((10.0 / remainingCount).toFixed(2));
      const updated = [
        ...selectedQuestions,
        { questionId, points: pointPerQ, timeLimitSeconds: formData.timePerQuestionSeconds || 180 },
      ];
      setSelectedQuestions(updated);
    }
  };

  const handleQuestionPointChange = (questionId: string, points: number) => {
    setSelectedQuestions(
      selectedQuestions.map((sq) =>
        sq.questionId === questionId ? { ...sq, points: Math.max(0.1, points) } : sq
      )
    );
  };

  const handleDistributeEqually = () => {
    if (selectedQuestions.length === 0) return;
    const total = formData.totalPoints || 10.0;
    const pt = Number((total / selectedQuestions.length).toFixed(2));
    setSelectedQuestions(
      selectedQuestions.map((sq) => ({ ...sq, points: pt }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError('O título da avaliação é obrigatório.');
      return;
    }
    if (selectedQuestions.length === 0) {
      setError('Selecione ao menos 1 questão do banco para compor a prova.');
      return;
    }

    const exam: Exam = {
      id: examToEdit?.id || `exam-${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      subject: formData.subject || 'Geral',
      classId: formData.classId || classes[0]?.id || '',
      teacherName: formData.teacherName?.trim() || 'Professor Titular',
      schoolYear: Number(formData.schoolYear) || 2026,
      term: (formData.term as any) || '1º Bimestre',
      totalPoints: Number(formData.totalPoints) || 10.0,
      passingScore: Number(formData.passingScore) || 6.0,
      timeLimitMinutes: Number(formData.timeLimitMinutes) || 45,
      timePerQuestionSeconds: Number(formData.timePerQuestionSeconds) || 180,
      randomizeQuestions: !!formData.randomizeQuestions,
      randomizeOptions: !!formData.randomizeOptions,
      status: (formData.status as any) || 'IN_PROGRESS',
      questions: selectedQuestions,
      autoCorrectionRules: autoRules,
      scheduledDate: formData.scheduledDate || new Date().toISOString().split('T')[0],
      dueDateTime: formData.dueDateTime || new Date().toISOString(),
      createdAt: examToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(exam);
  };

  const availableBankFiltered = questions.filter((q) => {
    if (!questionSearchFilter) return true;
    if (!q) return false;
    const filter = questionSearchFilter.toLowerCase().trim();
    return (
      (q.stem && q.stem.toLowerCase().includes(filter)) ||
      (q.topic && q.topic.toLowerCase().includes(filter)) ||
      (q.subject && q.subject.toLowerCase().includes(filter)) ||
      (q.code && q.code.toLowerCase().includes(filter))
    );
  });

  const currentPointsSum = selectedQuestions.reduce((acc, q) => acc + (q.points || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {examToEdit ? 'Editar Avaliação Personalizada' : 'Criador de Avaliações & Provas'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure tempo limite, pontuação por questão e regras de correção automatizada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Título da Prova / Avaliação *</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Simulado 1º Bimestre de Matemática e Ciências"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Turma Destino *</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disciplina Principal</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Etapa / Bimestre</label>
              <select
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="1º Bimestre">1º Bimestre</option>
                <option value="2º Bimestre">2º Bimestre</option>
                <option value="3º Bimestre">3º Bimestre</option>
                <option value="4º Bimestre">4º Bimestre</option>
                <option value="Simulado Geral">Simulado Geral</option>
                <option value="Recuperação">Recuperação Paralela</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Professor Responsável</label>
              <input
                type="text"
                value={formData.teacherName || ''}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                placeholder="Nome do docente"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Section 2: Time Configuration & Points */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Clock className="h-4 w-4 text-indigo-600" />
              Tempo de Resposta & Critérios de Pontuação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Tempo Total de Prova (Minutos) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={formData.timeLimitMinutes || 45}
                  onChange={(e) => setFormData({ ...formData, timeLimitMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-indigo-700"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Cronômetro com bloqueio automático</p>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Tempo Recomendado / Questão (Seg)
                </label>
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={formData.timePerQuestionSeconds || 180}
                  onChange={(e) =>
                    setFormData({ ...formData, timePerQuestionSeconds: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Média de 3 minutos/questão</p>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Nota Total da Prova</label>
                <input
                  type="number"
                  step="any"
                  value={formData.totalPoints || 10.0}
                  onChange={(e) => setFormData({ ...formData, totalPoints: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Nota de Corte / Média</label>
                <input
                  type="number"
                  step="any"
                  value={formData.passingScore || 6.0}
                  onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Auto-Correction Rules */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-3">
            <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Settings className="h-4 w-4 text-indigo-600" />
              Regras de Correção Automática Instantânea
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-indigo-100">
                <input
                  type="checkbox"
                  checked={autoRules.showExplanationInstantly}
                  onChange={(e) =>
                    setAutoRules({ ...autoRules, showExplanationInstantly: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                <div>
                  <span className="font-semibold block">Disponibilizar Resultados Instantaneamente</span>
                  <span className="text-[10px] text-slate-500">Exibe notas e erros comuns logo após o envio</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-indigo-100">
                <input
                  type="checkbox"
                  checked={autoRules.partialCreditForKeywords}
                  onChange={(e) =>
                    setAutoRules({ ...autoRules, partialCreditForKeywords: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                <div>
                  <span className="font-semibold block">Pontuação Parcial em Discursivas</span>
                  <span className="text-[10px] text-slate-500">Calcula peso por palavras-chave encontradas</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-indigo-100">
                <input
                  type="checkbox"
                  checked={formData.randomizeOptions}
                  onChange={(e) => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <div>
                  <span className="font-semibold block">Embaralhar Alternativas</span>
                  <span className="text-[10px] text-slate-500">Ordem randômica para evitar cópias</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-indigo-100">
                <input
                  type="checkbox"
                  checked={autoRules.allowReviewAfterSubmission}
                  onChange={(e) =>
                    setAutoRules({ ...autoRules, allowReviewAfterSubmission: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                <div>
                  <span className="font-semibold block">Permitir Revisão do Gabarito Comentado</span>
                  <span className="text-[10px] text-slate-500">Permite ver explicações detalhadas de cada distrator</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Question Selection from Bank */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Composição da Prova ({selectedQuestions.length} questões selecionadas)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Soma das notas: <strong className="text-indigo-700">{currentPointsSum.toFixed(2)} pts</strong> (Meta: {formData.totalPoints} pts)
                </p>
              </div>
              <button
                type="button"
                onClick={handleDistributeEqually}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] cursor-pointer"
              >
                Distribuir Pontos Igualmente
              </button>
            </div>

            {/* Filter questions bank */}
            <input
              type="text"
              value={questionSearchFilter}
              onChange={(e) => setQuestionSearchFilter(e.target.value)}
              placeholder="Filtrar questões do banco por tema, disciplina ou palavra-chave..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
            />

            {/* Questions Bank Selection List */}
            <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white">
              {availableBankFiltered.map((q) => {
                const isSelected = selectedQuestions.some((sq) => sq.questionId === q.id);
                const selectedConfig = selectedQuestions.find((sq) => sq.questionId === q.id);

                return (
                  <div
                    key={q.id}
                    className={`p-3 transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleQuestionSelection(q.id)}
                        className="mt-1 rounded text-indigo-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-indigo-700 text-[10px]">
                            {q.code}
                          </span>
                          <span className="font-bold text-slate-800">{q.subject}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{q.topic}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              q.difficulty === 'FACIL'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.difficulty === 'MEDIO'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] line-clamp-2 mt-0.5">
                          {q.stem}
                        </p>
                      </div>
                    </div>

                    {/* Points input if selected */}
                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium">Pontos:</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={selectedConfig?.points || 2.5}
                          onChange={(e) =>
                            handleQuestionPointChange(q.id, Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 bg-white border border-indigo-300 rounded font-bold text-indigo-900 text-center"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{examToEdit ? 'Salvar Alterações' : 'Publicar Avaliação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
