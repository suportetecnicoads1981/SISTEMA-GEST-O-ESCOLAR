import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Printer,
  Plus,
  Search,
  Eye,
  Download,
  Check,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  HelpCircle,
  BarChart2,
  Edit2,
  Trash2,
  Users,
  Shuffle,
  Copy,
  Sliders,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Exam,
  Question,
  SchoolClass,
  Subject,
  Student,
  ExamSubmission,
  SchoolSettings,
} from '../../types';
import { writeSafePrintDocument } from '../../utils/safeHtml';
import {
  ExamModelVariant,
  ExamBatchConfig,
  generateExamVariants,
  generateComparativeAnswerKey,
  generateBatchPrintHtml,
} from '../../utils/examBatchGenerator';
import { notify } from '../../utils/dialogs';

interface TeacherExamsAndAnswerKeysTabProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  submissions: ExamSubmission[];
  settings: SchoolSettings;
  activeClassId: string;
  activeSubjectId: string;
  selectedTerm: string;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onNavigateToExamBuilder?: () => void;
}

export const TeacherExamsAndAnswerKeysTab: React.FC<TeacherExamsAndAnswerKeysTabProps> = ({
  teacherName,
  classes,
  subjects,
  students,
  questions,
  exams,
  submissions,
  settings,
  activeClassId,
  activeSubjectId,
  selectedTerm,
  onSaveExam,
  onDeleteExam,
  onNavigateToExamBuilder,
}) => {
  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId) || classes[0],
    [classes, activeClassId]
  );

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) || subjects[0],
    [subjects, activeSubjectId]
  );

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  // Configurações de Modelos em Lote
  const [batchModelCount, setBatchModelCount] = useState<number>(2); // 2, 3 ou 4 modelos
  const [batchShuffleQuestions, setBatchShuffleQuestions] = useState<boolean>(true);
  const [batchShuffleOptions, setBatchShuffleOptions] = useState<boolean>(true);
  const [includeTeacherKeyInBatch, setIncludeTeacherKeyInBatch] = useState<boolean>(true);
  const [activeModelTab, setActiveModelTab] = useState<'A' | 'B' | 'C' | 'D' | 'KEY'>('A');

  // Estado do formulário de criação personalizada de prova
  const [newTitle, setNewTitle] = useState<string>('');
  const [newExamDate, setNewExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newDuration, setNewDuration] = useState<number>(90);
  const [newPassingScore, setNewPassingScore] = useState<number>(7.0);
  const [newInstructions, setNewInstructions] = useState<string>(
    '1. Verifique se o caderno e o cartão-resposta possuem o mesmo modelo.\n2. Utilize caneta esferográfica preta ou azul.\n3. Não é permitida a comunicação entre estudantes ou consulta a materiais não autorizados.'
  );
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Questão Inédita Rápida (Criada na hora pelo professor)
  const [showNewQuestionForm, setShowNewQuestionForm] = useState<boolean>(false);
  const [customQuestionStem, setCustomQuestionStem] = useState<string>('');
  const [customQuestionSkill, setCustomQuestionSkill] = useState<string>('EM13MAT101');
  const [customOptions, setCustomOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [customQuestionExplanation, setCustomQuestionExplanation] = useState<string>('');

  // Provas do docente / turma ativa
  const teacherExams = useMemo(() => {
    const safeTeacher = (teacherName || '').toLowerCase().trim();
    const safeSubjName = (activeSubject?.name || '').toLowerCase().trim();
    return (exams || []).filter(
      (e) =>
        e &&
        (e.classId === activeClass?.id ||
          (safeTeacher && e.teacherName && e.teacherName.toLowerCase().includes(safeTeacher)) ||
          (safeSubjName && e.subject && e.subject.toLowerCase() === safeSubjName))
    );
  }, [exams, activeClass?.id, teacherName, activeSubject]);

  const activeExam = useMemo(() => {
    if (selectedExamId) {
      return exams.find((e) => e.id === selectedExamId) || teacherExams[0];
    }
    return teacherExams[0];
  }, [exams, selectedExamId, teacherExams]);

  // Modelos e Variações em Lote Gerados para a Prova Ativa
  const examVariants = useMemo(() => {
    if (!activeExam) return [];
    return generateExamVariants(activeExam, questions, {
      modelCount: batchModelCount,
      shuffleQuestions: batchShuffleQuestions,
      shuffleOptions: batchShuffleOptions,
      schoolName: settings.name,
      className: activeClass?.name || 'Turma Regente',
      subjectName: activeExam.subject,
      teacherName: activeExam.teacherName,
      scheduledDate: new Date(activeExam.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR'),
      totalPoints: activeExam.totalPoints,
      timeLimitMinutes: activeExam.timeLimitMinutes,
    });
  }, [
    activeExam,
    questions,
    batchModelCount,
    batchShuffleQuestions,
    batchShuffleOptions,
    settings.name,
    activeClass?.name,
  ]);

  // Modelo atualmente visualizado na tela
  const currentPreviewVariant = useMemo(() => {
    if (activeModelTab === 'KEY') return examVariants[0];
    return examVariants.find((v) => v.modelLetter === activeModelTab) || examVariants[0];
  }, [examVariants, activeModelTab]);

  // Matriz comparativa de gabaritos em lote
  const comparativeKeyRows = useMemo(() => {
    return generateComparativeAnswerKey(examVariants);
  }, [examVariants]);

  // Questões disponíveis da disciplina para montagem
  const availableSubjectQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!activeSubject) return true;
      if (q.subjectId && q.subjectId === activeSubject.id) return true;
      const qSub = (q.subject || '').toLowerCase().trim();
      const actSub = (activeSubject.name || '').toLowerCase().trim();
      return (
        qSub === actSub ||
        qSub.includes(actSub) ||
        actSub.includes(qSub) ||
        (q.topic && q.topic.toLowerCase().includes(actSub))
      );
    });
  }, [questions, activeSubject]);

  // Impressão em Lote (Todos os Modelos + Gabarito Mestre)
  const handlePrintBatch = (variantsToPrint: ExamModelVariant[]) => {
    if (!activeExam) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify('Por favor, permita popups no navegador para emitir a impressão.');
      return;
    }

    const html = generateBatchPrintHtml(variantsToPrint, {
      modelCount: variantsToPrint.length,
      shuffleQuestions: batchShuffleQuestions,
      shuffleOptions: batchShuffleOptions,
      includeTeacherKeyInBatch,
      includeStudentBubbleSheets: true,
      customHeaderTitle: activeExam.title,
      customInstructions: newInstructions,
      schoolName: settings.name,
      className: classes.find((c) => c.id === activeExam.classId)?.name || 'Turma Regente',
      subjectName: activeExam.subject,
      teacherName: activeExam.teacherName,
      scheduledDate: new Date(activeExam.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR'),
      totalPoints: activeExam.totalPoints,
      timeLimitMinutes: activeExam.timeLimitMinutes,
      classId: activeExam.classId,
    });

    writeSafePrintDocument(printWindow, html, true, { classId: activeExam.classId });
  };

  // Impressão Exclusiva do Modelo Ativo
  const handlePrintSingleModel = (modelLetter: 'A' | 'B' | 'C' | 'D') => {
    const v = examVariants.find((m) => m.modelLetter === modelLetter);
    if (!v) return;
    handlePrintBatch([v]);
  };

  // Criação de Nova Avaliação Personalizada
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !activeSubject) return;

    let finalQuestionIds = [...selectedQuestionIds];

    // Se o professor preencheu uma questão inédita no modal, cria e adiciona
    if (showNewQuestionForm && customQuestionStem.trim()) {
      const customQId = `q-custom-${Date.now()}`;
      const newQuestionObj: Question = {
        id: customQId,
        code: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        stem: customQuestionStem.trim(),
        subject: activeSubject.name,
        subjectId: activeSubject.id,
        topic: 'Conteúdo do Docente',
        gradeLevel: activeClass.gradeLevel || '1º Ano',
        bnccSkill: customQuestionSkill.trim() || 'EM13MAT101',
        difficulty: 'MEDIO',
        type: 'MULTIPLE_CHOICE',
        options: customOptions.map((opt, idx) => ({
          id: `opt-${idx + 1}`,
          text: opt.text.trim() || 'Opção sem descrição',
          isCorrect: opt.isCorrect,
        })),
        explanation: customQuestionExplanation.trim() || 'Critério estabelecido pelo docente regente.',
        authorTeacher: teacherName || 'Docente Regente',
        tags: ['Inédita', 'Docente'],
        createdAt: new Date().toISOString(),
      };

      questions.unshift(newQuestionObj);
      finalQuestionIds.push(customQId);
    }

    if (finalQuestionIds.length === 0) {
      notify('Por favor, selecione ou crie ao menos 1 questão para a prova.');
      return;
    }

    const examId = `exam-${Date.now()}`;
    const pointsPerQuestion = Number((10.0 / finalQuestionIds.length).toFixed(2));

    const newExam: Exam = {
      id: examId,
      title: newTitle || `Avaliação Personalizada de ${activeSubject.name}`,
      description: `Prova em Lote referente ao ${selectedTerm} - Modelos Multi-Cadernos Anti-Cola`,
      subject: activeSubject.name,
      subjectId: activeSubject.id,
      classId: activeClass.id,
      teacherName: teacherName || activeSubject.teacherName || 'Docente Responsável',
      schoolYear: 2026,
      term: selectedTerm as any,
      totalPoints: 10.0,
      passingScore: newPassingScore,
      timeLimitMinutes: newDuration,
      randomizeQuestions: batchShuffleQuestions,
      randomizeOptions: batchShuffleOptions,
      questions: finalQuestionIds.map((qid) => ({
        questionId: qid,
        points: pointsPerQuestion,
      })),
      status: 'PUBLISHED',
      autoCorrectionRules: {
        partialCreditForKeywords: true,
        caseSensitive: false,
        negativeMarking: false,
        penaltyPerWrongOption: 0,
        allowReviewAfterSubmission: true,
        showExplanationInstantly: true,
      },
      scheduledDate: newExamDate,
      dueDateTime: `${newExamDate}T23:59:59`,
      createdAt: new Date().toISOString(),
    };

    onSaveExam(newExam);
    setSelectedExamId(examId);
    setShowCreateModal(false);

    // Reset Form
    setNewTitle('');
    setSelectedQuestionIds([]);
    setShowNewQuestionForm(false);
    setCustomQuestionStem('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Gerador de Avaliações, Provas em Lote &amp; Gabaritos
              </h3>
              <p className="text-xs text-slate-500">
                Elaboração de provas personalizadas com múltiplos cadernos (A, B, C, D), embaralhamento anti-cola e gabarito mestre.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Criar Prova Personalizada
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Provas da Turma + Painel de Modelos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de Provas da Turma (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avaliações da Turma ({teacherExams.length})
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {activeClass?.name}
            </span>
          </div>

          {teacherExams.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
              <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhuma avaliação cadastrada</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Clique no botão acima para criar a primeira prova com modelos em lote desta turma.
              </p>
            </div>
          ) : (
            teacherExams.map((exam) => {
              const isSelected = activeExam?.id === exam.id;
              return (
                <div
                  key={exam.id}
                  onClick={() => {
                    setSelectedExamId(exam.id);
                    setActiveModelTab('A');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        {exam.subject}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                        {exam.title}
                      </h5>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                      {exam.questions?.length || 0}Q
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(exam.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Layers className="h-3 w-3" />
                      {batchModelCount} Cadernos
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Coluna Direita: Gerenciador de Modelos em Lote & Pré-Visualização (8 cols) */}
        <div className="lg:col-span-8">
          {activeExam ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Top Details & Ações em Lote */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {activeExam.subject}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Turma: {classes.find((c) => c.id === activeExam.classId)?.name || 'Turma'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {activeExam.term || selectedTerm}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mt-2">
                    {activeExam.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeExam.description || 'Avaliação oficial bimestral com modelos múltiplos e alinhamento à BNCC'}
                  </p>
                </div>

                {/* Botões de Ação de Impressão */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Configurar variações e número de cadernos"
                  >
                    <Sliders className="h-4 w-4 text-slate-500" />
                    <span>Ajustar Lote</span>
                  </button>

                  <button
                    onClick={() => handlePrintBatch(examVariants)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Imprimir todos os modelos (A, B, C, D) e o gabarito mestre de uma só vez"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir Lote Completo ({examVariants.length} Modelos)</span>
                  </button>
                </div>
              </div>

              {/* SELETOR DE ABAS DE MODELOS (Caderno A, Caderno B, Caderno C, etc. + Gabarito Comparativo) */}
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {examVariants.map((v) => {
                      const isActive = activeModelTab === v.modelLetter;
                      return (
                        <button
                          key={v.modelLetter}
                          onClick={() => setActiveModelTab(v.modelLetter as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-2 ring-indigo-500/20'
                              : 'text-slate-600 hover:bg-slate-200/70 border border-transparent'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                          <span>Modelo {v.modelLetter}</span>
                          <span className="text-[10px] font-normal text-slate-400">({v.questions.length}Q)</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setActiveModelTab('KEY')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeModelTab === 'KEY'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Gabarito Mestre Comparativo</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeModelTab !== 'KEY' && (
                      <button
                        onClick={() => handlePrintSingleModel(activeModelTab as any)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title={`Imprimir apenas o Caderno ${activeModelTab}`}
                      >
                        <Printer className="h-3 w-3 text-slate-500" />
                        <span>Imprimir Caderno {activeModelTab}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CONTEÚDO DA ABA SELECIONADA */}
              {activeModelTab === 'KEY' ? (
                /* TABELA COMPARATIVA DE GABARITOS */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Gabarito Comparativo Entre Cadernos</div>
                      <div className="text-[11px] text-indigo-700 mt-0.5">
                        Esta tabela correlaciona a mesma questão pedagógica entre todos os cadernos gerados para correção rápida e sem confusão em sala de aula.
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="p-3 w-14 text-center">Orig.</th>
                          <th className="p-3">Enunciado &amp; Habilidade BNCC</th>
                          {examVariants.map((v) => (
                            <th key={v.modelLetter} className="p-3 text-center bg-indigo-50/50 text-indigo-900 border-l border-indigo-100">
                              Caderno {v.modelLetter}
                            </th>
                          ))}
                          <th className="p-3 text-center w-20">Pontos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comparativeKeyRows.map((row) => (
                          <tr key={row.originalIndex} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">
                              #{row.originalIndex}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800 line-clamp-1">
                                {row.questionStemPreview}
                              </div>
                              {row.bnccSkill && (
                                <span className="inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  BNCC: {row.bnccSkill}
                                </span>
                              )}
                            </td>
                            {examVariants.map((v) => {
                              const cell = row.models[v.modelLetter];
                              if (!cell) return <td key={v.modelLetter} className="p-3 text-center text-slate-400">-</td>;
                              return (
                                <td key={v.modelLetter} className="p-3 text-center border-l border-indigo-50">
                                  <div className="text-[10px] text-slate-500 font-medium">Q{cell.modelQuestionNumber}</div>
                                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs mt-0.5">
                                    {cell.correctLetter}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-3 text-center font-bold text-emerald-600">
                              {row.points.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* PRÉ-VISUALIZAÇÃO DA FOLHA DE PROVA DO CADERNO ATUAL */
                <div className="space-y-4">
                  {/* Resumo do Caderno */}
                  <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black">
                        {currentPreviewVariant.modelLetter}
                      </div>
                      <div>
                        <div className="text-sm font-bold">Folha de Prova: {currentPreviewVariant.modelLabel}</div>
                        <div className="text-xs text-slate-400">Código de Validação: {currentPreviewVariant.uniqueVariantCode}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                        {currentPreviewVariant.questions.length} Questões Formatadas
                      </span>
                    </div>
                  </div>

                  {/* Lista de Questões do Modelo */}
                  <div className="space-y-3">
                    {currentPreviewVariant.questions.map((q) => (
                      <div
                        key={q.modelQuestionNumber}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
                              Questão {q.modelQuestionNumber}
                            </span>
                            {q.bnccSkill && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                {q.bnccSkill}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              (Orig: #{q.originalIndex})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">
                              {q.points.toFixed(2)} pts
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Gabarito: {q.correctLetter}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {q.stem}
                        </p>

                        {q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 gap-1.5 pt-1 pl-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.newLetter}
                                className={`flex items-start gap-2 text-xs p-1.5 rounded-lg transition-colors ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                                    : 'text-slate-600'
                                }`}
                              >
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold shrink-0 ${
                                  opt.isCorrect ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-700'
                                }`}>
                                  {opt.newLetter}
                                </span>
                                <span className="pt-0.5">{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-400 italic">
                            Questão Discursiva - Espaço reservado para desenvolvimento e resposta manuscrita do estudante.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Award className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Selecione uma avaliação</h4>
              <p className="text-xs text-slate-400 mt-1">
                Escolha uma avaliação na lista à esquerda para visualizar seus modelos e gabaritos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CONFIGURAÇÃO DE MODELOS EM LOTE & EMBARALHAMENTO */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-indigo-600" />
                  Configuração de Modelos em Lote
                </h3>
                <p className="text-xs text-slate-500">
                  Defina as variações de impressão anti-cola e número de cadernos.
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quantidade de Modelos */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantidade de Cadernos / Modelos:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setBatchModelCount(count)}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                        batchModelCount === count
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {count} Modelos ({['A, B', 'A, B, C', 'A, B, C, D'][count - 2]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Variações Anti-Cola */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Mecanismos Anti-Cola Ativos:
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={batchShuffleQuestions}
                    onChange={(e) => setBatchShuffleQuestions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Embaralhar Ordem das Questões</span>
                    <span className="text-[11px] text-slate-500">
                      A questão 1 do Caderno A se torna outra posição no Caderno B, impedindo consultas simultâneas.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={batchShuffleOptions}
                    onChange={(e) => setBatchShuffleOptions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Embaralhar Alternativas (A, B, C, D)</span>
                    <span className="text-[11px] text-slate-500">
                      A alternativa correta varia de letra em cada caderno, com gabarito matematicamente mapeado.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeTeacherKeyInBatch}
                    onChange={(e) => setIncludeTeacherKeyInBatch(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Incluir Gabarito Mestre no Final da Impressão</span>
                    <span className="text-[11px] text-slate-500">
                      Gera automaticamente a folha do professor com tabela comparativa de todos os cadernos.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Concluir &amp; Aplicar ao Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVA AVALIAÇÃO PERSONALIZADA (Com Banco de Questões + Questão Inédita) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                  Criar Avaliação Personalizada
                </h3>
                <p className="text-xs text-slate-500">
                  Turma: {activeClass?.name} • Componente: {activeSubject?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Título da Avaliação: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1ª Avaliação Bimestral - Matemática e Raciocínio Lógico"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Data de Aplicação:
                  </label>
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Duração (minutos):
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nota de Corte (Aprovação):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newPassingScore}
                    onChange={(e) => setNewPassingScore(Number(e.target.value))}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Instruções da Prova */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Orientações ao Estudante (Cabeçalho da Prova):
                </label>
                <textarea
                  rows={2}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  placeholder="Orientações de preenchimento, caneta azul/preta, duração e regras..."
                />
              </div>

              {/* Seleção do Banco de Questões */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Banco de Questões ({selectedQuestionIds.length} selecionadas de {availableSubjectQuestions.length}):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedQuestionIds.length === availableSubjectQuestions.length) {
                        setSelectedQuestionIds([]);
                      } else {
                        setSelectedQuestionIds(availableSubjectQuestions.map((q) => q.id));
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 cursor-pointer hover:underline"
                  >
                    {selectedQuestionIds.length === availableSubjectQuestions.length
                      ? 'Desmarcar Todas'
                      : 'Selecionar Todas'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl">
                  {availableSubjectQuestions.map((q) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                          } else {
                            setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                          }
                        }}
                        className={`p-2.5 flex items-start gap-2.5 text-xs hover:bg-slate-100 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/70 font-semibold' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700">{q.subject}</span>
                            {q.bnccSkill && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-mono">
                                {q.bnccSkill}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-700 line-clamp-2 mt-0.5">{q.stem}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão de Questão Inédita */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showNewQuestionForm ? 'Ocultar Questão Inédita' : '+ Adicionar Questão Própria Inédita Nesta Prova'}</span>
                </button>

                {showNewQuestionForm && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Enunciado da Questão:
                      </label>
                      <textarea
                        rows={2}
                        value={customQuestionStem}
                        onChange={(e) => setCustomQuestionStem(e.target.value)}
                        placeholder="Digite o enunciado completo da pergunta..."
                        className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-2.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Código BNCC / Descritor:
                        </label>
                        <input
                          type="text"
                          value={customQuestionSkill}
                          onChange={(e) => setCustomQuestionSkill(e.target.value)}
                          className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Justificativa do Gabarito:
                        </label>
                        <input
                          type="text"
                          value={customQuestionExplanation}
                          onChange={(e) => setCustomQuestionExplanation(e.target.value)}
                          placeholder="Explicação pedagógica da resposta correta"
                          className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Alternativas (Selecione a Correta):
                      </label>
                      <div className="space-y-1.5">
                        {customOptions.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correct_option_radio"
                              checked={opt.isCorrect}
                              onChange={() => {
                                setCustomOptions(
                                  customOptions.map((o, idx) => ({
                                    ...o,
                                    isCorrect: idx === oIdx,
                                  }))
                                );
                              }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-bold text-slate-500 w-4">
                              {String.fromCharCode(65 + oIdx)})
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const newOpts = [...customOptions];
                                newOpts[oIdx].text = e.target.value;
                                setCustomOptions(newOpts);
                              }}
                              placeholder={`Texto da alternativa ${String.fromCharCode(65 + oIdx)}...`}
                              className="flex-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Gerar Avaliação &amp; Montar Modelos em Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
