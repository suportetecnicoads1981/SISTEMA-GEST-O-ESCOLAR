import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Printer,
  Download,
  Users,
  Check,
  Clock,
  Sparkles,
  Info,
  Layers,
  BookOpen,
  FileText,
  Search,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Subject,
  AttendanceSheet,
  StudentAttendanceEntry,
  AttendanceStatus,
  SchoolSettings,
} from '../../types';

interface TeacherAttendanceTabProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  settings: SchoolSettings;
  activeClassId: string;
  activeSubjectId: string;
  selectedTerm: string;
  attendanceSheets: AttendanceSheet[];
  onSaveAttendanceSheet: (sheet: AttendanceSheet) => void;
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({
  teacherName,
  classes,
  subjects,
  students,
  settings,
  activeClassId,
  activeSubjectId,
  selectedTerm,
  attendanceSheets,
  onSaveAttendanceSheet,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [saveSuccessAlert, setSaveSuccessAlert] = useState<string | null>(null);

  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId) || classes[0],
    [classes, activeClassId]
  );

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) || subjects[0],
    [subjects, activeSubjectId]
  );

  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === activeClass?.id && s.status === 'ACTIVE')
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [students, activeClass]);

  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return classStudents;
    const term = searchStudent.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.enrollmentNumber.toLowerCase().includes(term)
    );
  }, [classStudents, searchStudent]);

  // Local attendance entries map: studentId -> { status, justification, cert }
  const [localEntries, setLocalEntries] = useState<
    Record<string, { status: AttendanceStatus; justification?: string; cert?: string }>
  >({});

  // Sync with existing attendance sheet if one exists for the selected date, class, and subject
  useEffect(() => {
    const existing = attendanceSheets.find(
      (s) =>
        s.classId === activeClass?.id &&
        s.subjectId === activeSubject?.id &&
        s.date === selectedDate &&
        s.lessonNumber === lessonNumber
    );

    if (existing && existing.entries) {
      const map: Record<string, { status: AttendanceStatus; justification?: string; cert?: string }> = {};
      existing.entries.forEach((e) => {
        map[e.studentId] = {
          status: e.status,
          justification: e.justificationReason,
          cert: e.medicalCertificateProtocol,
        };
      });
      setLocalEntries(map);
    } else {
      // Default: all present
      const map: Record<string, { status: AttendanceStatus }> = {};
      classStudents.forEach((st) => {
        map[st.id] = { status: 'PRESENTE' };
      });
      setLocalEntries(map);
    }
  }, [activeClass?.id, activeSubject?.id, selectedDate, lessonNumber, attendanceSheets, classStudents]);

  // Calculations for current sheet
  const total = classStudents.length;
  const presentCount = classStudents.filter(
    (s) => (localEntries[s.id]?.status || 'PRESENTE') === 'PRESENTE'
  ).length;
  const justifiedCount = classStudents.filter(
    (s) => localEntries[s.id]?.status === 'FALTA_JUSTIFICADA'
  ).length;
  const absentCount = classStudents.filter(
    (s) => localEntries[s.id]?.status === 'FALTA'
  ).length;

  const attendanceRate = total > 0 ? Math.round(((presentCount + justifiedCount) / total) * 100) : 100;

  // Actions
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleSetJustification = (studentId: string, justification: string, cert?: string) => {
    setLocalEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: 'FALTA_JUSTIFICADA',
        justification,
        cert,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const map: Record<string, { status: AttendanceStatus }> = {};
    classStudents.forEach((st) => {
      map[st.id] = { status: 'PRESENTE' };
    });
    setLocalEntries(map);
  };

  const handleSave = () => {
    if (!activeClass || !activeSubject) return;

    const entries: StudentAttendanceEntry[] = classStudents.map((st) => {
      const item = localEntries[st.id] || { status: 'PRESENTE' };
      return {
        studentId: st.id,
        studentName: st.name,
        enrollmentNumber: st.enrollmentNumber,
        status: item.status,
        justificationReason: item.justification,
        medicalCertificateProtocol: item.cert,
      };
    });

    const sheetId = `att-sheet-${activeClass.id}-${activeSubject.id}-${selectedDate}-l${lessonNumber}`;
    const newSheet: AttendanceSheet = {
      id: sheetId,
      date: selectedDate,
      classId: activeClass.id,
      className: activeClass.name,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      schoolUnitId: activeClass.schoolUnitId,
      teacherName: teacherName || activeSubject.teacherName || 'Docente Responsável',
      lessonNumber,
      term: selectedTerm,
      entries,
      totalStudents: total,
      totalPresent: presentCount,
      totalAbsent: absentCount,
      totalJustified: justifiedCount,
      attendanceRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAttendanceSheet(newSheet);
    setSaveSuccessAlert(`Chamada do dia ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')} (${activeClass.name}) salva com sucesso!`);
    setTimeout(() => setSaveSuccessAlert(null), 4000);
  };

  // Official Attendance Sheet Print Handler
  const handlePrintAttendanceSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Folha Oficial de Frequência - ${activeClass?.name}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #0f172a; }
          .subtitle { font-size: 10pt; color: #475569; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 9pt; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; }
          .status-P { color: #059669; font-weight: bold; text-align: center; }
          .status-F { color: #dc2626; font-weight: bold; text-align: center; }
          .status-J { color: #d97706; font-weight: bold; text-align: center; }
          .summary { margin-top: 15px; display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: bold; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; }
          .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 9pt; }
          .sig-line { border-top: 1px solid #475569; padding-top: 5px; margin-top: 35px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${settings.name}</div>
            <div class="subtitle">DIÁRIO OFICIAL DE CLASSE - FOLHA DIÁRIA DE FREQUÊNCIA ESCOLAR</div>
          </div>
          <div style="text-align: right; font-size: 8pt; color: #64748b;">
            Emitido em: ${new Date().toLocaleString('pt-BR')}<br>
            INEP: ${settings.inepCode || '35128490'}
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>Turma:</strong> ${activeClass?.name} (${activeClass?.shift})</div>
          <div><strong>Componente:</strong> ${activeSubject?.name}</div>
          <div><strong>Docente:</strong> ${teacherName}</div>
          <div><strong>Data da Aula:</strong> ${dateFormatted}</div>
          <div><strong>Aula Nº:</strong> ${lessonNumber}ª Aula</div>
          <div><strong>Bimestre:</strong> ${selectedTerm}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">Nº</th>
              <th style="width: 100px;">Matrícula/RA</th>
              <th>Nome do(a) Estudante</th>
              <th style="width: 80px; text-align: center;">Situação</th>
              <th>Justificativa / Protocolo de Atestado</th>
            </tr>
          </thead>
          <tbody>
            ${classStudents
              .map((st, idx) => {
                const entry = localEntries[st.id] || { status: 'PRESENTE' };
                let statusLabel = 'PRESENTE';
                let statusClass = 'status-P';
                if (entry.status === 'FALTA') {
                  statusLabel = 'FALTA';
                  statusClass = 'status-F';
                } else if (entry.status === 'FALTA_JUSTIFICADA') {
                  statusLabel = 'JUSTIFICADA';
                  statusClass = 'status-J';
                }

                return `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td>${st.enrollmentNumber}</td>
                  <td><strong>${st.name}</strong></td>
                  <td class="${statusClass}">${statusLabel}</td>
                  <td>${entry.justification ? `${entry.justification} ${entry.cert ? `(Protocolo: ${entry.cert})` : ''}` : '-'}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div class="summary">
          <div>Total de Alunos: ${total}</div>
          <div style="color: #059669;">Presentes: ${presentCount}</div>
          <div style="color: #dc2626;">Faltas: ${absentCount}</div>
          <div style="color: #d97706;">Justificadas: ${justifiedCount}</div>
          <div>Índice de Presença: ${attendanceRate}%</div>
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
              Secretaria / Inspeção Escolar
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{saveSuccessAlert}</span>
          </div>
        </div>
      )}

      {/* Control Bar: Class, Subject, Date, Lesson and Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Chamada Diária & Frequência Escolar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lançamento rápido e registro em tempo real para a turma{' '}
              <strong>{activeClass?.name}</strong> na disciplina{' '}
              <strong>{activeSubject?.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Check className="h-4 w-4" />
              Marcar Todos Presentes
            </button>

            <button
              onClick={handlePrintAttendanceSheet}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir Folha
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Salvar Chamada
            </button>
          </div>
        </div>

        {/* Date and lesson selector row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Data da Aula:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Número da Aula:
            </label>
            <select
              value={lessonNumber}
              onChange={(e) => setLessonNumber(Number(e.target.value))}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value={1}>1ª Aula</option>
              <option value={2}>2ª Aula</option>
              <option value={3}>3ª Aula</option>
              <option value={4}>4ª Aula</option>
              <option value={5}>5ª Aula</option>
              <option value={6}>6ª Aula</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Bimestre Vigente:
            </label>
            <div className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              {selectedTerm}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Buscar Estudante:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por nome ou RA..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Matriculados</span>
            <span className="text-base font-black text-slate-900">{total}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
            <span className="block text-[10px] text-emerald-600 font-bold uppercase">Presentes</span>
            <span className="text-base font-black text-emerald-700">{presentCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
            <span className="block text-[10px] text-rose-600 font-bold uppercase">Faltas</span>
            <span className="text-base font-black text-rose-700">{absentCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
            <span className="block text-[10px] text-amber-600 font-bold uppercase">Justificadas</span>
            <span className="text-base font-black text-amber-700">{justifiedCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 col-span-2 sm:col-span-1">
            <span className="block text-[10px] text-indigo-600 font-bold uppercase">Frequência</span>
            <span className="text-base font-black text-indigo-700">{attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Student Attendance List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Relação Nominal dos Estudantes ({filteredStudents.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Clique nos botões de presença para alternar o status
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Nº</th>
                <th className="py-3 px-4">Estudante</th>
                <th className="py-3 px-4 w-32">Matrícula / RA</th>
                <th className="py-3 px-4 w-72 text-center">Status da Chamada</th>
                <th className="py-3 px-4">Justificativa / Atestado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.map((student, idx) => {
                const current = localEntries[student.id] || { status: 'PRESENTE' };
                const isPresent = current.status === 'PRESENTE';
                const isAbsent = current.status === 'FALTA';
                const isJustified = current.status === 'FALTA_JUSTIFICADA';

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isAbsent ? 'bg-rose-50/30' : isJustified ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{student.name}</span>
                        {student.hasAEE && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                            AEE
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {student.enrollmentNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* PRESENTE */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'PRESENTE')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Presente
                        </button>

                        {/* FALTA */}
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'FALTA')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            isAbsent
                              ? 'bg-rose-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Falta
                        </button>

                        {/* JUSTIFICADA */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isJustified) {
                              const reason = prompt('Informe a justificativa da ausência (ex: Atestado Médico, Consulta, etc.):', 'Atestado Médico');
                              if (reason !== null) {
                                const cert = prompt('Número do protocolo ou CRM do atestado (opcional):', 'MED-2026');
                                handleSetJustification(student.id, reason, cert || undefined);
                              }
                            } else {
                              handleSetStatus(student.id, 'PRESENTE');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            isJustified
                              ? 'bg-amber-500 text-white shadow-xs scale-102'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Justificada
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isJustified ? (
                        <div className="text-[11px] text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200">
                          <span className="font-bold">{current.justification || 'Justificada'}</span>
                          {current.cert && <span className="ml-1 text-slate-600">({current.cert})</span>}
                        </div>
                      ) : isAbsent ? (
                        <span className="text-[11px] font-semibold text-rose-600">
                          Ausência não justificada
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
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
