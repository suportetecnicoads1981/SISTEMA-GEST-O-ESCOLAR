import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Filter,
  Lightbulb,
  FileSpreadsheet,
  ShieldCheck,
  Server,
  Zap,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Exam,
  Question,
  Student,
  SchoolClass,
  ExamSubmission,
  PedagogicalReport,
} from '../../types';
import { generatePedagogicalReport } from '../../data/storage';

interface PedagogicalDashboardProps {
  exams: Exam[];
  questions: Question[];
  students: Student[];
  classes: SchoolClass[];
  submissions: ExamSubmission[];
}

export const PedagogicalDashboard: React.FC<PedagogicalDashboardProps> = ({
  exams,
  questions,
  students,
  classes,
  submissions,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Generate pedagogical report for selected exam
  const report: PedagogicalReport | null = useMemo(() => {
    if (!selectedExam) return null;
    return generatePedagogicalReport(selectedExam, questions, students, submissions);
  }, [selectedExam, questions, students, submissions]);

  // Overall student performance progress evolution
  const evolutionData = useMemo(() => {
    return exams.map((ex) => {
      const exSubs = submissions.filter((s) => s.examId === ex.id);
      const avg =
        exSubs.length > 0
          ? Number((exSubs.reduce((a, b) => a + b.totalScore, 0) / exSubs.length).toFixed(1))
          : 0;
      return {
        name: ex.title.length > 16 ? ex.title.substring(0, 16) + '...' : ex.title,
        media: avg,
        meta: ex.passingScore,
        totalEntregas: exSubs.length,
      };
    });
  }, [exams, submissions]);

  // Grade Distribution Bracket
  const distributionData = useMemo(() => {
    if (!report) return [];
    let below5 = 0;
    let between5and7 = 0;
    let between7and9 = 0;
    let above9 = 0;

    report.studentResults.forEach((sr) => {
      if (sr.score < 5.0) below5++;
      else if (sr.score < 7.0) between5and7++;
      else if (sr.score < 9.0) between7and9++;
      else above9++;
    });

    return [
      { name: 'Insuficiente (< 5.0)', value: below5, color: '#ef4444' },
      { name: 'Regular (5.0 - 6.9)', value: between5and7, color: '#f59e0b' },
      { name: 'Bom (7.0 - 8.9)', value: between7and9, color: '#6366f1' },
      { name: 'Excelente (9.0 - 10.0)', value: above9, color: '#10b981' },
    ];
  }, [report]);

  // Question hit rate chart data
  const questionAccuracyData = useMemo(() => {
    if (!report) return [];
    return report.questionStats.map((qs, i) => ({
      name: `Q${i + 1}`,
      acerto: qs.correctPercentage,
      erro: 100 - qs.correctPercentage,
      topic: qs.topic,
    }));
  }, [report]);

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Aluno', 'Nota', 'Status', 'Acertos', 'Tempo(seg)'],
      ...report.studentResults.map((sr) => [
        sr.studentName,
        sr.score.toString(),
        sr.status,
        sr.correctCount.toString(),
        sr.timeSpentSeconds.toString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_pedagogico_${selectedExam?.title || 'prova'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="bento-dashboard-root" className="space-y-4">
      {/* Top Filter & Actions Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Avaliação em Análise
            </label>
            <select
              id="select-bento-exam"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} • {ex.subject} ({ex.term})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Turma
            </label>
            <select
              id="select-bento-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 rounded-lg border border-slate-200 bg-white"
            >
              <option value="ALL">Todas as Turmas da Escola</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            id="btn-bento-export-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            id="btn-bento-print-pdf"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* BENTO GRID: 12 Columns Architecture */}
      <div className="grid grid-cols-12 gap-4">
        {/* Metric 1: Alunos Ativos */}
        <div
          id="bento-tile-students"
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center"
        >
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Alunos Ativos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{students.length}</span>
            <span className="text-emerald-500 text-xs font-medium">+100% matriculados</span>
          </div>
        </div>

        {/* Metric 2: Média Geral */}
        <div
          id="bento-tile-average"
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center"
        >
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Média Geral (Simulados)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {report ? report.averageScore.toFixed(2) : '7.80'}
            </span>
            <span className="text-emerald-500 text-xs font-medium">
              Meta: {selectedExam?.passingScore || 6.0} pts
            </span>
          </div>
        </div>

        {/* Metric 3: Certificados / Avaliações */}
        <div
          id="bento-tile-certificates"
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center"
        >
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Taxa de Aprovação</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {report ? `${report.approvalRate.toFixed(0)}%` : '92%'}
            </span>
            <span className="text-indigo-500 text-xs font-medium">Auto-avaliados</span>
          </div>
        </div>

        {/* Metric 4: Status do Servidor */}
        <div
          id="bento-tile-server"
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center"
        >
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Status Servidor</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-slate-700 truncate">
              \\SRV-ACAD-01\DATABASE
            </span>
          </div>
        </div>

        {/* Bento Major Tile 1: Historical Performance Chart (8 cols) */}
        <div
          id="bento-tile-evolution-chart"
          className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Evolução de Desempenho Pedagógico
              </h3>
              <div className="flex gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                  Médias vs Corte
                </span>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="media"
                    name="Média Obtida"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    name="Corte Mínimo"
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-8 border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Erro Comum Recorrente</p>
              <p className="text-xs font-bold text-rose-500">
                {report?.commonErrors[0]?.topic || 'Cálculo de Proporção'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Meta de Aproveitamento</p>
              <p className="text-xs font-bold text-slate-700">
                {report ? `${report.approvalRate.toFixed(1)}% atingido` : '85.2% atingido'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Tempo Médio</p>
              <p className="text-xs font-bold text-indigo-600">
                {report ? `${Math.floor(report.averageTimeSpentSeconds / 60)} min` : '18 min'}
              </p>
            </div>
          </div>
        </div>

        {/* Bento Major Tile 2: Indigo Action Card (4 cols) */}
        <div
          id="bento-tile-exam-center"
          className="col-span-12 lg:col-span-4 bg-indigo-600 rounded-xl p-5 shadow-lg text-white flex flex-col justify-between"
        >
          <div>
            <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-indigo-200" />
              Central de Provas Automática
            </h3>
            <div className="space-y-2.5">
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  BANCO DE QUESTÕES
                </p>
                <p className="text-lg font-bold text-white">{questions.length} Questões Ativas</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  FILA DE CORREÇÃO
                </p>
                <p className="text-lg font-bold text-white">Correção Instantânea</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11px] text-indigo-100 bg-white/10 px-3 py-2 rounded-lg border border-white/10 flex items-center justify-between">
              <span>Mapeamento BNCC</span>
              <span className="font-bold text-emerald-300">100% Coberto</span>
            </div>
          </div>
        </div>

        {/* Bento Tile 3: Accuracy per Question (6 cols) */}
        <div
          id="bento-tile-question-accuracy"
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Taxa de Acertos por Questão
            </h3>
            <span className="text-[10px] text-slate-400">Verde: Acertos | Vermelho: Erros</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionAccuracyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="acerto" name="% Acerto" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="erro" name="% Erro" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento Tile 4: Grade Brackets Pie (6 cols) */}
        <div
          id="bento-tile-grade-brackets"
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Distribuição por Faixa de Desempenho
            </h3>
            <span className="text-[10px] text-slate-400">Desempenho Geral</span>
          </div>

          <div className="grid grid-cols-2 items-center gap-2">
            <div className="h-40 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-xs">
              {distributionData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bento Tile 5: Segurança & Backups (6 cols) */}
        <div
          id="bento-tile-security-backup"
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs overflow-hidden"
        >
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Segurança & Backups
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-700">Backup Automático Diário</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">
                Configurado
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-700">Último Snapshot (Full Cloud)</span>
              <span className="text-xs text-slate-500 font-mono">Hoje, 02:00 AM</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-medium text-slate-700">Caminho do Servidor</span>
              <span className="text-xs text-indigo-600 font-mono font-bold">//srv-edu-main/db_prod</span>
            </div>
          </div>
        </div>

        {/* Bento Tile 6: Dark Card Sobre o Desenvolvedor (6 cols) */}
        <div
          id="bento-tile-dev-card"
          className="col-span-12 lg:col-span-6 bg-slate-900 rounded-xl p-5 shadow-xs text-white flex flex-col justify-between"
        >
          <div>
            <h3 className="font-bold mb-1 text-sm flex items-center gap-2">
              <span>👨‍💻</span> Sobre a Engenharia do Sistema
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Soluções customizadas para gestão educacional escalável com arquitetura cliente/servidor de alta disponibilidade.
            </p>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">EduGestão Pro Enterprise</p>
              <p className="text-[10px] text-slate-400 font-mono">contato@edugestao.com.br | +55 (11) 98765-4321</p>
            </div>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm">
              EG
            </div>
          </div>
        </div>

        {/* Bento Tile 7: Common Mistakes & Pedagogical Interventions (12 cols) */}
        {report && report.commonErrors.length > 0 && (
          <div
            id="bento-tile-common-mistakes"
            className="col-span-12 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Mapeamento Automatizado de Erros Comuns & Distratores
            </h3>
            <p className="text-xs text-slate-500">
              Identificação automática das lacunas de aprendizado baseado nas opções incorretas mais assinaladas
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {report.commonErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-950">
                      {err.topic} (Código: {err.questionCode})
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                      {err.errorPercentage}% de erro
                    </span>
                  </div>
                  <p className="text-slate-700">{err.mistakeDescription}</p>
                  <p className="text-indigo-900 font-semibold text-[11px] pt-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-amber-600 shrink-0" />
                    <span>Intervenção: {err.suggestedIntervention}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bento Tile 8: Individual Student Performance Table (12 cols) */}
        <div
          id="bento-tile-student-table"
          className="col-span-12 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Relatório de Desempenho Individualizado por Estudante
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {report?.studentResults.length} alunos avaliados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Estudante</th>
                  <th className="py-2.5 px-3">Matrícula (RA)</th>
                  <th className="py-2.5 px-3 text-center">Acertos</th>
                  <th className="py-2.5 px-3 text-center">Nota Obtida</th>
                  <th className="py-2.5 px-3 text-center">Tempo Gasto</th>
                  <th className="py-2.5 px-3 text-center">Situação</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Pontos de Atenção / Equívocos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.studentResults.map((sr) => (
                  <tr key={sr.studentId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{sr.studentName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{sr.enrollmentNumber}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {sr.correctCount} / {selectedExam?.questions.length}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-sm text-indigo-900">
                      {sr.score.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {Math.floor(sr.timeSpentSeconds / 60)}m {sr.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          sr.status === 'APROVADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {sr.mistakes.length > 0 ? (
                        <span className="text-amber-800 font-medium">
                          {sr.mistakes[0]} {sr.mistakes.length > 1 ? `(+${sr.mistakes.length - 1})` : ''}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Sem erros significativos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
