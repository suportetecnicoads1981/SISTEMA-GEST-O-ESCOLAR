import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  HeartPulse,
  Award,
  Sparkles,
  UserCheck,
  Send,
  Printer,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Subject,
  AttendanceSheet,
  ClassGradeSheet,
  TeacherStudentPedagogicalNote,
} from '../../types';

interface TeacherStudentRecordsTabProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  attendanceSheets: AttendanceSheet[];
  gradeSheets: ClassGradeSheet[];
  activeClassId: string;
  activeSubjectId: string;
  selectedTerm: string;
  pedagogicalNotes: TeacherStudentPedagogicalNote[];
  onSavePedagogicalNote: (note: TeacherStudentPedagogicalNote) => void;
}

export const TeacherStudentRecordsTab: React.FC<TeacherStudentRecordsTabProps> = ({
  teacherName = '',
  classes = [],
  subjects = [],
  students = [],
  attendanceSheets = [],
  gradeSheets = [],
  activeClassId,
  activeSubjectId,
  selectedTerm,
  pedagogicalNotes = [],
  onSavePedagogicalNote,
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

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    () => classStudents[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  // New Note Form State
  const [noteCategory, setNoteCategory] = useState<'DESEMPENHO' | 'COMPORTAMENTO' | 'AEE_INCLUSAO' | 'EVOLUCAO' | 'ALERTA'>('DESEMPENHO');
  const [noteText, setNoteText] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [shareCoordination, setShareCoordination] = useState<boolean>(true);

  const filteredStudents = useMemo(() => {
    const list = classStudents || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter(
      (s) =>
        s &&
        ((s.name && s.name.toLowerCase().includes(q)) ||
          (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(q)))
    );
  }, [classStudents, searchTerm]);

  const activeStudent = useMemo(() => {
    return (
      classStudents.find((s) => s.id === selectedStudentId) ||
      classStudents[0]
    );
  }, [classStudents, selectedStudentId]);

  // Student specific notes
  const studentNotes = useMemo(() => {
    if (!activeStudent) return [];
    return pedagogicalNotes
      .filter((n) => n.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pedagogicalNotes, activeStudent]);

  // Student grades in active class
  const studentGradeEntry = useMemo(() => {
    const sheet = gradeSheets.find(
      (g) => g.classId === activeClass?.id && g.subjectId === activeSubject?.id
    );
    return sheet?.grades.find((g) => g.studentId === activeStudent?.id);
  }, [gradeSheets, activeClass?.id, activeSubject?.id, activeStudent?.id]);

  // Student attendance count in active subject
  const studentAttendanceStats = useMemo(() => {
    if (!activeStudent) return { totalLessons: 0, present: 0, absent: 0, justified: 0, rate: 100 };
    const relevantSheets = attendanceSheets.filter(
      (s) => s.classId === activeClass?.id && s.subjectId === activeSubject?.id
    );

    let present = 0;
    let absent = 0;
    let justified = 0;

    relevantSheets.forEach((sheet) => {
      const entry = sheet.entries.find((e) => e.studentId === activeStudent.id);
      if (entry) {
        if (entry.status === 'PRESENTE') present++;
        else if (entry.status === 'FALTA') absent++;
        else if (entry.status === 'FALTA_JUSTIFICADA') justified++;
      }
    });

    const total = present + absent + justified;
    const rate = total > 0 ? Math.round(((present + justified) / total) * 100) : 100;

    return { totalLessons: total, present, absent, justified, rate };
  }, [attendanceSheets, activeClass?.id, activeSubject?.id, activeStudent]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !activeClass || !activeSubject || !noteText.trim()) return;

    const newNote: TeacherStudentPedagogicalNote = {
      id: `note-${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      classId: activeClass.id,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      teacherName: teacherName || 'Docente Responsável',
      date: new Date().toISOString().split('T')[0],
      category: noteCategory,
      note: noteText,
      actionPlan: actionPlan || undefined,
      sharedWithCoordination: shareCoordination,
    };

    onSavePedagogicalNote(newNote);
    setNoteText('');
    setActionPlan('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Prontuário & Acompanhamento Individual dos Estudantes
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão pedagógica integrada do estudante: rendimento na disciplina, frequência, inclusão/AEE e anotações de intervenção.
          </p>
        </div>
      </div>

      {/* Main Grid: Student Selector List + Active Student Pedagogical Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selector (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar estudante por nome ou RA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
            {filteredStudents.map((st) => {
              const isSelected = (activeStudent?.id || '') === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 shadow-2xs'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">{st.name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">{st.enrollmentNumber}</span>
                  </div>

                  {st.hasAEE && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                      AEE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Student Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeStudent ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Student Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                    {activeStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{activeStudent.name}</h4>
                    <p className="text-xs text-slate-500">
                      RA: <span className="font-mono font-bold text-slate-700">{activeStudent.enrollmentNumber}</span> • Turma: <span className="font-bold text-indigo-700">{activeClass?.name}</span>
                    </p>
                  </div>
                </div>

                {activeStudent.hasAEE && (
                  <div className="bg-purple-50 border border-purple-200 text-purple-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4 text-purple-600" />
                    Estudante Apoiado por AEE / Inclusão
                  </div>
                )}
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Média no Bimestre</span>
                  <span className="text-base font-black text-indigo-700">
                    {studentGradeEntry?.termAverage ? studentGradeEntry.termAverage.toFixed(1) : '-'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Frequência</span>
                  <span className="text-base font-black text-emerald-700">
                    {studentAttendanceStats.rate}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                  <span className="text-[10px] text-rose-600 font-bold uppercase block">Faltas Injustificadas</span>
                  <span className="text-base font-black text-rose-700">
                    {studentAttendanceStats.absent}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                  <span className="text-[10px] text-amber-600 font-bold uppercase block">Faltas c/ Atestado</span>
                  <span className="text-base font-black text-amber-700">
                    {studentAttendanceStats.justified}
                  </span>
                </div>
              </div>

              {/* Special Conditions / Medical Info */}
              {activeStudent.specialConditions && activeStudent.specialConditions.length > 0 && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <HeartPulse className="h-4 w-4" />
                    Condições Especiais & Laudos Registrados:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {activeStudent.specialConditions.join(' • ')}
                  </p>
                </div>
              )}

              {/* Add Pedagogical Note Form */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-indigo-600" />
                  Registrar Nova Anotação / Intervenção Pedagógica
                </h5>

                <form onSubmit={handleSaveNote} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Categoria do Registro:
                      </label>
                      <select
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value as any)}
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="DESEMPENHO">Desempenho & Raciocínio</option>
                        <option value="EVOLUCAO">Evolução & Destaque Positivo</option>
                        <option value="ALERTA">Alerta de Aprendizagem / Dúvidas</option>
                        <option value="COMPORTAMENTO">Comportamento & Foco</option>
                        <option value="AEE_INCLUSAO">AEE / Adaptação Curricular</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Compartilhamento:
                      </label>
                      <label className="flex items-center gap-2 pt-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shareCoordination}
                          onChange={(e) => setShareCoordination(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Compartilhar com Coordenação Pedagógica</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Parecer / Anotação do Professor: *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Descreva a observação sobre o progresso, participação ou dificuldade do aluno..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Plano de Ação / Encaminhamento (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Oferecer lista complementar; encaminhar para monitoria..."
                      value={actionPlan}
                      onChange={(e) => setActionPlan(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Salvar Registro no Prontuário
                    </button>
                  </div>
                </form>
              </div>

              {/* History of Pedagogical Notes */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Histórico de Intervenções & Anotações ({studentNotes.length})
                </h5>

                {studentNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhuma anotação registrada no prontuário deste aluno ainda.
                  </p>
                ) : (
                  studentNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {n.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {n.teacherName}
                        </span>
                      </div>

                      <p className="text-slate-800 font-medium leading-relaxed">{n.note}</p>

                      {n.actionPlan && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                          <strong>Plano de Ação:</strong> {n.actionPlan}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
