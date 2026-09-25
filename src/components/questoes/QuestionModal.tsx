import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  HelpCircle,
  Check,
  Sparkles,
  BookOpen,
  Search,
  Layers,
  GraduationCap,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Question, QuestionDifficulty, QuestionType, QuestionOption, Subject, BnccSkill } from '../../types';
import { DEFAULT_BNCC_SKILLS } from '../../data/bnccAndRegulationsData';
import { getStoredData } from '../../data/storage';
import { questionSkillCodes, joinSkillCodes } from '../../services/bncc/examSkillService';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  questionToEdit?: Question | null;
  availableSubjects?: string[];
  subjects?: Subject[] | string[];
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  questionToEdit,
  availableSubjects,
  subjects,
}) => {
  // Disciplinas cadastradas + componentes padrão (a Matriz pode estar vazia ou incompleta).
  const subjectList: string[] = useMemo(() => {
    const fromProps: string[] = [
      ...(availableSubjects || []),
      ...((subjects || []) as Array<Subject | string>).map((s) => (typeof s === 'string' ? s : s?.name)),
    ].filter(Boolean) as string[];
    const defaults = [
      'Língua Portuguesa',
      'Matemática',
      'Ciências',
      'Ciências da Natureza',
      'História',
      'Geografia',
      'Arte',
      'Educação Física',
      'Língua Inglesa',
      'Ensino Religioso',
      'Física',
      'Química',
      'Biologia',
      'Filosofia',
      'Sociologia',
      'Campos de Experiências (Ed. Infantil)',
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of [...fromProps, ...defaults]) {
      const t = String(n).trim();
      if (t && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        out.push(t);
      }
    }
    return out;
  }, [availableSubjects, subjects]);

  const [formData, setFormData] = useState<Partial<Question>>({
    code: '',
    subject: subjectList[0] || 'Língua Portuguesa',
    topic: '',
    gradeLevel: '1º Ano',
    bnccSkill: 'EF01LP01',
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
      { id: 'opt-2', text: '', isCorrect: false, explanation: 'Distrator 1 (erro conceitual comum)' },
      { id: 'opt-3', text: '', isCorrect: false, explanation: 'Distrator 2' },
      { id: 'opt-4', text: '', isCorrect: false, explanation: 'Distrator 3' },
    ],
  });

  const [rawTags, setRawTags] = useState('');
  const [rawKeywords, setRawKeywords] = useState('');
  const [error, setError] = useState('');

  // BNCC Skill Finder States
  const [showBnccPicker, setShowBnccPicker] = useState(false);
  const [bnccSegmentFilter, setBnccSegmentFilter] = useState('ALL');
  const [bnccSearch, setBnccSearch] = useState('');
  // Uma questão pode avaliar várias habilidades.
  const [skillCodes, setSkillCodes] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const addSkillCodes = (text: string) => {
    const codes = questionSkillCodes({ bnccSkill: text });
    if (!codes.length) return;
    setSkillCodes((prev) => [...prev, ...codes.filter((c) => !prev.includes(c))]);
    setSkillInput('');
  };
  const toggleSkillCode = (code: string) => {
    const c = code.toUpperCase();
    setSkillCodes((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  // Catálogo: habilidades cadastradas no módulo BNCC + catálogo padrão (sem repetir código).
  const skillCatalog: BnccSkill[] = useMemo(() => {
    const byCode = new Map<string, BnccSkill>();
    let stored: BnccSkill[] = [];
    try {
      stored = (getStoredData() as any)?.bnccSkills || [];
    } catch {
      stored = [];
    }
    for (const sk of [...stored, ...DEFAULT_BNCC_SKILLS]) {
      if (sk?.code && !byCode.has(sk.code.toUpperCase())) byCode.set(sk.code.toUpperCase(), sk);
    }
    return Array.from(byCode.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (questionToEdit) {
      setFormData(questionToEdit);
      setSkillCodes(questionSkillCodes(questionToEdit));
      setRawTags(questionToEdit.tags?.join(', ') || '');
      setRawKeywords(questionToEdit.essayKeywords?.join(', ') || '');
    } else {
      const codeNum = Math.floor(100 + Math.random() * 900);
      setFormData({
        code: `QUEST-${codeNum}`,
        subject: subjectList[0] || 'Língua Portuguesa',
        topic: '',
        gradeLevel: '1º Ano',
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
          { id: 'opt-1', text: '', isCorrect: true, explanation: 'Alternativa correta e fundamentada' },
          { id: 'opt-2', text: '', isCorrect: false, explanation: 'Distrator 1 (induz ao erro)' },
          { id: 'opt-3', text: '', isCorrect: false, explanation: 'Distrator 2' },
          { id: 'opt-4', text: '', isCorrect: false, explanation: 'Distrator 3' },
        ],
      });
      setRawTags('');
      setRawKeywords('');
      setSkillCodes([]);
    }
    setSkillInput('');
    setError('');
    // Reinicia só ao abrir ou trocar de questão (a lista de disciplinas é recriada a cada renderização).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionToEdit?.id, isOpen]);

  const filteredBnccSkills = useMemo(() => {
    const q = (bnccSearch || '').toLowerCase().trim();
    return skillCatalog.filter((sk) => {
      if (!sk) return false;
      const matchSegment =
        bnccSegmentFilter === 'ALL' || sk.segment === bnccSegmentFilter;
      const matchText =
        !q ||
        (sk.code && sk.code.toLowerCase().includes(q)) ||
        (sk.description && sk.description.toLowerCase().includes(q)) ||
        (sk.subject && sk.subject.toLowerCase().includes(q)) ||
        (sk.educationLevel && sk.educationLevel.toLowerCase().includes(q));
      return matchSegment && matchText;
    });
  }, [bnccSegmentFilter, bnccSearch, skillCatalog]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const nextId = `opt-${Date.now()}-${(formData.options?.length || 0) + 1}`;
    setFormData({
      ...formData,
      options: [
        ...(formData.options || []),
        { id: nextId, text: '', isCorrect: false, explanation: 'Distrator complementar' },
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
      subject: formData.subject || 'Língua Portuguesa',
      topic: formData.topic.trim(),
      gradeLevel: formData.gradeLevel || '1º Ano',
      // Texto digitado e ainda não adicionado também conta.
      ...(() => {
        const codes = [...skillCodes, ...questionSkillCodes({ bnccSkill: skillInput }).filter((c) => !skillCodes.includes(c))];
        return { bnccSkills: codes.length ? codes : undefined, bnccSkill: codes.length ? joinSkillCodes(codes) : undefined };
      })(),
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
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
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
                Itens avaliativos com distratores comentados e habilidades da BNCC para todos os níveis
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disciplina *</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
              >
                {formData.subject && !subjectList.includes(formData.subject) && <option value={formData.subject}>{formData.subject}</option>}
                {subjectList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* SELEÇÃO DO ANO / NÍVEL DA EDUCAÇÃO */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ano / Nível de Ensino *</label>
              <select
                value={formData.gradeLevel || '1º Ano'}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800"
              >
                <option value="EDUCAÇÃO INFANTIL">EDUCAÇÃO INFANTIL</option>
                <option value="1º Ano">1º Ano (Ensino Fundamental)</option>
                <option value="2º Ano">2º Ano (Ensino Fundamental)</option>
                <option value="3º Ano">3º Ano (Ensino Fundamental)</option>
                <option value="4º Ano">4º Ano (Ensino Fundamental)</option>
                <option value="5º Ano">5º Ano (Ensino Fundamental)</option>
                <option value="6º Ano">6º Ano (Ensino Fundamental)</option>
                <option value="7º Ano">7º Ano (Ensino Fundamental)</option>
                <option value="8º Ano">8º Ano (Ensino Fundamental)</option>
                <option value="9º Ano">9º Ano (Ensino Fundamental)</option>
                <option value="1ª Série EM">1ª Série (Ensino Médio)</option>
                <option value="2ª Série EM">2ª Série (Ensino Médio)</option>
                <option value="3ª Série EM">3ª Série (Ensino Médio)</option>
                <option value="EJA">EJA (Educação de Jovens e Adultos)</option>
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
              <label className="block font-semibold text-slate-700 mb-1">Tópico / Objeto de Conhecimento *</label>
              <input
                type="text"
                required
                value={formData.topic || ''}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ex: Alfabetização, Operações Básicas, Frações..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            {/* SEÇÃO DA HABILIDADE BNCC COM BOTÃO DE CATÁLOGO */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Habilidades da BNCC avaliadas nesta questão (uma ou mais)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowBnccPicker(!showBnccPicker)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Search className="h-3 w-3" />
                  <span>{showBnccPicker ? 'Ocultar Catálogo' : 'Consultar Catálogo BNCC'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkillCodes(skillInput);
                    }
                  }}
                  placeholder="Digite o código e tecle Enter (ex.: EF05MA01). Pode colar vários separados por vírgula."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700 bg-emerald-50/30"
                />
                <button
                  type="button"
                  onClick={() => addSkillCodes(skillInput)}
                  className="px-3 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  title="Adicionar a habilidade digitada"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBnccPicker(!showBnccPicker)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Catálogo BNCC</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 min-h-[26px]">
                {skillCodes.length === 0 ? (
                  <span className="text-[11px] text-slate-400">
                    Nenhuma habilidade vinculada. Uma questão pode avaliar uma ou mais habilidades.
                  </span>
                ) : (
                  skillCodes.map((code) => {
                    const info = skillCatalog.find((sk) => sk.code.toUpperCase() === code);
                    return (
                      <span
                        key={code}
                        title={info?.description || code}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-[11px]"
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => toggleSkillCode(code)}
                          className="p-0.5 rounded hover:bg-emerald-800 cursor-pointer"
                          title="Remover habilidade"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DO CATÁLOGO DE HABILIDADES DA BNCC */}
          {showBnccPicker && (
            <div className="p-4 bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl space-y-3 animate-in fade-in zoom-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 text-xs">
                    Catálogo Oficial de Habilidades da BNCC para Todos os Níveis
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBnccPicker(false)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 self-end sm:self-auto cursor-pointer"
                >
                  ✕ Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={bnccSearch}
                    onChange={(e) => setBnccSearch(e.target.value)}
                    placeholder="Buscar código ou descrição da habilidade..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs"
                  />
                </div>

                <select
                  value={bnccSegmentFilter}
                  onChange={(e) => setBnccSegmentFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Todos os Segmentos da Educação</option>
                  <option value="EDUCACAO_INFANTIL">Educação Infantil (Campos de Experiências)</option>
                  <option value="FUNDAMENTAL_INICIAIS">Ensino Fundamental (1º ao 5º Ano)</option>
                  <option value="FUNDAMENTAL_FINAIS">Ensino Fundamental (6º ao 9º Ano)</option>
                  <option value="ENSINO_MEDIO">Ensino Médio (Áreas do Conhecimento)</option>
                  <option value="EJA">EJA (Jovens e Adultos)</option>
                </select>
              </div>

              {/* Lista de Habilidades */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredBnccSkills.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">Nenhuma habilidade encontrada para o filtro.</p>
                ) : (
                  filteredBnccSkills.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => {
                        toggleSkillCode(skill.code);
                        if (!formData.topic) setFormData({ ...formData, topic: skill.description.substring(0, 40) });
                      }}
                      className={`p-2.5 hover:bg-emerald-100/70 border rounded-xl cursor-pointer transition-all flex items-start gap-2.5 group ${
                        skillCodes.includes(skill.code.toUpperCase()) ? 'bg-emerald-100 border-emerald-500 ring-1 ring-emerald-400' : 'bg-white border-emerald-200'
                      }`}
                    >
                      <span className="px-2 py-0.5 rounded-md font-mono font-black text-[11px] bg-emerald-600 text-white shrink-0 mt-0.5">
                        {skill.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-[11px]">{skill.educationLevel}</span>
                          <span className="text-[10px] text-slate-500">• {skill.subject}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-snug mt-0.5 line-clamp-2">
                          {skill.description}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-bold shrink-0 self-center">
                        {skillCodes.includes(skill.code.toUpperCase()) ? '✓ Vinculada' : 'Vincular'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Stem (Enunciado) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Enunciado da Questão *</label>
            <textarea
              rows={3}
              required
              value={formData.stem || ''}
              onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
              placeholder="Digite o texto base, contextualização e a comanda da questão..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Type: Multiple Choice or True/False */}
          {(formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Alternativas e Justificativa de Distratores
                </span>
                {formData.type === 'MULTIPLE_CHOICE' && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-2.5 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Adicionar Alternativa</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {formData.options?.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border transition-all ${
                      opt.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        id={`opt-radio-${idx}`}
                        name="correct-option-radio"
                        checked={opt.isCorrect}
                        onChange={() => handleOptionChange(idx, 'isCorrect', true)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`opt-radio-${idx}`}
                        className={`font-bold uppercase tracking-wider cursor-pointer ${
                          opt.isCorrect ? 'text-emerald-800' : 'text-slate-700'
                        }`}
                      >
                        Alternativa {String.fromCharCode(65 + idx)} {opt.isCorrect ? '(Gabarito Correto)' : ''}
                      </label>

                      {formData.options && formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="ml-auto text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remover Alternativa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + idx)}...`}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={opt.explanation || ''}
                        onChange={(e) => handleOptionChange(idx, 'explanation', e.target.value)}
                        placeholder="Justificativa pedagógica / distrator (opcional)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type: Essay with Keywords */}
          {formData.type === 'ESSAY_KEYWORD' && (
            <div className="space-y-3 pt-2 border-t border-slate-100 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <span className="font-bold text-indigo-900 block">
                Gabarito e Correção Automática de Resposta Discursiva
              </span>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resposta Padrão Esperada (Modelo para o Professor/Aluno):
                </label>
                <textarea
                  rows={2}
                  value={formData.modelAnswer || ''}
                  onChange={(e) => setFormData({ ...formData, modelAnswer: e.target.value })}
                  placeholder="Ex: O ciclo da água compreende a evaporação dos oceanos, condensação formando nuvens e precipitação..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Palavras-Chave Obrigatórias para Correção Automática (Separadas por vírgula):
                </label>
                <input
                  type="text"
                  value={rawKeywords}
                  onChange={(e) => setRawKeywords(e.target.value)}
                  placeholder="Ex: evaporação, condensação, precipitação, transpiração, lençol freático"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  O motor de correção atribui nota proporcional à presença desses termos técnicos no texto do estudante.
                </p>
              </div>
            </div>
          )}

          {/* Explanation / Resolução Comentada */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Resolução Comentada Completa (Feedback para o Aluno)
            </label>
            <textarea
              rows={2}
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explicação passo a passo, desenvolvimento de cálculos ou fundamentação teórica da resposta..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          {/* Tags and Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tags / Marcadores (separados por vírgula)
              </label>
              <input
                type="text"
                value={rawTags}
                onChange={(e) => setRawTags(e.target.value)}
                placeholder="Ex: SAEB, OBMEP, Prova Brasil, Recuperação, Nível 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Professor Autor / Elaborador</label>
              <input
                type="text"
                value={formData.authorTeacher || ''}
                onChange={(e) => setFormData({ ...formData, authorTeacher: e.target.value })}
                placeholder="Ex: Prof. Carlos Eduardo"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-200"
            >
              <Save className="h-4 w-4" />
              <span>{questionToEdit ? 'Salvar Alterações' : 'Cadastrar no Banco'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
