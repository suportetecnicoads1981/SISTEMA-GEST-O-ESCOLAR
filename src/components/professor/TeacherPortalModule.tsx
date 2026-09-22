import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  Users,
  Target,
  BookOpen,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import {
  SchoolClass,
  Subject,
  Student,
  AttendanceSheet,
  LessonDiaryRegistry,
  ClassGradeSheet,
  Exam,
  Question,
  ExamSubmission,
  TeacherLessonPlan,
  TeacherStudentPedagogicalNote,
  BnccSkill,
  SchoolSettings,
  SchoolUnit,
  StateEducationRegulation,
} from '../../types';
import { TeacherHeaderBar } from './TeacherHeaderBar';
import { TeacherClassesOverview } from './TeacherClassesOverview';
import { TeacherClassDiaryTab } from './TeacherClassDiaryTab';
import { TeacherAttendanceTab } from './TeacherAttendanceTab';
import { TeacherGradesTab } from './TeacherGradesTab';
import { TeacherExamsAndAnswerKeysTab } from './TeacherExamsAndAnswerKeysTab';
import { TeacherStudentRecordsTab } from './TeacherStudentRecordsTab';
import { TeacherLessonPlanningTab } from './TeacherLessonPlanningTab';

export type TeacherPortalSubTab =
  | 'CLASSES_OVERVIEW'
  | 'CLASS_DIARY'
  | 'ATTENDANCE'
  | 'GRADES_MANAGEMENT'
  | 'EXAMS_AND_KEYS'
  | 'STUDENT_RECORDS'
  | 'LESSON_PLANNING';

