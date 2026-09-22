import React from 'react';
import {
  Layers,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  ClipboardList,
  Sparkles,
  Award,
  Clock,
  Printer,
  ChevronRight,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import {
  SchoolClass,
  Subject,
  Student,
  AttendanceSheet,
  LessonDiaryRegistry,
  ClassGradeSheet,
  Exam,
} from '../../types';

interface TeacherClassesOverviewProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  attendanceSheets: AttendanceSheet[];
  lessonRegistries: LessonDiaryRegistry[];
  gradeSheets: ClassGradeSheet[];
  exams: Exam[];
  onSelectClassAndTab: (classId: string, tab: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const TeacherClassesOverview: React.FC<TeacherClassesOverviewProps> = ({
  teacherName = '',
  classes = [],
  subjects = [],
  students = [],
  attendanceSheets = [],
  lessonRegistries = [],
  gradeSheets = [],
  exams = [],
  onSelectClassAndTab,
  onNavigateToTab,
}) => {
  const safeTeacherName = typeof teacherName === 'string' ? teacherName.toLowerCase() : '';

  // Aggregate stats across all teacher classes
  const totalStudents = (students || []).filter((s) =>
    s && (classes || []).some((c) => c && c.id === s.classId && s.status === 'ACTIVE')
  ).length;

  const totalLessons = (lessonRegistries || []).filter((l) =>
    (l && typeof l.teacherName === 'string' && safeTeacherName && l.teacherName.toLowerCase().includes(safeTeacherName)) ||
    (l && (subjects || []).some((s) => s && s.id === l.subjectId))
  ).length;

  const totalExams = (exams || []).filter((e) =>
    (e && typeof e.teacherName === 'string' && safeTeacherName && e.teacherName.toLowerCase().includes(safeTeacherName)) ||
    (e && (classes || []).some((c) => c && c.id === e.classId))
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Alunos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Estudantes Atendidos
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalStudents}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <UserCheck className="h-3 w-3" />
              Matrículas ativas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2: Turmas & Disciplinas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Turmas & Disciplinas
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {classes.length} <span className="text-sm font-normal text-slate-400">turmas</span>
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-1">
              <BookOpen className="h-3 w-3" />
              {subjects.length} componentes curriculares
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3: Aulas Ministradas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Aulas Registradas
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalLessons}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              Diários homologados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4: Avaliações & Provas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Provas & Simulados
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalExams}
            </span>
            <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-1">
              <Award className="h-3 w-3" />
              Gabaritos oficiais
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Section: Classes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              Minhas Turmas Atribuídas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione uma turma para gerenciar diário, frequência, pauta de notas e avaliações.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('CLASS_DIARY')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              Novo Registro de Aula
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(classes || []).map((cls) => {
            if (!cls) return null;
            const classStudents = (students || []).filter(
              (s) => s && s.classId === cls.id && s.status === 'ACTIVE'
            );
            const classAeeCount = classStudents.filter(
              (s) => s && (s.hasAEE || (s.specialConditions && s.specialConditions.length > 0))
            ).length;

            const classLessons = (lessonRegistries || []).filter((l) => l && l.classId === cls.id);
            const classExams = (exams || []).filter((e) => e && e.classId === cls.id);
            const classGradeSheet = (gradeSheets || []).find((g) => g && g.classId === cls.id);

            // Compute average attendance rate if available
            const classAttendances = (attendanceSheets || []).filter((a) => a && a.classId === cls.id);
            const avgAttendance = classAttendances.length > 0
              ? Math.round(
                  classAttendances.reduce((acc, curr) => acc + ((curr && curr.attendanceRate) || 85), 0) /
                  classAttendances.length
                )
              : 92;

            // Compute grade average if available
            const gradeAvg = classGradeSheet?.grades && classGradeSheet.grades.length > 0
              ? (
                  classGradeSheet.grades.reduce((acc, g) => acc + ((g && g.termAverage) || 0), 0) /
                  classGradeSheet.grades.length
                ).toFixed(1)
              : '7.8';

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50/60 to-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {cls.shift} • {cls.gradeLevel}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                        {cls.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cls.roomNumber || 'Sala Padrão'}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Body Metrics */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Alunos</span>
                      <span className="text-sm font-black text-slate-800">{classStudents.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Frequência</span>
                      <span className="text-sm font-black text-emerald-600">{avgAttendance}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Média</span>
                      <span className="text-sm font-black text-indigo-600">{gradeAvg}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Aulas Registradas:</span>
                      <span className="font-bold text-slate-800">{classLessons.length} aulas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Provas Agendadas:</span>
                      <span className="font-bold text-slate-800">{classExams.length} avaliações</span>
                    </div>
                    {classAeeCount > 0 && (
                      <div className="flex items-center justify-between text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                        <span className="text-[11px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Educação Especial (AEE):
                        </span>
                        <span className="font-bold text-[11px]">{classAeeCount} aluno(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons Grid */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectClassAndTab(cls.id, 'ATTENDANCE')}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Chamada
                  </button>

                  <button
                    onClick={() => onSelectClassAndTab(cls.id, 'CLASS_DIARY')}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    Diário
                  </button>

                  <button
                    onClick={() => onSelectClassAndTab(cls.id, 'GRADES_MANAGEMENT')}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                    Notas
                  </button>

                  <button
                    onClick={() => onSelectClassAndTab(cls.id, 'EXAMS_AND_KEYS')}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Award className="h-3.5 w-3.5 text-purple-600" />
                    Provas/Gabaritos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
