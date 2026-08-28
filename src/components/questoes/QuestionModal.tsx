import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, HelpCircle, Check, Sparkles } from 'lucide-react';
import { Question, QuestionDifficulty, QuestionType, QuestionOption } from '../../types';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  questionToEdit?: Question | null;
  availableSubjects: string[];
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  questionToEdit,
  availableSubjects,
}) => {
  const [formData, setFormData] = useState<Partial<Question>>({
    code: '',
    subject: availableSubjects[0] || 'Matemática',
    topic: '',
    gradeLevel: '3º Ano',
    bnccSkill: 'EM13MAT302',
    difficulty: 'MEDIO',
    type: 'MULTIPLE_CHOICE',
    stem: '',
    explanation: '',
    authorTeacher: 'Prof. Titular',
    tags: [],
    modelAnswer: '',
    essayKeywords: [],
    options: [
      { id: 'opt-1', text: '', isCorrect: true, explanation: 'Alternativa correta (gabarito)' },
      { id: 'opt-2', text: '', isCorrect: false, explanation: 'Distrator 1 (erro comum)' },
      { id: 'opt-3', text: '', isCorrect: false, explanation: 'Distrator 2' },
      { id: 'opt-4', text: '', isCorrect: false, explanation: 'Distrator 3' },
    ],
  });

  const [rawTags, setRawTags] = useState('');
  const [rawKeywords, setRawKeywords] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (questionToEdit) {
      setFormData(questionToEdit);
      setRawTags(questionToEdit.tags?.join(', ') || '');
      setRawKeywords(questionToEdit.essayKeywords?.join(', ') || '');
    } else {
      const codeNum = Math.floor(100 + Math.random() * 900);
      setFormData({
        code: `QUEST-${codeNum}`,
        subject: availableSubjects[0] || 'Matemática',
        topic: '',
        gradeLevel: '3º Ano',
        bnccSkill: '',
        difficulty: 'MEDIO',
        type: 'MULTIPLE_CHOICE',
        stem: '',
        explanation: '',
        authorTeacher: 'Prof. Titular',
        tags: [],
        modelAnswer: '',
        essayKeywords: [],
        options: [
          { id: 'opt-1', text: '', isCorrect: true, explanation: 'Alternativa correta e justificativa' },
          { id: 'opt-2', text: '', isCorrect: false, explanation: 'Distrator conceitual (induz ao erro)' },
          { id: 'opt-3', text: '', isCorrect: false, explanation: 'Distrator de cálculo ou interpretação' },
          { id: 'opt-4', text: '', isCorrect: false, explanation: 'Distrator com inversão lógica' },
        ],
      });
      setRawTags('');
      setRawKeywords('');
    }
    setError('');
  }, [questionToEdit, isOpen, availableSubjects]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const nextId = `opt-${Date.now()}-${(formData.options?.length || 0) + 1}`;
    setFormData({
      ...formData,
      options: [
        ...(formData.options || []),
        { id: nextId, text: '', isCorrect: false, explanation: 'Distrator adicional' },
      ],
    });
  };

  const handleRemoveOption = (index: number) => {
    if ((formData.options?.length || 0) <= 2) {
      setError('A questão deve possuir no mínimo 2 alternativas.');
      return;
    }
    const updated = [...(formData.options || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, options: updated });
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: any) => {
    const updated = [...(formData.options || [])];
    if (field === 'isCorrect' && value === true) {
      // If single correct answer, set others to false
      updated.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData({ ...formData, options: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stem?.trim()) {
      setError('O enunciado da questão é obrigatório.');
      return;
    }
    if (!formData.topic?.trim()) {
      setError('O tópico pedagógico da questão é obrigatório.');
      return;
    }

    if (formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') {
      const hasCorrect = formData.options?.some((o) => o.isCorrect);
      if (!hasCorrect) {
        setError('Defina ao menos uma alternativa como correta (gabarito).');
        return;
      }
      const hasEmptyText = formData.options?.some((o) => !o.text.trim());
      if (hasEmptyText) {
        setError('Preencha o texto de todas as alternativas.');
        return;
      }
    }

    const tags = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const essayKeywords = rawKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const question: Question = {
      id: questionToEdit?.id || `q-${Date.now()}`,
      code: formData.code?.trim() || `Q-${Date.now().toString().slice(-4)}`,
      subject: formData.subject || 'Matemática',
      topic: formData.topic.trim(),
      gradeLevel: formData.gradeLevel || '3º Ano',
      bnccSkill: formData.bnccSkill?.trim() || undefined,
      difficulty: (formData.difficulty as QuestionDifficulty) || 'MEDIO',
      type: (formData.type as QuestionType) || 'MULTIPLE_CHOICE',
      stem: formData.stem.trim(),
      options: formData.type !== 'ESSAY_KEYWORD' ? formData.options : undefined,
      essayKeywords: formData.type === 'ESSAY_KEYWORD' ? essayKeywords : undefined,
      modelAnswer: formData.type === 'ESSAY_KEYWORD' ? formData.modelAnswer?.trim() : undefined,
      explanation: formData.explanation?.trim() || 'Resolução comentada pelo professor.',
      authorTeacher: formData.authorTeacher?.trim() || 'Prof. Titular',
      tags,
      createdAt: questionToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(question);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {questionToEdit ? 'Editar Questão do Banco' : 'Cadastrar Nova Questão'}
              </h2>
              <p className="text-xs text-slate-500">
                Itens avaliativos com distratores comentados e alinhamento à BNCC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Classification grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disciplina *</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dificuldade</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
              >
                <option value="FACIL">Fácil</option>
                <option value="MEDIO">Médio</option>
                <option value="DIFICIL">Difícil</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Questão *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-indigo-700"
              >
                <option value="MULTIPLE_CHOICE">Múltipla Escolha (Objetiva)</option>
                <option value="TRUE_FALSE">Verdadeiro ou Falso (V/F)</option>
                <option value="ESSAY_KEYWORD">Discursiva com Palavras-Chave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tópico / Conteúdo *</label>
              <input
                type="text"
                required
                value={formData.topic || ''}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ex: Funções Quadráticas, Modernismo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Habilidade BNCC</label>
              <input
                type="text"
                value={formData.bnccSkill || ''}
                onChange={(e) => setFormData({ ...formData, bnccSkill: e.target.value })}
                placeholder="Ex: EM13MAT302, EF09CI03"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código Identificador</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: MAT-301"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Stem (Enunciado) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Enunciado da Questão *</label>
            <textarea
              rows={4}
              required
              value={formData.stem || ''}
              onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
              placeholder="Digite o texto base, contexto, dados e a pergunta da questão..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
            />
          </div>

          {/* Type: Multiple Choice or True/False Options */}
          {(formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Alternativas & Justificativa dos Distratores
                </label>
                {formData.type === 'MULTIPLE_CHOICE' && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Alternativa</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {formData.options?.map((option, idx) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded-xl border transition-all ${
                      option.isCorrect
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOptionChange(idx, 'isCorrect', true)}
                        className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                          option.isCorrect
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                        title="Definir como Gabarito Correto"
                      >
                        {option.isCorrect && <Check className="h-3 w-3" />}
                      </button>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-700">
                            Alternativa {String.fromCharCode(65 + idx)}{' '}
                            {option.isCorrect && (
                              <span className="text-[10px] text-emerald-700 font-black uppercase ml-1">
                                (Gabarito Oficial)
                              </span>
                            )}
                          </span>
                          {formData.type === 'MULTIPLE_CHOICE' && (formData.options?.length || 0) > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-slate-400 hover:text-rose-600"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          value={option.text}
                          onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                          placeholder={`Texto da alternativa ${String.fromCharCode(65 + idx)}...`}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />

                        <input
                          type="text"
                          value={option.explanation || ''}
                          onChange={(e) => handleOptionChange(idx, 'explanation', e.target.value)}
                          placeholder="Justificativa pedagógica / Explicação deste distrator..."
                          className="w-full px-3 py-1 text-[11px] rounded-lg border border-slate-200/80 bg-slate-100/60 text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type: Essay with keywords */}
          {formData.type === 'ESSAY_KEYWORD' && (
            <div className="space-y-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-200">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Palavras-chave Obrigatórias para Correção Automática (Separadas por vírgula) *
                </label>
                <input
                  type="text"
                  value={rawKeywords}
                  onChange={(e) => setRawKeywords(e.target.value)}
                  placeholder="Ex: agente, ação, meio, modo, efeito, detalhamento"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  O sistema atribuirá nota proporcional à presença desses termos na resposta do aluno.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Modelo de Resposta Padrão</label>
                <textarea
                  rows={2}
                  value={formData.modelAnswer || ''}
                  onChange={(e) => setFormData({ ...formData, modelAnswer: e.target.value })}
                  placeholder="Resposta esperada completa para conferência..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Resolution & General Explanation */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Resolução Geral Comentada (Feedback Pós-Prova)
            </label>
            <textarea
              rows={2}
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explicação passo a passo da solução que será exibida para o aluno após a entrega..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tags / Etiquetas (Separadas por vírgula)
            </label>
            <input
              type="text"
              value={rawTags}
              onChange={(e) => setRawTags(e.target.value)}
              placeholder="Ex: ENEM, Vestibular, Recuperação, Nível Avançado"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
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
              <span>{questionToEdit ? 'Salvar Alterações' : 'Adicionar ao Banco'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
