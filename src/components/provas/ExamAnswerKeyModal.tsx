import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BookOpen,
  Award,
  Calendar,
  Clock,
  User,
  School,
  Check,
  FileCheck,
  QrCode,
  Layers,
} from 'lucide-react';
import { Exam, Question, SchoolClass, SchoolSettings } from '../../types';

interface ExamAnswerKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  questions: Question[];
  schoolClass?: SchoolClass;
  settings: SchoolSettings;
}

export const ExamAnswerKeyModal: React.FC<ExamAnswerKeyModalProps> = ({
  isOpen,
  onClose,
  exam,
  questions,
  schoolClass,
  settings,
}) => {
  const [activeView, setActiveView] = useState<'EXAM_SHEET' | 'STUDENT_BUBBLE_SHEET' | 'TEACHER_KEY'>('TEACHER_KEY');

  if (!isOpen) return null;

  // Map exam questions configs with full question objects
  const resolvedQuestions = exam.questions.map((eq, index) => {
    const fullQ = questions.find((q) => q.id === eq.questionId);
    return {
      index: index + 1,
      points: eq.points || Number((exam.totalPoints / exam.questions.length).toFixed(2)),
      timeLimitSeconds: eq.timeLimitSeconds || 180,
      question: fullQ,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const exportData = {
      examTitle: exam.title,
      subject: exam.subject,
      schoolYear: exam.schoolYear,
      term: exam.term,
      totalPoints: exam.totalPoints,
      passingScore: exam.passingScore,
      timeLimitMinutes: exam.timeLimitMinutes,
      generatedAt: new Date().toISOString(),
      answerKey: resolvedQuestions.map((rq) => {
        const correctOpt = rq.question?.options.find((o) => o.isCorrect);
        const correctIndex = rq.question?.options.findIndex((o) => o.isCorrect);
        const letter = correctIndex !== undefined && correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'N/A';
        return {
          questionNumber: rq.index,
          code: rq.question?.code,
          type: rq.question?.type,
          points: rq.points,
          bnccSkill: rq.question?.bnccSkill,
          correctOptionLetter: letter,
          correctOptionText: correctOpt?.text,
          modelAnswer: rq.question?.modelAnswer,
          essayKeywords: rq.question?.essayKeywords,
          explanation: rq.question?.explanation,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gabarito_Oficial_${exam.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Caderno de Avaliação & Gabarito Oficial de Correção
              </h3>
              <p className="text-xs text-slate-400">
                {exam.title} • {exam.subject} ({schoolClass?.name || 'Turma Geral'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveView('TEACHER_KEY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'TEACHER_KEY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📑 Gabarito do Professor
              </button>
              <button
                onClick={() => setActiveView('EXAM_SHEET')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'EXAM_SHEET'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📝 Caderno de Questões
              </button>
              <button
                onClick={() => setActiveView('STUDENT_BUBBLE_SHEET')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'STUDENT_BUBBLE_SHEET'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📋 Folha de Respostas (Cartão)
              </button>
            </div>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Exportar Gabarito em Formato JSON"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Exportar JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 print:bg-white print:p-0">
          {/* INSTITUTIONAL HEADER (appears on all printed views) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 print:rounded-none print:border-b-2 print:border-black print:p-4 print:shadow-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 print:border-black print:pb-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl print:border print:border-black">
                  🏛️
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight print:text-black">
                    {settings.name || 'COLÉGIO INTEGRADO EDUGESTÃO'}
                  </h1>
                  <p className="text-xs text-slate-500 print:text-slate-700">
                    {settings.city}/{settings.state} • Portaria de Autorização CEE/MEC • CNPJ {settings.cnpj || '00.000.000/0001-00'}
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right text-xs">
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider text-[10px] print:text-black print:border-black print:bg-transparent">
                  {activeView === 'TEACHER_KEY' && 'ESPELHO DE CORREÇÃO & GABARITO DO PROFESSOR'}
                  {activeView === 'EXAM_SHEET' && 'CADERNO OFICIAL DE QUESTÕES'}
                  {activeView === 'STUDENT_BUBBLE_SHEET' && 'FOLHA DE RESPOSTAS (CARTÃO DE GABARITO)'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 print:text-black">
                  Ano Letivo: <strong>{exam.schoolYear}</strong> • Período: <strong>{exam.term}</strong>
                </p>
              </div>
            </div>

            {/* Exam Meta Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-4 pt-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-black">Disciplina:</span>
                <span className="font-bold text-slate-900 print:text-black">{exam.subject}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-black">Turma:</span>
                <span className="font-bold text-slate-900 print:text-black">{schoolClass?.name || 'Turma Geral'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-black">Professor(a):</span>
                <span className="font-bold text-slate-900 print:text-black">{exam.teacherName || 'Docente Responsável'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-black">Pontuação Total:</span>
                <span className="font-bold text-indigo-700 print:text-black">{exam.totalPoints.toFixed(1)} Pontos (Média: {exam.passingScore.toFixed(1)})</span>
              </div>
            </div>

            {/* Student Identification Field (for exam sheets and bubble sheets) */}
            {activeView !== 'TEACHER_KEY' && (
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 print:border-black">
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block print:text-black">Nome Completo do Estudante:</span>
                  <div className="border-b border-slate-400 h-6 mt-1 flex items-end font-medium text-xs"></div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block print:text-black">Nº de Matrícula (RA) / Data:</span>
                  <div className="border-b border-slate-400 h-6 mt-1 flex items-end font-medium text-xs"></div>
                </div>
              </div>
            )}
          </div>

          {/* VIEW 1: GABARITO OFICIAL DO PROFESSOR (TEACHER KEY) */}
          {activeView === 'TEACHER_KEY' && (
            <div className="space-y-6">
              {/* Summary Stats Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:rounded-none print:border print:border-black print:p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2 print:text-black">
                  <Award className="h-4 w-4 text-indigo-600 print:hidden" />
                  Matriz Resumo de Gabarito & Pesos
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 print:bg-slate-200 print:border-black">
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black w-12 text-center">Item</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black w-24">Código</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black w-28">Tipo</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black text-center w-24">Gabarito</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black w-20 text-right">Peso (Pts)</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black w-32">BNCC</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 print:text-black">Tópico Avaliado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-black">
                      {resolvedQuestions.map((rq) => {
                        const correctOptIndex = rq.question?.options.findIndex((o) => o.isCorrect);
                        const correctLetter = correctOptIndex !== undefined && correctOptIndex >= 0 ? String.fromCharCode(65 + correctOptIndex) : '-';

                        return (
                          <tr key={rq.index} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900 print:text-black">
                              {rq.index}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 print:text-black font-semibold">
                              {rq.question?.code || `Q-${rq.index}`}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 print:border print:border-black">
                                {rq.question?.type === 'MULTIPLE_CHOICE' && 'Objetiva'}
                                {rq.question?.type === 'TRUE_FALSE' && 'V/F'}
                                {rq.question?.type === 'ESSAY_KEYWORD' && 'Discursiva'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {rq.question?.type === 'ESSAY_KEYWORD' ? (
                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md print:text-black print:border-black">
                                  Critérios
                                </span>
                              ) : (
                                <span className="h-6 w-6 inline-flex items-center justify-center rounded-full font-black text-xs bg-emerald-600 text-white print:text-black print:border print:border-black print:bg-transparent">
                                  {correctLetter}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 print:text-black">
                              {rq.points.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-700 font-bold print:text-black">
                              {rq.question?.bnccSkill || 'Geral'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 print:text-black font-medium">
                              {rq.question?.topic || 'Conteúdo Curricular'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 print:bg-slate-100 print:border-black">
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-slate-700 print:text-black">
                          Soma Total da Avaliação:
                        </td>
                        <td className="py-2.5 px-3 text-right text-indigo-700 print:text-black">
                          {exam.totalPoints.toFixed(2)} pts
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-slate-500 print:text-black text-xs font-normal">
                          {resolvedQuestions.length} questões cadastradas
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Detailed Resolution Guide for each question */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 print:text-black">
                  <Sparkles className="h-4 w-4 text-indigo-600 print:hidden" />
                  Resolução Passo a Passo & Justificativas Pedagógicas dos Distratores
                </h4>

                {resolvedQuestions.map((rq) => {
                  const correctOpt = rq.question?.options.find((o) => o.isCorrect);
                  const correctIndex = rq.question?.options.findIndex((o) => o.isCorrect);
                  const letter = correctIndex !== undefined && correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '';

                  return (
                    <div
                      key={rq.index}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs print:rounded-none print:border print:border-black print:p-4 page-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center print:border print:border-black">
                            {rq.index}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 print:text-black">
                            {rq.question?.code}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="font-semibold text-slate-700 text-xs print:text-black">
                            {rq.question?.topic}
                          </span>
                          {rq.question?.bnccSkill && (
                            <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold print:border-black print:text-black">
                              BNCC: {rq.question.bnccSkill}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-indigo-700 print:text-black">
                          Valor: {rq.points.toFixed(2)} pts
                        </span>
                      </div>

                      {/* Stem */}
                      <p className="text-xs text-slate-900 font-medium leading-relaxed mb-3 print:text-black">
                        {rq.question?.stem}
                      </p>

                      {/* Options Analysis */}
                      {rq.question?.options && rq.question.options.length > 0 && (
                        <div className="space-y-1.5 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 print:bg-transparent print:border-black print:p-2">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 print:text-black">
                            Alternativas e Diagnóstico de Distratores:
                          </p>
                          {rq.question.options.map((opt, oIdx) => {
                            const optLetter = String.fromCharCode(65 + oIdx);
                            return (
                              <div
                                key={opt.id || oIdx}
                                className={`text-xs p-2 rounded-lg border ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-semibold print:border-black print:bg-slate-100'
                                    : 'bg-white border-slate-150 text-slate-700 print:border-none'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      opt.isCorrect
                                        ? 'bg-emerald-600 text-white print:border print:border-black print:text-black print:bg-transparent'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {optLetter}
                                  </span>
                                  <div className="flex-1">
                                    <span>{opt.text}</span>
                                    {opt.isCorrect && (
                                      <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded print:text-black">
                                        (GABARITO CORRETO)
                                      </span>
                                    )}
                                    {opt.explanation && (
                                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 italic print:text-slate-700">
                                        💡 {opt.explanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Essay Criteria (if applicable) */}
                      {rq.question?.type === 'ESSAY_KEYWORD' && (
                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-2 mb-3 print:bg-transparent print:border-black">
                          <p className="text-[10px] font-bold uppercase text-indigo-700 print:text-black">
                            Critérios de Avaliação Discursiva Automática:
                          </p>
                          {rq.question.modelAnswer && (
                            <div>
                              <span className="font-bold text-slate-700 block text-[11px]">Resposta Padrão Esperada:</span>
                              <p className="text-slate-800 mt-0.5 bg-white p-2 rounded-lg border border-slate-200 italic print:border-black">
                                "{rq.question.modelAnswer}"
                              </p>
                            </div>
                          )}
                          {rq.question.essayKeywords && rq.question.essayKeywords.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-700 block text-[11px] mb-1">
                                Palavras-Chave Ponderadas para Correção Automática:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {rq.question.essayKeywords.map((kw, kIdx) => (
                                  <span
                                    key={kIdx}
                                    className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200 print:border-black print:text-black"
                                  >
                                    "{kw.keyword}" ({kw.points} pts) {kw.required && '• Obrigatória'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* General pedagogical resolution */}
                      {rq.question?.explanation && (
                        <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 text-xs print:bg-transparent print:border-black">
                          <span className="font-bold text-slate-800 block text-[11px] mb-0.5 print:text-black">
                            Fundamentação Teórica / Resolução Comentada:
                          </span>
                          <p className="text-slate-700 leading-relaxed print:text-black">{rq.question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: CADERNO DE QUESTÕES (EXAM SHEET) */}
          {activeView === 'EXAM_SHEET' && (
            <div className="space-y-6">
              {/* Instructions Box */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 print:bg-transparent print:border-black print:text-black">
                <h4 className="font-bold uppercase tracking-wider text-[11px] mb-1.5">Instruções para o Estudante:</h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Verifique se este caderno contém exatamente {resolvedQuestions.length} questões numeradas sequencialmente.</li>
                  <li>Leia atentamente o enunciado de cada questão antes de assinalar sua resposta.</li>
                  <li>Duração total máxima desta avaliação: <strong>{exam.timeLimitMinutes} minutos</strong>.</li>
                  <li>Não é permitido o uso de equipamentos eletrônicos ou consultas não autorizadas pelo professor aplicador.</li>
                  <li>Transcreva suas respostas finais para a <strong>Folha Oficial de Respostas (Cartão Gabarito)</strong> à caneta esferográfica preta ou azul.</li>
                </ul>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {resolvedQuestions.map((rq) => (
                  <div
                    key={rq.index}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs print:rounded-none print:border-b-2 print:border-slate-300 print:shadow-none print:p-4 page-break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 print:border print:border-black">
                          {rq.index}
                        </span>
                        <span className="font-bold text-slate-900 text-xs print:text-black">
                          Questão {rq.index}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-xs font-medium print:text-black">
                          {rq.question?.topic}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md print:border-black print:text-black print:bg-transparent">
                        ({rq.points.toFixed(2)} pts)
                      </span>
                    </div>

                    {/* Stem */}
                    <div className="text-xs text-slate-900 font-medium leading-relaxed my-3 print:text-black text-justify">
                      {rq.question?.stem}
                    </div>

                    {/* Multiple choice options */}
                    {rq.question?.options && rq.question.options.length > 0 && (
                      <div className="space-y-2 mt-3 pl-2">
                        {rq.question.options.map((opt, oIdx) => {
                          const optLetter = String.fromCharCode(65 + oIdx);
                          return (
                            <div key={opt.id || oIdx} className="flex items-start gap-2.5 text-xs text-slate-800 print:text-black">
                              <span className="h-5 w-5 rounded-full border border-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0 print:border-black">
                                {optLetter}
                              </span>
                              <span className="leading-snug pt-0.5">{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Essay lines area */}
                    {rq.question?.type === 'ESSAY_KEYWORD' && (
                      <div className="mt-4 space-y-3 pt-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block print:text-black">Espaço para Resposta Discursiva:</span>
                        <div className="border-b border-slate-300 h-6"></div>
                        <div className="border-b border-slate-300 h-6"></div>
                        <div className="border-b border-slate-300 h-6"></div>
                        <div className="border-b border-slate-300 h-6"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: FOLHA DE RESPOSTAS / CARTÃO GABARITO (STUDENT BUBBLE SHEET) */}
          {activeView === 'STUDENT_BUBBLE_SHEET' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:rounded-none print:border-2 print:border-black print:p-4 max-w-2xl mx-auto">
                <div className="text-center border-b border-slate-200 pb-3 mb-4 print:border-black">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 print:text-black">
                    Cartão Oficial de Respostas & Leitura Óptica / Manual
                  </h3>
                  <p className="text-[11px] text-slate-500 print:text-black mt-0.5">
                    Preencha completamente o círculo correspondente à alternativa escolhida à caneta.
                  </p>
                </div>

                {/* Example of correct filling */}
                <div className="flex items-center justify-center gap-6 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-6 print:border-black print:bg-transparent">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">Forma Correta:</span>
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Incorretas:</span>
                    <span className="h-5 w-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold line-through">B</span>
                    <span className="h-5 w-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span className="h-5 w-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold">●</span>
                  </div>
                </div>

                {/* Matrix of bubbles */}
                <div className="space-y-2 divide-y divide-slate-100 print:divide-slate-300">
                  {resolvedQuestions.map((rq) => (
                    <div key={rq.index} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-slate-900 w-8 text-right">
                          {String(rq.index).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold hidden sm:inline">
                          ({rq.points.toFixed(1)} pts)
                        </span>
                      </div>

                      {rq.question?.type === 'ESSAY_KEYWORD' ? (
                        <span className="text-[11px] font-bold text-slate-500 italic">
                          [Questão Discursiva - Avaliada no Caderno]
                        </span>
                      ) : (
                        <div className="flex items-center gap-3 sm:gap-4">
                          {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                            <div key={letter} className="flex flex-col items-center">
                              <span className="h-6 w-6 rounded-full border-2 border-slate-400 flex items-center justify-center font-bold text-xs text-slate-700 hover:border-indigo-600 transition-colors cursor-pointer print:border-black">
                                {letter}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Signature & Authentication Footer */}
                <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 print:border-black">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-8">Assinatura do Estudante:</span>
                    <div className="border-t border-slate-800"></div>
                  </div>
                  <div className="text-right flex flex-col justify-end text-[10px] text-slate-400">
                    <p className="font-mono font-bold text-slate-700">HASH: {exam.id.toUpperCase()}-AUTENTICADO</p>
                    <p>EduGestão Pro • Sistema de Avaliações Institucionais</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
