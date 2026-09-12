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

  // New Exam Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newExamDate, setNewExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newDuration, setNewDuration] = useState<number>(90);
  const [newPassingScore, setNewPassingScore] = useState<number>(7.0);
  const [newInstructions, setNewInstructions] = useState<string>(
    'Leia atentamente cada questão. Preencha o cartão-resposta com caneta esferográfica preta ou azul.'
  );
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Filter exams for teacher / active class
  const teacherExams = useMemo(() => {
    return exams.filter(
      (e) =>
        e.classId === activeClass?.id ||
        (e.teacherName && e.teacherName.toLowerCase().includes(teacherName.toLowerCase())) ||
        (e.subject && activeSubject && e.subject.toLowerCase() === activeSubject.name.toLowerCase())
    );
  }, [exams, activeClass?.id, teacherName, activeSubject]);

  const activeExam = useMemo(() => {
    if (selectedExamId) {
      return exams.find((e) => e.id === selectedExamId) || teacherExams[0];
    }
    return teacherExams[0];
  }, [exams, selectedExamId, teacherExams]);

  const examQuestions = useMemo(() => {
    if (!activeExam || !activeExam.questions) return [];
    return activeExam.questions
      .map((cfg) => questions.find((q) => q.id === cfg.questionId))
      .filter(Boolean) as Question[];
  }, [activeExam, questions]);

  // Questions available for adding
  const availableSubjectQuestions = useMemo(() => {
    return questions.filter(
      (q) =>
        !activeSubject ||
        q.subject.toLowerCase() === activeSubject.name.toLowerCase() ||
        q.topic.toLowerCase().includes(activeSubject.name.toLowerCase())
    );
  }, [questions, activeSubject]);

  // Create Quick Exam Handler
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !activeSubject) return;

    if (selectedQuestionIds.length === 0) {
      alert('Por favor, selecione ao menos uma questão para compor a prova.');
      return;
    }

    const examId = `exam-${Date.now()}`;
    const pointsPerQuestion = Number((10.0 / selectedQuestionIds.length).toFixed(2));

    const newExam: Exam = {
      id: examId,
      title: newTitle || `Avaliação Bimestral de ${activeSubject.name}`,
      description: `Prova referente ao ${selectedTerm} - Ano Letivo 2026`,
      subject: activeSubject.name,
      classId: activeClass.id,
      teacherName: teacherName || activeSubject.teacherName || 'Docente Responsável',
      schoolYear: 2026,
      term: selectedTerm as any,
      totalPoints: 10.0,
      passingScore: newPassingScore,
      timeLimitMinutes: newDuration,
      randomizeQuestions: false,
      randomizeOptions: false,
      questions: selectedQuestionIds.map((qid) => ({
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
    // Reset
    setNewTitle('');
    setSelectedQuestionIds([]);
  };

  // Print Exam Paper
  const handlePrintExamPaper = (exam: Exam) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qList = exam.questions
      .map((cfg) => questions.find((q) => q.id === cfg.questionId))
      .filter(Boolean) as Question[];

    const examClassName = classes.find((c) => c.id === exam.classId)?.name || 'Turma Regente';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Avaliação Oficial - ${exam.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10.5pt; color: #0f172a; margin: 0; padding: 20px; line-height: 1.5; }
          .header-box { border: 2px solid #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 20px; }
          .school-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; text-align: center; }
          .exam-title { font-size: 11.5pt; font-weight: bold; text-align: center; margin-top: 4px; color: #1e293b; }
          .student-fields { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-top: 12px; font-size: 9.5pt; border-top: 1px solid #cbd5e1; padding-top: 8px; }
          .instructions-box { background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px; font-size: 9pt; margin-bottom: 20px; }
          .question-block { margin-bottom: 20px; page-break-inside: avoid; }
          .q-header { font-weight: bold; font-size: 10.5pt; color: #0f172a; margin-bottom: 6px; display: flex; justify-content: space-between; }
          .q-text { font-size: 10pt; color: #334155; margin-bottom: 10px; }
          .options-grid { display: grid; grid-template-columns: 1fr; gap: 6px; font-size: 9.5pt; }
          .opt-item { display: flex; align-items: flex-start; gap: 8px; }
          .opt-letter { font-weight: bold; border: 1px solid #0f172a; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 8.5pt; shrink: 0; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="school-title">${settings.name}</div>
          <div class="exam-title">${exam.title}</div>
          <div class="student-fields">
            <div><strong>Estudante:</strong> ________________________________________________</div>
            <div><strong>Nº / Turma:</strong> ___ / ${examClassName}</div>
            <div><strong>Data:</strong> ${new Date(exam.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9pt; margin-top: 6px; color: #475569;">
            <div><strong>Componente:</strong> ${exam.subject}</div>
            <div><strong>Docente:</strong> ${exam.teacherName}</div>
            <div><strong>Valor da Prova:</strong> ${exam.totalPoints.toFixed(1)} pts</div>
          </div>
        </div>

        <div class="instructions-box">
          <strong>Orientações para Realização da Avaliação:</strong>
          <ul style="margin: 4px 0 0 0; padding-left: 18px;">
            <li>Duração máxima: ${exam.timeLimitMinutes} minutos.</li>
            <li>Utilize caneta esferográfica azul ou preta para preencher a folha de respostas oficial.</li>
            <li>Não é permitida a comunicação entre estudantes ou consulta a materiais não autorizados.</li>
          </ul>
        </div>

        ${qList
          .map(
            (q, idx) => `
          <div class="question-block">
            <div class="q-header">
              <span>Questão ${idx + 1} ${q.bnccSkill ? `[BNCC: ${q.bnccSkill}]` : ''}</span>
              <span style="font-size: 9pt; color: #64748b;">(Valor: ${(exam.totalPoints / (qList.length || 1)).toFixed(2)} pts)</span>
            </div>
            <div class="q-text">${q.stem}</div>
            ${
              q.options && q.options.length > 0
                ? `
              <div class="options-grid">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <div class="opt-item">
                    <div class="opt-letter">${String.fromCharCode(65 + oIdx)}</div>
                    <div>${opt.text}</div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : `
              <div style="border: 1px dashed #cbd5e1; height: 100px; border-radius: 4px; padding: 6px; font-size: 8.5pt; color: #94a3b8;">
                [Espaço reservado para resolução e resposta do estudante]
              </div>
            `
            }
          </div>
        `
          )
          .join('')}

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print Answer Key (Gabarito Oficial e Cartão-Resposta)
  const handlePrintAnswerCardAndKey = (exam: Exam) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qList = exam.questions
      .map((cfg) => questions.find((q) => q.id === cfg.questionId))
      .filter(Boolean) as Question[];

    const examClassName = classes.find((c) => c.id === exam.classId)?.name || 'Turma Regente';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Gabarito Oficial & Cartão-Resposta - ${exam.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 9.5pt; color: #0f172a; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
          .title { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
          .comment-box { background: #f8fafc; border-left: 3px solid #6366f1; padding: 6px 10px; margin-top: 4px; font-size: 8.5pt; color: #334155; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${settings.name}</div>
          <div style="font-size: 11pt; font-weight: bold; margin-top: 2px;">GABARITO OFICIAL & RESOLUÇÃO COMENTADA DO PROFESSOR</div>
          <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">
            ${exam.title} • Turma: ${examClassName} • Componente: ${exam.subject} • Docente: ${exam.teacherName}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            1. Grade Resumida de Respostas Corretas
          </h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
            ${qList
              .map((q, idx) => {
                const correctIdx = q.options?.findIndex((o) => o.isCorrect) ?? -1;
                const correctLetter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : 'DISC';
                return `
                <div style="background: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
                  <div style="font-size: 7.5pt; font-weight: bold; color: #4338ca;">Q${idx + 1}</div>
                  <div style="font-size: 13pt; font-weight: black; color: #1e1b4b;">${correctLetter}</div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <div>
          <h3 style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            2. Resoluções Pedagógicas e Habilidades BNCC
          </h3>
          <div style="margin-top: 10px;">
            ${qList
              .map((q, idx) => {
                const correctIdx = q.options?.findIndex((o) => o.isCorrect) ?? -1;
                const correctLetter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : 'Discursiva';
                return `
                <div style="margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Questão ${idx + 1} • Alternativa Correta: <strong style="color: #4338ca; font-size: 11pt;">(${correctLetter})</strong></span>
                    <span style="font-size: 8pt; color: #6366f1; background: #eef2ff; padding: 2px 6px; border-radius: 4px;">${q.bnccSkill || 'Habilidade Geral'}</span>
                  </div>
                  <div style="margin-top: 4px; font-size: 9pt; color: #334155;"><strong>Enunciado:</strong> ${q.stem}</div>
                  <div class="comment-box">
                    <strong>Justificativa Pedagógica do Gabarito:</strong><br>
                    ${q.explanation || 'A alternativa indicada atende integralmente aos critérios conceituais avaliados.'}
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Provas, Simulados e Gabaritos Oficiais
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de avaliações, visualização de gabaritos comentados e impressão oficial de cartões-resposta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova Avaliação do Docente
          </button>
        </div>
      </div>

      {/* Main Grid: Exams List + Active Exam Details / Gabarito */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Exams (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Avaliações da Turma ({teacherExams.length})
          </h4>

          {teacherExams.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
              <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhuma avaliação cadastrada</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Clique no botão acima para criar a primeira prova desta turma.
              </p>
            </div>
          ) : (
            teacherExams.map((exam) => {
              const isSelected = activeExam?.id === exam.id;
              return (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
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
                    <span className="font-bold text-indigo-600">
                      {exam.totalPoints.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Exam Details, Gabarito & Actions (8 cols) */}
        <div className="lg:col-span-8">
          {activeExam ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Header Box */}
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
                  <p className="text-xs text-slate-500 mt-1">
                    {activeExam.description || 'Avaliação oficial bimestral com alinhamento à BNCC'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handlePrintExamPaper(activeExam)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Prova
                  </button>

                  <button
                    onClick={() => handlePrintAnswerCardAndKey(activeExam)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="h-4 w-4" />
                    Gabarito & Resolução
                  </button>
                </div>
              </div>

              {/* Quick Exam Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Questões</span>
                  <span className="text-base font-black text-slate-900">{examQuestions.length}</span>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900">
                  <span className="text-[10px] text-indigo-600 font-bold uppercase block">Valor Total</span>
                  <span className="text-base font-black text-indigo-700">{activeExam.totalPoints.toFixed(1)} pts</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Duração</span>
                  <span className="text-base font-black text-emerald-700">{activeExam.timeLimitMinutes} min</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                  <span className="text-[10px] text-amber-600 font-bold uppercase block">Média de Corte</span>
                  <span className="text-base font-black text-amber-700">{activeExam.passingScore.toFixed(1)} pts</span>
                </div>
              </div>

              {/* Gabarito Resumido Oficial Bar */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                      Gabarito Oficial Rápido
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-300">Grade de Respostas</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {examQuestions.map((q, idx) => {
                    const cIdx = q.options?.findIndex((o) => o.isCorrect) ?? -1;
                    const letter = cIdx >= 0 ? String.fromCharCode(65 + cIdx) : 'DISC';
                    return (
                      <div
                        key={q.id}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-center min-w-[52px]"
                      >
                        <span className="block text-[9px] font-bold text-slate-400">Q{idx + 1}</span>
                        <span className="text-sm font-black text-emerald-400">
                          {letter}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Questions Detailed List with Explanations */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Itens da Avaliação & Justificativas do Docente
                </h5>

                <div className="space-y-4">
                  {examQuestions.map((question, idx) => {
                    const cIdx = question.options?.findIndex((o) => o.isCorrect) ?? -1;
                    const letter = cIdx >= 0 ? String.fromCharCode(65 + cIdx) : 'Discursiva';

                    return (
                      <div
                        key={question.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-indigo-600 text-sm">
                              Questão {idx + 1}
                            </span>
                            {question.bnccSkill && (
                              <span className="ml-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                {question.bnccSkill}
                              </span>
                            )}
                          </div>

                          <span className="text-emerald-700 bg-emerald-100 font-extrabold px-2.5 py-0.5 rounded-full text-[11px]">
                            Correta: ({letter})
                          </span>
                        </div>

                        <p className="text-slate-800 font-medium leading-relaxed">
                          {question.stem}
                        </p>

                        {question.options && question.options.length > 0 && (
                          <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                            {question.options.map((opt, oIdx) => {
                              const optLetter = String.fromCharCode(65 + oIdx);
                              const isCorrect = opt.isCorrect;
                              return (
                                <div
                                  key={opt.id || oIdx}
                                  className={`flex items-start gap-2 p-1.5 rounded-lg ${
                                    isCorrect ? 'bg-emerald-100/70 font-bold text-emerald-900' : 'text-slate-600'
                                  }`}
                                >
                                  <span className="font-bold shrink-0">{optLetter})</span>
                                  <span>{opt.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Pedagogical Justification */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
                          <span className="font-bold text-indigo-600 block text-[11px] mb-0.5">
                            Justificativa Pedagógica do Gabarito:
                          </span>
                          <p className="text-[11px] text-slate-600">
                            {question.explanation ||
                              'A alternativa selecionada atende integralmente à habilidade avaliada.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Award className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Selecione uma avaliação</h4>
              <p className="text-xs text-slate-500 mt-1">
                Escolha uma prova na lista ao lado para visualizar os detalhes, gabaritos e emitir cartões-resposta.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Quick Exam */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Criar Nova Avaliação / Simulado
                </h3>
                <p className="text-xs text-slate-500">
                  Turma: {activeClass?.name} • Disciplina: {activeSubject?.name}
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
                  placeholder="Ex: Prova Bimestral de Matemática - Sistemas & Matrizes"
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
                    Nota de Corte:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPassingScore}
                    onChange={(e) => setNewPassingScore(Number(e.target.value))}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Questions Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Selecione as Questões do Banco ({selectedQuestionIds.length} selecionadas):
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
                    className="text-[11px] font-bold text-indigo-600 cursor-pointer"
                  >
                    {selectedQuestionIds.length === availableSubjectQuestions.length
                      ? 'Desmarcar Todas'
                      : 'Selecionar Todas'}
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl">
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
                  Gerar Avaliação & Gabarito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
