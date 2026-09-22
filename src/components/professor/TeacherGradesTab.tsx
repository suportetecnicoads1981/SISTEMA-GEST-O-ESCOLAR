import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Users,
  Save,
  Calculator,
  Award,
  TrendingUp,
  Percent,
  Sliders,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Subject,
  ClassGradeSheet,
  StudentBimonthlyGradeEntry,
  SchoolSettings,
} from '../../types';
import { triggerGradePublished } from '../../services/messageQueueService';

interface TeacherGradesTabProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  settings: SchoolSettings;
  activeClassId: string;
  activeSubjectId: string;
  selectedTerm: string;
  gradeSheets: ClassGradeSheet[];
  onSaveGradeSheet: (sheet: ClassGradeSheet) => void;
}

export const TeacherGradesTab: React.FC<TeacherGradesTabProps> = ({
  teacherName = '',
  classes = [],
  subjects = [],
  students = [],
  settings,
  activeClassId,
  activeSubjectId,
  selectedTerm,
  gradeSheets = [],
  onSaveGradeSheet,
}) => {
  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId) || classes[0],
    [classes, activeClassId]
  );

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) || subjects[0],
    [subjects, activeSubjectId]
  );

  const classStudents = useMemo(() => {
    return (students || [])
      .filter((s) => s && s.classId === activeClass?.id && s.status === 'ACTIVE')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
  }, [students, activeClass]);

  // Local State for Grade Entries: studentId -> StudentBimonthlyGradeEntry
  const [localGrades, setLocalGrades] = useState<Record<string, StudentBimonthlyGradeEntry>>({});
  const [passingScore, setPassingScore] = useState<number>(7.0);
  const [calculationMode, setCalculationMode] = useState<'WEIGHTED' | 'ARITHMETIC'>('WEIGHTED');
  const [saveSuccessAlert, setSaveSuccessAlert] = useState<string | null>(null);

  // Weights
  const [weights, setWeights] = useState({
    assessment1: 2.0,
    assessment2: 2.0,
    activities: 2.0,
    exam: 4.0,
  });

  // Calculate term average based on weights or arithmetic mean
  const calculateStudentAverage = (
    a1?: number | null,
    a2?: number | null,
    act?: number | null,
    exam?: number | null,
    rec?: number | null
  ): { average: number; status: 'APROVADO' | 'RECUPERACAO' | 'REPROVADO' | 'EM_ANDAMENTO' } => {
    const v1 = a1 ?? 0;
    const v2 = a2 ?? 0;
    const vAct = act ?? 0;
    const vExam = exam ?? 0;

    let baseAvg = 0;
    if (calculationMode === 'WEIGHTED') {
      const totalWeight = weights.assessment1 + weights.assessment2 + weights.activities + weights.exam;
      if (totalWeight > 0) {
        baseAvg =
          (v1 * weights.assessment1 +
            v2 * weights.assessment2 +
            vAct * weights.activities +
            vExam * weights.exam) /
          totalWeight;
      }
    } else {
      // Simple arithmetic average of non-null fields
      const items = [a1, a2, act, exam].filter((x) => x !== undefined && x !== null) as number[];
      baseAvg = items.length > 0 ? items.reduce((a, b) => a + b, 0) / items.length : 0;
    }

    // Apply recovery if higher than base average
    let finalAvg = baseAvg;
    if (rec !== undefined && rec !== null && rec > baseAvg) {
      finalAvg = Math.min(10.0, (baseAvg + rec) / 2 > 6.0 ? (baseAvg + rec) / 2 : rec);
    }

    const rounded = Number(finalAvg.toFixed(1));
    let status: 'APROVADO' | 'RECUPERACAO' | 'REPROVADO' | 'EM_ANDAMENTO' = 'EM_ANDAMENTO';
    if (rounded >= passingScore) {
      status = 'APROVADO';
    } else if (rounded >= passingScore - 2.0) {
      status = 'RECUPERACAO';
    } else {
      status = 'REPROVADO';
    }

    return { average: rounded, status };
  };

  // Sync state when active class, subject or term changes
  useEffect(() => {
    const existing = gradeSheets.find(
      (g) =>
        g.classId === activeClass?.id &&
        g.subjectId === activeSubject?.id &&
        g.term === selectedTerm
    );

    const map: Record<string, StudentBimonthlyGradeEntry> = {};

    if (existing && existing.grades) {
      setPassingScore(existing.averagePassingGrade || 7.0);
      existing.grades.forEach((g) => {
        map[g.studentId] = g;
      });
    }

    // Ensure all class students have an entry
    classStudents.forEach((st) => {
      if (!map[st.id]) {
        map[st.id] = {
          studentId: st.id,
          studentName: st.name,
          enrollmentNumber: st.enrollmentNumber,
          assessment1: null,
          assessment2: null,
          activitiesScore: null,
          examScore: null,
          recoveryScore: null,
          termAverage: 0,
          status: 'EM_ANDAMENTO',
          descriptiveFeedback: '',
        };
      }
    });

    setLocalGrades(map);
  }, [activeClass?.id, activeSubject?.id, selectedTerm, gradeSheets, classStudents]);

  const handleGradeChange = (
    studentId: string,
    field: keyof StudentBimonthlyGradeEntry,
    value: any
  ) => {
    setLocalGrades((prev) => {
      const current = prev[studentId] || {
        studentId,
        studentName: classStudents.find((s) => s.id === studentId)?.name || '',
        enrollmentNumber: classStudents.find((s) => s.id === studentId)?.enrollmentNumber || '',
        termAverage: 0,
        status: 'EM_ANDAMENTO',
      };

      const updated = {
        ...current,
        [field]: value === '' || value === null ? null : typeof value === 'number' ? Math.max(0, Math.min(10, value)) : value,
      };

      // Recalculate average
      const { average, status } = calculateStudentAverage(
        updated.assessment1,
        updated.assessment2,
        updated.activitiesScore,
        updated.examScore,
        updated.recoveryScore
      );

      updated.termAverage = average;
      updated.status = status;

      return {
        ...prev,
        [studentId]: updated,
      };
    });
  };

  // Quick action: Pre-fill demo grades for all students
  const handlePrefillDemoGrades = () => {
    setLocalGrades((prev) => {
      const next = { ...prev };
      classStudents.forEach((st, idx) => {
        const a1 = Number((7.0 + (idx % 3) * 1.0).toFixed(1));
        const a2 = Number((8.0 - (idx % 2) * 0.5).toFixed(1));
        const act = 9.0;
        const exam = Number((6.5 + (idx % 4) * 0.8).toFixed(1));
        const { average, status } = calculateStudentAverage(a1, a2, act, exam, null);

        next[st.id] = {
          studentId: st.id,
          studentName: st.name,
          enrollmentNumber: st.enrollmentNumber,
          assessment1: a1,
          assessment2: a2,
          activitiesScore: act,
          examScore: exam,
          recoveryScore: status === 'RECUPERACAO' ? 7.0 : null,
          termAverage: average,
          status,
          descriptiveFeedback: 'Apresenta participação contínua e compreensão dos conteúdos curriculares propostos.',
        };
      });
      return next;
    });
  };

  // Save current sheet
  const handleSave = () => {
    if (!activeClass || !activeSubject) return;

    const gradesArray: StudentBimonthlyGradeEntry[] = classStudents.map((st) => {
      return (
        localGrades[st.id] || {
          studentId: st.id,
          studentName: st.name,
          enrollmentNumber: st.enrollmentNumber,
          termAverage: 0,
          status: 'EM_ANDAMENTO',
        }
      );
    });

    const sheetId = `grade-sheet-${activeClass.id}-${activeSubject.id}-${selectedTerm.replace(/\s+/g, '-')}`;
    const newSheet: ClassGradeSheet = {
      id: sheetId,
      classId: activeClass.id,
      className: activeClass.name,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      teacherName: teacherName || activeSubject.teacherName || 'Docente Responsável',
      schoolYear: 2026,
      term: selectedTerm as any,
      grades: gradesArray,
      averagePassingGrade: passingScore,
      weights,
      status: 'FECHADO_PROFESSOR',
      updatedAt: new Date().toISOString(),
    };

    onSaveGradeSheet(newSheet);

    // Trigger trg_grade_published: Enfileirar boletim na message_queue para alunos avaliados
    let enqueuedCount = 0;
    gradesArray.forEach((grd) => {
      const studentObj = classStudents.find((s) => s.id === grd.studentId);
      if (grd.termAverage > 0 || grd.status !== 'EM_ANDAMENTO') {
        triggerGradePublished({
          studentId: grd.studentId,
          studentName: grd.studentName,
          guardianName: studentObj?.guardianName,
          guardianPhone: studentObj?.guardianPhone,
          className: activeClass.name,
          subjectName: activeSubject.name,
          term: selectedTerm,
          average: grd.termAverage,
          passingScore,
          status: grd.status,
        });
        enqueuedCount++;
      }
    });

    const triggerNote = enqueuedCount > 0 ? ` 📢 [trg_grade_published]: ${enqueuedCount} boletim(ns) enfileirados na message_queue.` : '';
    setSaveSuccessAlert(`Pauta de Notas do ${selectedTerm} (${activeClass.name} - ${activeSubject.name}) salva e homologada com sucesso!${triggerNote}`);
    setTimeout(() => setSaveSuccessAlert(null), 5000);
  };

  // Class Stats
  const gradesList = classStudents.map((st) => localGrades[st.id]?.termAverage || 0);
  const classAvg = gradesList.length > 0 ? (gradesList.reduce((a, b) => a + b, 0) / gradesList.length).toFixed(1) : '0.0';
  const approvedCount = classStudents.filter((st) => (localGrades[st.id]?.status || '') === 'APROVADO').length;
  const recoveryCount = classStudents.filter((st) => (localGrades[st.id]?.status || '') === 'RECUPERACAO').length;
  const failedCount = classStudents.filter((st) => (localGrades[st.id]?.status || '') === 'REPROVADO').length;

  // Print Official Grade Map
  const handlePrintGradeMap = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Mapa Oficial de Rendimento Escolar - ${activeClass?.name}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 9pt; color: #0f172a; margin: 0; padding: 15px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
          .subtitle { font-size: 8.5pt; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 8.5pt; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 5px 6px; text-align: center; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 5px 6px; }
          .aprovado { color: #059669; font-weight: bold; text-align: center; }
          .recuperacao { color: #d97706; font-weight: bold; text-align: center; }
          .reprovado { color: #dc2626; font-weight: bold; text-align: center; }
          .summary { margin-top: 15px; display: flex; justify-content: space-between; font-size: 9pt; font-weight: bold; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; }
          .signatures { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 8.5pt; }
          .sig-line { border-top: 1px solid #475569; padding-top: 4px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${settings.name}</div>
            <div class="subtitle">MAPA OFICIAL DE RENDIMENTO ESCOLAR - PAUTA BIMESTRAL DE NOTAS</div>
          </div>
          <div style="text-align: right; font-size: 8pt; color: #64748b;">
            Emitido em: ${new Date().toLocaleString('pt-BR')}<br>
            INEP: ${settings.inepCode || '35128490'}
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>Turma:</strong> ${activeClass?.name} (${activeClass?.shift})</div>
          <div><strong>Componente Curricular:</strong> ${activeSubject?.name}</div>
          <div><strong>Docente Responsável:</strong> ${teacherName}</div>
          <div><strong>Período:</strong> ${selectedTerm} / 2026 (Média de Corte: ${passingScore.toFixed(1)})</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">Nº</th>
              <th style="width: 90px;">Matrícula</th>
              <th style="text-align: left;">Nome do(a) Estudante</th>
              <th style="width: 60px;">Av. 1 (${weights.assessment1})</th>
              <th style="width: 60px;">Trab. (${weights.assessment2})</th>
              <th style="width: 60px;">Ativ. (${weights.activities})</th>
              <th style="width: 60px;">Prova (${weights.exam})</th>
              <th style="width: 60px;">Recup.</th>
              <th style="width: 65px;">Média Final</th>
              <th style="width: 95px;">Situação</th>
              <th style="text-align: left;">Parecer Descritivo do Docente</th>
            </tr>
          </thead>
          <tbody>
            ${classStudents
              .map((st, idx) => {
                const g: any = localGrades[st.id] || {
                  assessment1: null,
                  assessment2: null,
                  activitiesScore: null,
                  examScore: null,
                  recoveryScore: null,
                  termAverage: 0,
                  status: 'EM_ANDAMENTO',
                  descriptiveFeedback: '',
                };
                let statusClass = 'aprovado';
                let statusLabel = 'APROVADO';
                if (g.status === 'RECUPERACAO') {
                  statusClass = 'recuperacao';
                  statusLabel = 'RECUPERAÇÃO';
                } else if (g.status === 'REPROVADO') {
                  statusClass = 'reprovado';
                  statusLabel = 'REPROVADO';
                }

                return `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td>${st.enrollmentNumber}</td>
                  <td><strong>${st.name}</strong></td>
                  <td style="text-align: center;">${g.assessment1 !== null && g.assessment1 !== undefined ? g.assessment1.toFixed(1) : '-'}</td>
                  <td style="text-align: center;">${g.assessment2 !== null && g.assessment2 !== undefined ? g.assessment2.toFixed(1) : '-'}</td>
                  <td style="text-align: center;">${g.activitiesScore !== null && g.activitiesScore !== undefined ? g.activitiesScore.toFixed(1) : '-'}</td>
                  <td style="text-align: center;">${g.examScore !== null && g.examScore !== undefined ? g.examScore.toFixed(1) : '-'}</td>
                  <td style="text-align: center;">${g.recoveryScore !== null && g.recoveryScore !== undefined ? g.recoveryScore.toFixed(1) : '-'}</td>
                  <td style="text-align: center; font-weight: bold;">${g.termAverage.toFixed(1)}</td>
                  <td class="${statusClass}">${statusLabel}</td>
                  <td>${g.descriptiveFeedback || '-'}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div class="summary">
          <div>Total de Alunos: ${classStudents.length}</div>
          <div>Média da Turma: ${classAvg}</div>
          <div style="color: #059669;">Aprovados: ${approvedCount}</div>
          <div style="color: #d97706;">Em Recuperação: ${recoveryCount}</div>
          <div style="color: #dc2626;">Abaixo da Média: ${failedCount}</div>
        </div>

        <div class="signatures">
          <div>
            <div class="sig-line">
              <strong>${teacherName}</strong><br>
              Professor(a) Regente do Componente
            </div>
          </div>
          <div>
            <div class="sig-line">
              <strong>${settings.principalName || 'Coordenação Pedagógica'}</strong><br>
              Secretaria Escolar / Direção
            </div>
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
    <div className="space-y-5">
      {/* Alert toast */}
      {saveSuccessAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{saveSuccessAlert}</span>
          </div>
        </div>
      )}

      {/* Control & KPI Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Pauta Bimestral & Lançamento de Notas do Professor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Turma: <strong>{activeClass?.name}</strong> • Disciplina: <strong>{activeSubject?.name}</strong> • Período: <strong>{selectedTerm}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrefillDemoGrades}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Preenche notas de demonstração para agilizar testes"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Preencher Notas Exemplo
            </button>

            <button
              onClick={handlePrintGradeMap}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir Mapa de Notas
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Salvar & Homologar Pauta
            </button>
          </div>
        </div>

        {/* Real-time stats pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Alunos</span>
            <span className="text-base font-black text-slate-900">{classStudents.length}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900">
            <span className="block text-[10px] text-indigo-600 font-bold uppercase">Média Geral</span>
            <span className="text-base font-black text-indigo-700">{classAvg}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
            <span className="block text-[10px] text-emerald-600 font-bold uppercase">Aprovados</span>
            <span className="text-base font-black text-emerald-700">{approvedCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
            <span className="block text-[10px] text-amber-600 font-bold uppercase">Recuperação</span>
            <span className="text-base font-black text-amber-700">{recoveryCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 col-span-2 sm:col-span-1">
            <span className="block text-[10px] text-rose-600 font-bold uppercase">Abaixo da Meta</span>
            <span className="text-base font-black text-rose-700">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pauta Interativa de Avaliações ({classStudents.length} estudantes)
            </h4>
          </div>

          {/* Quick formula mode and passing score config */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Nota de Corte:</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-16 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Cálculo:</span>
              <select
                value={calculationMode}
                onChange={(e) => setCalculationMode(e.target.value as any)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="WEIGHTED">Ponderada (2+2+2+4)</option>
                <option value="ARITHMETIC">Aritmética Simples</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">Nº</th>
                <th className="py-3 px-3 w-56">Estudante</th>
                <th className="py-3 px-3 w-24 text-center">Av. 1 (Peso {weights.assessment1})</th>
                <th className="py-3 px-3 w-24 text-center">Trabalho (Peso {weights.assessment2})</th>
                <th className="py-3 px-3 w-24 text-center">Atividades (Peso {weights.activities})</th>
                <th className="py-3 px-3 w-24 text-center">Prova Bim. (Peso {weights.exam})</th>
                <th className="py-3 px-3 w-24 text-center">Recuperação</th>
                <th className="py-3 px-3 w-24 text-center bg-indigo-50/50 text-indigo-900">Média Final</th>
                <th className="py-3 px-3 w-28 text-center">Situação</th>
                <th className="py-3 px-3">Parecer Descritivo do Docente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {classStudents.map((student, idx) => {
                const entry = localGrades[student.id] || {
                  studentId: student.id,
                  studentName: student.name,
                  enrollmentNumber: student.enrollmentNumber,
                  termAverage: 0,
                  status: 'EM_ANDAMENTO',
                };

                const isApproved = entry.status === 'APROVADO';
                const isRecovery = entry.status === 'RECUPERACAO';
                const isFailed = entry.status === 'REPROVADO';

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{student.enrollmentNumber}</div>
                    </td>

                    {/* Assessment 1 */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={entry.assessment1 ?? ''}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            'assessment1',
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        className="w-18 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Assessment 2 / Trabalho */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={entry.assessment2 ?? ''}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            'assessment2',
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        className="w-18 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Activities */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={entry.activitiesScore ?? ''}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            'activitiesScore',
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        className="w-18 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Exam Score */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={entry.examScore ?? ''}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            'examScore',
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        className="w-18 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Recovery */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={entry.recoveryScore ?? ''}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            'recoveryScore',
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        className="w-18 text-center text-xs font-bold bg-amber-50/60 border border-amber-200 rounded-lg p-1.5 focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </td>

                    {/* Calculated Average */}
                    <td className="py-2.5 px-3 text-center bg-indigo-50/30">
                      <span className="text-sm font-black text-indigo-700">
                        {entry.termAverage.toFixed(1)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {isApproved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          APROVADO
                        </span>
                      ) : isRecovery ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          RECUPERAÇÃO
                        </span>
                      ) : isFailed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          REPROVADO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                          EM CURSO
                        </span>
                      )}
                    </td>

                    {/* Descriptive Feedback */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Parecer pedagógico sobre o progresso do aluno..."
                        value={entry.descriptiveFeedback || ''}
                        onChange={(e) =>
                          handleGradeChange(student.id, 'descriptiveFeedback', e.target.value)
                        }
                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
