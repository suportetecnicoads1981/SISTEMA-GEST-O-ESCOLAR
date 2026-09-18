import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Exam, Question, Student, ExamSubmission, ExamAnswer } from '../../types';
import { gradeExamSubmission } from '../../data/storage';
import {
  saveExamDraft,
  getExamDraft,
  clearExamDraft,
  ExamDraftRecord,
} from '../../services/examIndexedDbService';

interface StudentExamRoomProps {
  exam: Exam;
  questions: Question[];
  students: Student[];
  onFinishSubmission: (submission: ExamSubmission) => void;
  onExit: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({
  exam,
  questions,
  students,
  onFinishSubmission,
  onExit,
  onNavigate,
}) => {
  // Available questions in this exam
  const examQuestions = useMemo(() => {
    return exam.questions
      .map((config) => {
        const fullQ = questions.find((q) => q.id === config.questionId);
        return fullQ ? { ...fullQ, points: config.points } : null;
      })
      .filter((q): q is Question & { points: number } => q !== null);
  }, [exam, questions]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-1'
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; essayText?: string }>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.timeLimitMinutes * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Resiliência de Rede & Auto-Save IndexedDB com Last-Write-Wins (LWW)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const [draftRestoredMsg, setDraftRestoredMsg] = useState<string | null>(null);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentQ = examQuestions[currentQuestionIndex];

  // Monitorar conectividade de rede sem interromper a prova
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar e carregar rascunho salvo anteriormente via Last-Write-Wins (LWW)
  useEffect(() => {
    if (!exam.id || !selectedStudentId) return;

    let isMounted = true;
    getExamDraft(exam.id, selectedStudentId).then((draft) => {
      if (!isMounted || !draft) return;
      if (Object.keys(draft.answers || {}).length > 0 || draft.timeLeftSeconds > 0) {
        setAnswers(draft.answers || {});
        if (draft.timeLeftSeconds > 10 && draft.timeLeftSeconds < exam.timeLimitMinutes * 60) {
          setTimeLeftSeconds(draft.timeLeftSeconds);
        }
        if (typeof draft.currentQuestionIndex === 'number') {
          setCurrentQuestionIndex(Math.min(draft.currentQuestionIndex, examQuestions.length - 1));
        }
        const savedTime = draft.lastSavedAt ? new Date(draft.lastSavedAt).toLocaleTimeString('pt-BR') : '';
        setDraftRestoredMsg(`Rascunho recuperado via IndexedDB/LocalStorage (LWW) salvo às ${savedTime}`);
        setLastSavedTimestamp(savedTime);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [exam.id, selectedStudentId, examQuestions.length, exam.timeLimitMinutes]);

  // Rotina de Auto-Save Periódico a cada 30 segundos no IndexedDB
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    const interval = setInterval(() => {
      triggerDraftAutoSave();
    }, 30000); // 30 segundos cravados

    return () => clearInterval(interval);
  }, [hasStarted, isFinished, answers, timeLeftSeconds, currentQuestionIndex, selectedStudentId]);

  const triggerDraftAutoSave = async () => {
    if (!hasStarted || isFinished) return;
    try {
      setAutoSaveStatus('SAVING');
      await saveExamDraft({
        examId: exam.id,
        studentId: selectedStudentId,
        studentName: currentStudent.name,
        answers,
        timeLeftSeconds,
        currentQuestionIndex,
        lastSavedAt: new Date().toISOString(),
        isSyncedWithServer: isOnline,
      });
      const nowStr = new Date().toLocaleTimeString('pt-BR');
      setLastSavedTimestamp(nowStr);
      setAutoSaveStatus('SAVED');
      setTimeout(() => setAutoSaveStatus('IDLE'), 2500);
    } catch (err) {
      console.error('Falha no auto-save da prova:', err);
      setAutoSaveStatus('IDLE');
    }
  };

  // Timer countdown: continua correndo normalmente mesmo se offline
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isFinished]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          selectedOptionId: optionId,
        },
      };
      // Salva imediatamente em background
      saveExamDraft({
        examId: exam.id,
        studentId: selectedStudentId,
        studentName: currentStudent.name,
        answers: next,
        timeLeftSeconds,
        currentQuestionIndex,
        lastSavedAt: new Date().toISOString(),
        isSyncedWithServer: isOnline,
      }).catch(() => {});
      return next;
    });
  };

  const handleEssayChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        essayText: text,
      },
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    const rawAnswers: ExamAnswer[] = examQuestions.map((q) => {
      const ans = answers[q.id];
      return {
        questionId: q.id,
        selectedOptionId: ans?.selectedOptionId,
        essayAnswerText: ans?.essayText,
        timeSpentSeconds: Math.floor((exam.timeLimitMinutes * 60 - timeLeftSeconds) / examQuestions.length),
        isCorrect: false,
        earnedScore: 0,
      };
    });

    const graded = gradeExamSubmission(exam, questions, rawAnswers, selectedStudentId);
    setSubmissionResult(graded);
    setIsFinished(true);

    // Limpar rascunho persistido após conclusão bem-sucedida
    try {
      await clearExamDraft(exam.id, selectedStudentId);
    } catch {}

    onFinishSubmission(graded);
  };

  // 1. Initial Start Screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Ambiente Seguro de Aplicação de Provas
          </span>
          <h1 className="text-2xl font-black text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500">{exam.description}</p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
          <label className="block font-bold text-slate-800">
            Identifique o Estudante para Realização:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:ring-2 focus:ring-indigo-500"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} (RA: {st.enrollmentNumber} • {st.status})
              </option>
            ))}
          </select>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tempo Limite:</span>
            <span className="font-bold text-indigo-900 text-sm flex items-center gap-1 mt-0.5">
              <Clock className="h-4 w-4 text-indigo-600" />
              {exam.timeLimitMinutes} minutos
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total de Questões:</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5">{examQuestions.length} questões</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-800 uppercase font-bold block">Nota Total:</span>
            <span className="font-bold text-emerald-800 text-sm mt-0.5">{exam.totalPoints} pontos</span>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            Orientações de Realização:
          </p>
          <p className="text-[11px] text-amber-800">
            • O cronômetro iniciará assim que clicar em Iniciar Prova.
            <br />
            • A correção será realizada instantaneamente pelo sistema ao finalizar.
            <br />
            • Responda com atenção e revise antes de submeter.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate ? onNavigate('MAIN_DASHBOARD') : onExit()}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Início</span>
            </button>
            <button
              onClick={onExit}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Voltar para Provas
            </button>
          </div>
          <button
            onClick={() => setHasStarted(true)}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 cursor-pointer"
          >
            <span>Iniciar Avaliação Agora</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Result & Feedback Screen (Instant Auto-Correction)
  if (isFinished && submissionResult) {
    const isApproved = submissionResult.totalScore >= exam.passingScore;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Results Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Avaliação Corrigida Automaticamente
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Resultado Instantâneo do Estudante
              </h1>
              <p className="text-xs text-slate-500">
                {currentStudent.name} • {exam.title} ({exam.subject})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate ? onNavigate('MAIN_DASHBOARD') : onExit()}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer no-print"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Início</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer no-print"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Espelho</span>
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md no-print cursor-pointer"
              >
                Voltar para Provas
              </button>
            </div>
          </div>

          {/* Big Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div
              className={`p-5 rounded-2xl border text-center ${
                isApproved
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider block">Nota Final</span>
              <p className="text-4xl font-black mt-1">
                {submissionResult.totalScore.toFixed(1)}{' '}
                <span className="text-sm font-normal text-slate-500">/ {exam.totalPoints}</span>
              </p>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isApproved ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {isApproved ? 'Atingiu a Média' : 'Abaixo da Média'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Acertos / Erros</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                <span className="text-emerald-700">{submissionResult.correctCount} corretas</span> •{' '}
                <span className="text-rose-600">{submissionResult.incorrectCount} erros</span>
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Aproveitamento: {Math.round((submissionResult.totalScore / exam.totalPoints) * 100)}%
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tempo Gasto</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {Math.floor(submissionResult.timeSpentSeconds / 60)} min {submissionResult.timeSpentSeconds % 60} seg
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Limite: {exam.timeLimitMinutes} min
              </span>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 flex flex-col justify-center">
              <span className="text-[10px] text-indigo-900 uppercase font-bold">Diagnóstico Pedagógico</span>
              <p className="text-xs font-semibold text-indigo-950 mt-1 leading-snug">
                {submissionResult.commonMistakesIdentified.length > 0
                  ? `${submissionResult.commonMistakesIdentified.length} pontos de atenção identificados`
                  : 'Excelente domínio dos tópicos avaliados!'}
              </p>
            </div>
          </div>

          {/* Common Mistakes & Misconception Breakdown */}
          {submissionResult.commonMistakesIdentified.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Diagnóstico de Equívocos Frequentes & Distratores Assinalados:
              </h3>
              <ul className="space-y-1.5 text-xs text-amber-900">
                {submissionResult.commonMistakesIdentified.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Question by Question Review */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              Espelho da Correção & Resolução Comentada por Item
            </h3>

            <div className="space-y-4">
              {examQuestions.map((q, idx) => {
                const ans = submissionResult.answers.find((a) => a.questionId === q.id);
                const isCorrect = ans?.isCorrect;
                const earned = ans?.earnedScore || 0;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border text-xs space-y-3 ${
                      isCorrect
                        ? 'bg-white border-emerald-200'
                        : 'bg-white border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{q.subject} • {q.topic}</span>
                        {q.bnccSkill && (
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {q.bnccSkill}
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        Nota: {earned.toFixed(2)} / {q.points.toFixed(2)} pts
                      </span>
                    </div>

                    <p className="text-slate-800 text-xs sm:text-sm font-medium">{q.stem}</p>

                    {/* Multiple choice options analysis */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isStudentSelected = ans?.selectedOptionId === opt.id;
                          const isGabarito = opt.isCorrect;

                          let badgeStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                          if (isGabarito) {
                            badgeStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                          }
                          if (isStudentSelected && !isGabarito) {
                            badgeStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-semibold';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${badgeStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">
                                  {String.fromCharCode(65 + optIdx)})
                                </span>
                                <span>{opt.text}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isStudentSelected && (
                                  <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-bold">
                                    Sua Escolha
                                  </span>
                                )}
                                {isGabarito && (
                                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                                    ✓ Gabarito
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Essay answer and feedback */}
                    {q.type === 'ESSAY_KEYWORD' && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                        <p className="font-bold text-slate-800">Resposta do Aluno:</p>
                        <p className="italic text-slate-700">{ans?.essayAnswerText || 'Em branco'}</p>
                      </div>
                    )}

                    {/* Feedback and explanation */}
                    {ans?.feedback && (
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1">
                        <span className="font-bold text-indigo-900 block">
                          💡 Comentário Pedagógico & Explicação Oficial:
                        </span>
                        <p className="text-slate-700">{ans.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Test Taking Screen
  const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;
  const isTimeLow = timeLeftSeconds <= 300; // less than 5 min

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header / Timer Bar */}
      <div className="sticky top-2 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">{exam.title}</h2>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Modo Offline (Auto-Save Ativo)
              </span>
            )}
            {lastSavedTimestamp && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                • Salvo às {lastSavedTimestamp} (IndexedDB)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Estudante: <strong className="text-slate-800">{currentStudent.name}</strong> • Questão{' '}
            {currentQuestionIndex + 1} de {examQuestions.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {autoSaveStatus === 'SAVING' && (
            <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Gravando...
            </span>
          )}
          {autoSaveStatus === 'SAVED' && (
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Salvo
            </span>
          )}

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-sm border transition-colors ${
              isTimeLow
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Alerta de Rascunho Recuperado (LWW) */}
      {draftRestoredMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {draftRestoredMsg}
          </span>
          <button
            onClick={() => setDraftRestoredMsg(null)}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Question Selector Quick Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
          Navegador:
        </span>
        {examQuestions.map((q, idx) => {
          const isAnswered =
            !!answers[q.id]?.selectedOptionId || !!answers[q.id]?.essayText?.trim();
          const isCurrent = idx === currentQuestionIndex;

          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`h-8 w-8 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Current Question Card */}
      {currentQ && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                Questão {currentQuestionIndex + 1}
              </span>
              <span className="text-xs font-bold text-slate-800">{currentQ.subject}</span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-600">{currentQ.topic}</span>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
              Vale: {currentQ.points} pts
            </span>
          </div>

          {/* Enunciado */}
          <div className="text-sm sm:text-base text-slate-900 leading-relaxed font-medium">
            {currentQ.stem}
          </div>

          {/* Options (Multiple choice or True/False) */}
          {(currentQ.type === 'MULTIPLE_CHOICE' || currentQ.type === 'TRUE_FALSE') && (
            <div className="space-y-3 pt-2">
              {currentQ.options?.map((option, optIdx) => {
                const isSelected = answers[currentQ.id]?.selectedOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(currentQ.id, option.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-600/30'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-800'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-xs sm:text-sm">{option.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Essay Answer */}
          {currentQ.type === 'ESSAY_KEYWORD' && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Sua Resposta Dissertativa / Resolução:
              </label>
              <textarea
                rows={5}
                value={answers[currentQ.id]?.essayText || ''}
                onChange={(e) => handleEssayChange(currentQ.id, e.target.value)}
                placeholder="Desenvolva sua resposta explicitando conceitos e justificativas..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
              />
              <p className="text-[11px] text-slate-400">
                Caracteres: {(answers[currentQ.id]?.essayText || '').length} • Palavras:{' '}
                {(answers[currentQ.id]?.essayText || '').split(/\s+/).filter(Boolean).length}
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Finalizar e Corrigir Prova</span>
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))
                }
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Próxima Questão</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