interface TeacherPortalModuleProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  schoolUnits: SchoolUnit[];
  settings: SchoolSettings;
  bnccSkills: BnccSkill[];
  stateRegulations: StateEducationRegulation[];
  activeStateRegulationCode: string;
  attendanceSheets: AttendanceSheet[];
  lessonRegistries: LessonDiaryRegistry[];
  classGradeSheets: ClassGradeSheet[];
  exams: Exam[];
  questions: Question[];
  submissions: ExamSubmission[];
  teacherLessonPlans: TeacherLessonPlan[];
  teacherStudentNotes: TeacherStudentPedagogicalNote[];
  currentUserTeacherName?: string;
  onSaveAttendanceSheet: (sheet: AttendanceSheet) => void;
  onSaveLessonRegistry: (registry: LessonDiaryRegistry) => void;
  onDeleteLessonRegistry: (registryId: string) => void;
  onSaveGradeSheet: (sheet: ClassGradeSheet) => void;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onSaveLessonPlan: (plan: TeacherLessonPlan) => void;
  onDeleteLessonPlan: (planId: string) => void;
  onSavePedagogicalNote: (note: TeacherStudentPedagogicalNote) => void;
  onAddBnccSkill?: (skill: BnccSkill) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const TeacherPortalModule: React.FC<TeacherPortalModuleProps> = ({
  students = [],
  classes = [],
  subjects = [],
  schoolUnits = [],
  settings,
  bnccSkills = [],
  stateRegulations = [],
  activeStateRegulationCode = 'SP',
  attendanceSheets = [],
  lessonRegistries = [],
  classGradeSheets = [],
  exams = [],
  questions = [],
  submissions = [],
  teacherLessonPlans = [],
  teacherStudentNotes = [],
  currentUserTeacherName,
  onSaveAttendanceSheet,
  onSaveLessonRegistry,
  onDeleteLessonRegistry,
  onSaveGradeSheet,
  onSaveExam,
  onDeleteExam,
  onSaveLessonPlan,
  onDeleteLessonPlan,
  onSavePedagogicalNote,
  onAddBnccSkill,
  onBack,
  onNavigate,
}) => {
  // Extract all unique teacher names available in the system
  const availableTeachers = useMemo(() => {
    const set = new Set<string>();
    if (currentUserTeacherName) set.add(currentUserTeacherName);
    subjects.forEach((s) => {
      if (s.teacherName) set.add(s.teacherName);
    });
    lessonRegistries.forEach((l) => {
      if (l.teacherName) set.add(l.teacherName);
    });
    exams.forEach((e) => {
      if (e.teacherName) set.add(e.teacherName);
    });
    // Defaults if empty
    if (set.size === 0) {
      set.add('Prof. Rodrigo Peixoto');
      set.add('Profa. Mariana Albuquerque');
      set.add('Prof. Marcos Vinicius Silva');
      set.add('Profa. Camila Guimarães');
    }
    return Array.from(set);
  }, [currentUserTeacherName, subjects, lessonRegistries, exams]);

  // Active Teacher State
  const [activeTeacherName, setActiveTeacherName] = useState<string>(() => {
    return currentUserTeacherName || availableTeachers[0] || 'Prof. Rodrigo Peixoto';
  });

  // Current Sub Tab
  const [activeSubTab, setActiveSubTab] = useState<TeacherPortalSubTab>('CLASSES_OVERVIEW');

  // Filter classes and subjects assigned to this teacher
  const teacherSubjects = useMemo(() => {
    const safeTeacher = typeof activeTeacherName === 'string' ? activeTeacherName.toLowerCase() : '';
    const list = (subjects || []).filter(
      (s) =>
        s &&
        typeof s.teacherName === 'string' &&
        safeTeacher &&
        s.teacherName.toLowerCase().includes(safeTeacher)
    );
    return list.length > 0 ? list : (subjects || []);
  }, [subjects, activeTeacherName]);

  const teacherClasses = useMemo(() => {
    const subjectClassIds = new Set(teacherSubjects.map((s) => s?.classId).filter(Boolean));
    const list = (classes || []).filter((c) => c && subjectClassIds.has(c.id));
    return list.length > 0 ? list : (classes || []);
  }, [classes, teacherSubjects]);

  // Selected Class & Subject in Context
  const [selectedClassId, setSelectedClassId] = useState<string>(() => teacherClasses[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => teacherSubjects[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState<string>('3º Bimestre');

  // Keep selected class & subject valid if teacher changes
  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(teacherClasses[0].id);
    }
    if (teacherSubjects.length > 0 && !teacherSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(teacherSubjects[0].id);
    }
  }, [teacherClasses, teacherSubjects, selectedClassId, selectedSubjectId]);

  const handleSelectClassAndTab = (classId: string, tab: string) => {
    setSelectedClassId(classId);
    setActiveSubTab(tab as TeacherPortalSubTab);
  };

  const handleTeacherBack = () => {
    if (activeSubTab !== 'CLASSES_OVERVIEW') {
      setActiveSubTab('CLASSES_OVERVIEW');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Teacher Header Bar */}
      <TeacherHeaderBar
        activeTeacherName={activeTeacherName}
        onChangeTeacher={setActiveTeacherName}
        availableTeachers={availableTeachers}
        teacherClasses={teacherClasses}
        teacherSubjects={teacherSubjects}
        activeClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        activeSubjectId={selectedSubjectId}
        onSelectSubject={setSelectedSubjectId}
        selectedTerm={selectedTerm}
        onChangeTerm={setSelectedTerm}
        onBack={onBack ? handleTeacherBack : undefined}
        backButtonLabel={activeSubTab !== 'CLASSES_OVERVIEW' ? '← Voltar às Minhas Turmas' : 'Voltar ao Painel Principal'}
      />

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('CLASSES_OVERVIEW')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CLASSES_OVERVIEW'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          Minhas Turmas
        </button>

        <button
          onClick={() => setActiveSubTab('CLASS_DIARY')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CLASS_DIARY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Diário de Classe & Aulas
        </button>

        <button
          onClick={() => setActiveSubTab('ATTENDANCE')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'ATTENDANCE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Frequência & Chamada
        </button>

        <button
          onClick={() => setActiveSubTab('GRADES_MANAGEMENT')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'GRADES_MANAGEMENT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Pauta & Lançamento de Notas
        </button>

        <button
          onClick={() => setActiveSubTab('EXAMS_AND_KEYS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'EXAMS_AND_KEYS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="h-4 w-4" />
          Provas & Gabaritos Oficiais
        </button>

        <button
          onClick={() => setActiveSubTab('STUDENT_RECORDS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'STUDENT_RECORDS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          Prontuário dos Alunos
        </button>

        <button
          onClick={() => setActiveSubTab('LESSON_PLANNING')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'LESSON_PLANNING'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Target className="h-4 w-4" />
          Planejamento Bimestral
        </button>
      </div>

      {/* Render Active Sub Tab */}
      {activeSubTab === 'CLASSES_OVERVIEW' && (
        <TeacherClassesOverview
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          students={students}
          attendanceSheets={attendanceSheets}
          lessonRegistries={lessonRegistries}
          gradeSheets={classGradeSheets}
          exams={exams}
          onSelectClassAndTab={handleSelectClassAndTab}
          onNavigateToTab={(t) => setActiveSubTab(t as TeacherPortalSubTab)}
        />
      )}

      {activeSubTab === 'CLASS_DIARY' && (
        <TeacherClassDiaryTab
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          settings={settings}
          bnccSkills={bnccSkills}
          activeClassId={selectedClassId}
          activeSubjectId={selectedSubjectId}
          selectedTerm={selectedTerm}
          lessonRegistries={lessonRegistries}
          onSaveLessonRegistry={onSaveLessonRegistry}
          onDeleteLessonRegistry={onDeleteLessonRegistry}
          onAddBnccSkill={onAddBnccSkill}
        />
      )}

      {activeSubTab === 'ATTENDANCE' && (
        <TeacherAttendanceTab
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          students={students}
          settings={settings}
          activeClassId={selectedClassId}
          activeSubjectId={selectedSubjectId}
          selectedTerm={selectedTerm}
          attendanceSheets={attendanceSheets}
          onSaveAttendanceSheet={onSaveAttendanceSheet}
        />
      )}

      {activeSubTab === 'GRADES_MANAGEMENT' && (
        <TeacherGradesTab
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          students={students}
          settings={settings}
          activeClassId={selectedClassId}
          activeSubjectId={selectedSubjectId}
          selectedTerm={selectedTerm}
          gradeSheets={classGradeSheets}
          onSaveGradeSheet={onSaveGradeSheet}
        />
      )}

      {activeSubTab === 'EXAMS_AND_KEYS' && (
        <TeacherExamsAndAnswerKeysTab
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          students={students}
          questions={questions}
          exams={exams}
          submissions={submissions}
          settings={settings}
          activeClassId={selectedClassId}
          activeSubjectId={selectedSubjectId}
          selectedTerm={selectedTerm}
          onSaveExam={onSaveExam}
          onDeleteExam={onDeleteExam}
        />
      )}

      {activeSubTab === 'STUDENT_RECORDS' && (
        <TeacherStudentRecordsTab
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          students={students}
          attendanceSheets={attendanceSheets}
          gradeSheets={classGradeSheets}
          activeClassId={selectedClassId}
          activeSubjectId={selectedSubjectId}
          selectedTerm={selectedTerm}
          pedagogicalNotes={teacherStudentNotes}
          onSavePedagogicalNote={onSavePedagogicalNote}
        />
      )}

      {activeSubTab === 'LESSON_PLANNING' && (
        <TeacherLessonPlanningTab
          teacherName={activeTeacherName}
          classes={teacherClasses}
          subjects={teacherSubjects}
          settings={settings}
          bnccSkills={bnccSkills}
          activeClassId={selectedClassId}
          activeSubjectId={selectedSubjectId}
          selectedTerm={selectedTerm}
          lessonPlans={teacherLessonPlans}
          onSaveLessonPlan={onSaveLessonPlan}
          onDeleteLessonPlan={onDeleteLessonPlan}
        />
      )}
    </div>
  );
};
