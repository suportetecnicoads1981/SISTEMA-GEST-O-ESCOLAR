import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  FileText,
  Printer,
  Download,
  Upload,
  Settings2,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Users,
  Check,
  Building,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Subject,
  SchoolUnit,
  SchoolSettings,
  StateEducationRegulation,
  AttendanceSheet,
  StudentAttendanceEntry,
  LessonDiaryRegistry,
  BnccSkill,
  AttendanceStatus,
} from '../../types';
import { PrintExportModal, ColumnDefinition } from '../common/PrintExportModal';

interface ClassDiaryModuleProps {
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
  onSaveAttendanceSheet: (sheet: AttendanceSheet) => void;
  onSaveLessonRegistry: (registry: LessonDiaryRegistry) => void;
  onDeleteLessonRegistry: (registryId: string) => void;
  onUpdateStateRegulation: (regulation: StateEducationRegulation) => void;
  onSelectActiveStateRegulation: (stateCode: string) => void;
  onImportStateRegulation: (imported: StateEducationRegulation) => void;
  onAddBnccSkill: (skill: BnccSkill) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export function ClassDiaryModule({
  students,
  classes,
  subjects,
  schoolUnits,
  settings,
  bnccSkills,
  stateRegulations,
  activeStateRegulationCode,
  attendanceSheets,
  lessonRegistries,
  onSaveAttendanceSheet,
  onSaveLessonRegistry,
  onDeleteLessonRegistry,
  onUpdateStateRegulation,
  onSelectActiveStateRegulation,
  onImportStateRegulation,
  onAddBnccSkill,
  onBack,
  onNavigate,
}: ClassDiaryModuleProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LESSONS' | 'OVERVIEW_DIARY' | 'REGULATIONS'>('ATTENDANCE');

  // Filters for Active Class & Subject
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTerm, setSelectedTerm] = useState<string>('3º Bimestre');
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [teacherNameInput, setTeacherNameInput] = useState<string>('Prof. Rodrigo Peixoto');

  // Attendance Form State
  const activeClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const activeSubject = useMemo(() => subjects.find((s) => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.status !== 'TRANSFERRED')
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [students, selectedClassId]);

  // Current active regulation
  const activeRegulation = useMemo(() => {
    return (
      stateRegulations.find((r) => r.stateCode === activeStateRegulationCode) ||
      stateRegulations[0]
    );
  }, [stateRegulations, activeStateRegulationCode]);

  // Attendance Entries in the active editor
  const [localAttendance, setLocalAttendance] = useState<Record<string, { status: AttendanceStatus; justification?: string; cert?: string }>>({});
  const [savedSuccessAlert, setSavedSuccessAlert] = useState<string | null>(null);

  // Synchronize local attendance when class or date changes
  React.useEffect(() => {
    const existing = attendanceSheets.find(
      (a) => a.classId === selectedClassId && a.subjectId === selectedSubjectId && a.date === selectedDate && a.lessonNumber === lessonNumber
    );

    const initialMap: Record<string, { status: AttendanceStatus; justification?: string; cert?: string }> = {};
    if (existing) {
      existing.entries.forEach((e) => {
        initialMap[e.studentId] = {
          status: e.status,
          justification: e.justificationReason,
          cert: e.medicalCertificateProtocol,
        };
      });
    } else {
      // Default all present
      classStudents.forEach((st) => {
        initialMap[st.id] = { status: 'PRESENTE' };
      });
    }
    setLocalAttendance(initialMap);
  }, [selectedClassId, selectedSubjectId, selectedDate, lessonNumber, attendanceSheets, classStudents]);

  // Bulk actions for attendance
  const setAllStatus = (status: AttendanceStatus) => {
    const next: Record<string, { status: AttendanceStatus; justification?: string; cert?: string }> = {};
    classStudents.forEach((s) => {
      next[s.id] = { status };
    });
    setLocalAttendance(next);
  };

  const handleToggleStudentStatus = (studentId: string) => {
    setLocalAttendance((prev) => {
      const current = prev[studentId]?.status || 'PRESENTE';
      let nextStatus: AttendanceStatus = 'PRESENTE';
      if (current === 'PRESENTE') nextStatus = 'FALTA';
      else if (current === 'FALTA') nextStatus = 'FALTA_JUSTIFICADA';
      else nextStatus = 'PRESENTE';

      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status: nextStatus,
        },
      };
    });
  };

  const handleSetStudentJustification = (studentId: string, justification: string, cert?: string) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        justification,
        cert: cert !== undefined ? cert : prev[studentId]?.cert,
      },
    }));
  };

  const handleSaveAttendance = () => {
    const entries: StudentAttendanceEntry[] = classStudents.map((st) => {
      const record = localAttendance[st.id] || { status: 'PRESENTE' };
      return {
        studentId: st.id,
        studentName: st.name,
        enrollmentNumber: st.enrollmentNumber,
        status: record.status,
        justificationReason: record.justification,
        medicalCertificateProtocol: record.cert,
      };
    });

    const totalStudents = entries.length;
    const totalPresent = entries.filter((e) => e.status === 'PRESENTE').length;
    const totalAbsent = entries.filter((e) => e.status === 'FALTA').length;
    const totalJustified = entries.filter((e) => e.status === 'FALTA_JUSTIFICADA').length;
    const attendanceRate = totalStudents > 0 ? Math.round(((totalPresent + totalJustified) / totalStudents) * 100) : 100;

    const sheetId = `att-${selectedClassId}-${selectedSubjectId}-${selectedDate}-${lessonNumber}`;
    const newSheet: AttendanceSheet = {
      id: sheetId,
      date: selectedDate,
      classId: selectedClassId,
      className: activeClass?.name || 'Turma Selecionada',
      subjectId: selectedSubjectId,
      subjectName: activeSubject?.name || 'Disciplina',
      schoolUnitId: activeClass?.schoolUnitId || schoolUnits[0]?.id,
      teacherName: teacherNameInput,
      lessonNumber,
      term: selectedTerm,
      entries,
      totalStudents,
      totalPresent,
      totalAbsent,
      totalJustified,
      attendanceRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAttendanceSheet(newSheet);
    setSavedSuccessAlert('Frequência diária salva e registrada com sucesso!');
    setTimeout(() => setSavedSuccessAlert(null), 3500);
  };

  // Lesson Registry Form State
  const [lessonContentInput, setLessonContentInput] = useState('');
  const [lessonMethodologyInput, setLessonMethodologyInput] = useState('');
  const [lessonHomeworkInput, setLessonHomeworkInput] = useState('');
  const [lessonObservationsInput, setLessonObservationsInput] = useState('');
  const [lessonOccurrencesInput, setLessonOccurrencesInput] = useState('');
  const [lessonCountInput, setLessonCountInput] = useState(2);
  const [selectedBnccCodes, setSelectedBnccCodes] = useState<string[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Filter BNCC skills relevant to class
  const [bnccSearch, setBnccSearch] = useState('');
  const filteredBnccSkills = useMemo(() => {
    return bnccSkills.filter((s) => {
      const matchSearch =
        s.code.toLowerCase().includes(bnccSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(bnccSearch.toLowerCase()) ||
        s.subject.toLowerCase().includes(bnccSearch.toLowerCase());
      return matchSearch;
    });
  }, [bnccSkills, bnccSearch]);

  const handleToggleBnccCode = (code: string) => {
    setSelectedBnccCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSaveLesson = () => {
    if (!lessonContentInput.trim()) {
      alert('Por favor, informe o conteúdo programático ministrado.');
      return;
    }

    const registry: LessonDiaryRegistry = {
      id: editingLessonId || `lesson-${Date.now()}`,
      date: selectedDate,
      classId: selectedClassId,
      className: activeClass?.name || 'Turma',
      subjectId: selectedSubjectId,
      subjectName: activeSubject?.name || 'Disciplina',
      schoolUnitId: activeClass?.schoolUnitId || schoolUnits[0]?.id,
      teacherName: teacherNameInput,
      lessonCount: lessonCountInput,
      term: selectedTerm,
      contentTaught: lessonContentInput,
      bnccSkillCodes: selectedBnccCodes,
      methodology: lessonMethodologyInput || 'Aula expositiva dialogada e exercícios.',
      homework: lessonHomeworkInput,
      pedagogicalObservations: lessonObservationsInput,
      occurrences: lessonOccurrencesInput,
      status: 'HOMOLOGADO_PROFESSOR',
      signedByTeacherAt: new Date().toISOString(),
    };

    onSaveLessonRegistry(registry);
    setEditingLessonId(null);
    setLessonContentInput('');
    setLessonMethodologyInput('');
    setLessonHomeworkInput('');
    setLessonObservationsInput('');
    setLessonOccurrencesInput('');
    setSelectedBnccCodes([]);
    setSavedSuccessAlert('Registro de aula do diário gravado e assinado digitalmente!');
    setTimeout(() => setSavedSuccessAlert(null), 3500);
  };

  // State Regulation Import State
  const [importedJsonText, setImportedJsonText] = useState('');
  const [showImportRegulationModal, setShowImportRegulationModal] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<StateEducationRegulation | null>(null);

  const handleImportRegulationFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.stateCode && parsed.regulationTitle) {
          const regToSave: StateEducationRegulation = {
            ...parsed,
            id: `reg-${parsed.stateCode.toLowerCase()}-${Date.now()}`,
            isCustomImported: true,
          };
          onImportStateRegulation(regToSave);
          onSelectActiveStateRegulation(regToSave.stateCode);
          setShowImportRegulationModal(false);
          alert(`Normativa estadual "${regToSave.regulationTitle}" importada com sucesso!`);
        } else {
          alert('Arquivo JSON inválido. Verifique a estrutura da normativa.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON da normativa.');
      }
    };
    reader.readAsText(file);
  };

  // Print Preview Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocumentType, setPrintDocumentType] = useState<'ATTENDANCE_SUMMARY' | 'LESSON_DIARY' | 'MONTHLY_DIARY'>('ATTENDANCE_SUMMARY');

  // Stats calculation for active class
  const classAttendanceStats = useMemo(() => {
    const relevantSheets = attendanceSheets.filter((s) => s.classId === selectedClassId);
    if (relevantSheets.length === 0) return { avgRate: 100, totalLessons: 0, atRiskCount: 0 };

    let totalPresences = 0;
    let totalAbsences = 0;
    let totalPossibilities = 0;

    // Calculate per student
    const studentAbsenceCount: Record<string, number> = {};
    relevantSheets.forEach((sh) => {
      sh.entries.forEach((en) => {
        totalPossibilities++;
        if (en.status === 'PRESENTE' || en.status === 'FALTA_JUSTIFICADA') {
          totalPresences++;
        } else {
          totalAbsences++;
          studentAbsenceCount[en.studentId] = (studentAbsenceCount[en.studentId] || 0) + 1;
        }
      });
    });

    const avgRate = totalPossibilities > 0 ? Math.round((totalPresences / totalPossibilities) * 100) : 100;
    const atRiskCount = Object.values(studentAbsenceCount).filter(
      (abs) => abs >= (activeRegulation?.consecutiveAbsencesAlert || 5)
    ).length;

    return {
      avgRate,
      totalLessons: relevantSheets.length,
      atRiskCount,
    };
  }, [attendanceSheets, selectedClassId, activeRegulation]);

  const handleDiaryBack = () => {
    if (activeTab !== 'ATTENDANCE') {
      setActiveTab('ATTENDANCE');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={handleDiaryBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform text-slate-500" />
            <span>{activeTab !== 'ATTENDANCE' ? '← Voltar à Frequência & Chamada' : 'Voltar ao Painel Principal'}</span>
          </button>
        </div>
      )}

      {/* Header & Regulation Badge */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Diário de Classe & Frequência Escolar
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Normativa: {activeRegulation.stateCode} ({activeRegulation.legislationNumber})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registro diário de presenças, conteúdos e habilidades da BNCC ajustável às normativas de cada Secretaria de Educação
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPrintDocumentType('MONTHLY_DIARY');
              setIsPrintModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Diário Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REGULATIONS')}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
            <span>Normas Estaduais ({stateRegulations.length})</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {savedSuccessAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{savedSuccessAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccessAlert(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Class, Subject, Date & Term Filter Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Turma Escolar
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.shift})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Componente Curricular / Disciplina
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Data da Aula
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Período / Bimestre
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="1º Bimestre">1º Bimestre</option>
            <option value="2º Bimestre">2º Bimestre</option>
            <option value="3º Bimestre">3º Bimestre</option>
            <option value="4º Bimestre">4º Bimestre</option>
            <option value="1º Trimestre">1º Trimestre</option>
            <option value="2º Trimestre">2º Trimestre</option>
            <option value="3º Trimestre">3º Trimestre</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Nº da Aula no Horário
          </label>
          <div className="flex items-center gap-2">
            <select
              value={lessonNumber}
              onChange={(e) => setLessonNumber(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value={1}>1ª Aula</option>
              <option value={2}>2ª Aula</option>
              <option value={3}>3ª Aula</option>
              <option value={4}>4ª Aula</option>
              <option value={5}>5ª Aula</option>
              <option value={6}>6ª Aula</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ATTENDANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Chamada & Frequência Diária</span>
          <span className="ml-1.5 px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {classStudents.length} Alunos
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LESSONS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'LESSONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Registro de Aulas & BNCC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW_DIARY')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'OVERVIEW_DIARY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Folha Oficial do Diário</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REGULATIONS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'REGULATIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          <span>Normativas Estaduais (SEDUC/SEE)</span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: CHAMADA & FREQUÊNCIA DIÁRIA
          ==================================================================== */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar & State Law Rule Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Alunos Matriculados
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {classStudents.length}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Turma: {activeClass?.name}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Presença Média Acumulada
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {classAttendanceStats.avgRate}%
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Mínimo Legal ({activeRegulation.stateCode}): {activeRegulation.minAttendancePercentage}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Alerta de Faltas ({activeRegulation.consecutiveAbsencesAlert} consecutivas)
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {classAttendanceStats.atRiskCount} Alunos
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Critério de Busca Ativa Escolar
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Professor Responsável
              </span>
              <input
                type="text"
                value={teacherNameInput}
                onChange={(e) => setTeacherNameInput(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 mt-1"
              />
            </div>
          </div>

          {/* Quick 1-Click Action Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Ações Rápidas:</span>
              <button
                type="button"
                onClick={() => setAllStatus('PRESENTE')}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ✓ Todos Presentes
              </button>
              <button
                type="button"
                onClick={() => setAllStatus('FALTA')}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ✕ Todos Ausentes
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintDocumentType('ATTENDANCE_SUMMARY');
                  setIsPrintModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Imprimir Lista de Chamada</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Gravar Frequência da Aula</span>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lista de Chamada Diária — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')} (Aula {lessonNumber})
                </h3>
                <p className="text-xs text-slate-400">
                  Clique no botão de status para alternar entre Presente, Falta e Falta Justificada
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {classStudents.length} Alunos Listados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">Nº</th>
                    <th className="p-3">Aluno / Matrícula (RA)</th>
                    <th className="p-3">Necessidades / AEE</th>
                    <th className="p-3 text-center">Status da Presença</th>
                    <th className="p-3">Justificativa / Atestado Médico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                        Nenhum aluno matriculado nesta turma.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((student, idx) => {
                      const record = localAttendance[student.id] || { status: 'PRESENTE' };
                      const isPresent = record.status === 'PRESENTE';
                      const isAbsent = record.status === 'FALTA';
                      const isJustified = record.status === 'FALTA_JUSTIFICADA';

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isAbsent ? 'bg-rose-50/40' : isJustified ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="p-3 text-center font-mono text-slate-400 font-bold">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              RA: {student.enrollmentNumber} • CPF: {student.cpf}
                            </div>
                          </td>
                          <td className="p-3">
                            {student.specialConditions && student.specialConditions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {student.specialConditions.map((cond) => (
                                  <span
                                    key={cond}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  >
                                    {cond}
                                  </span>
                                ))}
                                {student.hasAEE && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    AEE
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStudentStatus(student.id)}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 ${
                                isPresent
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                  : isAbsent
                                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isPresent && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />}
                              {isAbsent && <XCircle className="h-3.5 w-3.5 text-rose-700" />}
                              {isJustified && <Clock className="h-3.5 w-3.5 text-amber-700" />}
                              <span>{record.status.replace('_', ' ')}</span>
                            </button>
                          </td>
                          <td className="p-3">
                            {isJustified || isAbsent ? (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  placeholder="Motivo da ausência..."
                                  value={record.justification || ''}
                                  onChange={(e) =>
                                    handleSetStudentJustification(student.id, e.target.value)
                                  }
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                                {isJustified && (
                                  <input
                                    type="text"
                                    placeholder="Nº Atestado / Protocolo..."
                                    value={record.cert || ''}
                                    onChange={(e) =>
                                      handleSetStudentJustification(student.id, record.justification || '', e.target.value)
                                    }
                                    className="w-40 text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 bg-white shrink-0 font-mono text-[10px]"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">Aluno Presente</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: REGISTRO DE AULAS & BNCC
          ==================================================================== */}
      {activeTab === 'LESSONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form to Register Lesson */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingLessonId ? 'Editar Registro de Aula' : 'Lançamento de Conteúdo & Plano da Aula'}
                </h3>
                <p className="text-xs text-slate-400">
                  Conforme normativas da SEDUC/SEE e catálogo de competências da BNCC
                </p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">
                {selectedTerm}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade de Aulas Ministradas
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={lessonCountInput}
                  onChange={(e) => setLessonCountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professor Responsável
                </label>
                <input
                  type="text"
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Content Taught */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Conteúdo Programático Ministrado <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={lessonContentInput}
                onChange={(e) => setLessonContentInput(e.target.value)}
                placeholder="Descreva detalhadamente os tópicos e conteúdos trabalhados com a turma..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BNCC Skills Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Habilidades da BNCC Desenvolvidas ({selectedBnccCodes.length} selecionadas)
                </label>
                <span className="text-[10px] text-slate-400">
                  Base Nacional Comum Curricular
                </span>
              </div>

              {/* Selected Tags */}
              {selectedBnccCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  {selectedBnccCodes.map((code) => {
                    const sk = bnccSkills.find((s) => s.code === code);
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-xs"
                      >
                        <span>{code}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleBnccCode(code)}
                          className="hover:text-rose-600 cursor-pointer ml-1"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* BNCC Quick Search & List */}
              <div className="border border-slate-200 rounded-xl p-2.5 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50/50">
                <div className="relative mb-2">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Pesquisar habilidade BNCC por código ou descrição..."
                    value={bnccSearch}
                    onChange={(e) => setBnccSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {filteredBnccSkills.slice(0, 10).map((skill) => {
                  const isSelected = selectedBnccCodes.includes(skill.code);
                  return (
                    <div
                      key={skill.id}
                      onClick={() => handleToggleBnccCode(skill.code)}
                      className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-indigo-700">{skill.code}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{skill.educationLevel}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                        {skill.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methodology & Homework */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estratégia Metodológica / Didática
                </label>
                <textarea
                  value={lessonMethodologyInput}
                  onChange={(e) => setLessonMethodologyInput(e.target.value)}
                  placeholder="Ex: Aula expositiva, trabalho em grupo, laboratório..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarefas / Atividades Extraclasse
                </label>
                <textarea
                  value={lessonHomeworkInput}
                  onChange={(e) => setLessonHomeworkInput(e.target.value)}
                  placeholder="Ex: Exercícios do livro, leitura complementar..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Pedagogical Observations & Occurrences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Pedagógicas da Turma
                </label>
                <input
                  type="text"
                  value={lessonObservationsInput}
                  onChange={(e) => setLessonObservationsInput(e.target.value)}
                  placeholder="Desempenho geral, assimilação, dúvidas..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ocorrências Disciplinares / Individuais
                </label>
                <input
                  type="text"
                  value={lessonOccurrencesInput}
                  onChange={(e) => setLessonOccurrencesInput(e.target.value)}
                  placeholder="Ocorrências registradas nesta aula..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingLessonId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLessonId(null);
                    setLessonContentInput('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveLesson}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Salvar & Assinar Digitalmente</span>
              </button>
            </div>
          </div>

          {/* Historic Lessons for this Class & Subject */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Aulas Registradas ({lessonRegistries.filter((l) => l.classId === selectedClassId && l.subjectId === selectedSubjectId).length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPrintDocumentType('LESSON_DIARY');
                  setIsPrintModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir Registros</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {lessonRegistries
                .filter((l) => l.classId === selectedClassId && l.subjectId === selectedSubjectId)
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {lesson.lessonCount} {lesson.lessonCount === 1 ? 'Aula' : 'Aulas'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {lesson.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-3">
                      {lesson.contentTaught}
                    </p>

                    {lesson.bnccSkillCodes && lesson.bnccSkillCodes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lesson.bnccSkillCodes.map((code) => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-800"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      <span>{lesson.teacherName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLessonId(lesson.id);
                            setSelectedDate(lesson.date);
                            setLessonContentInput(lesson.contentTaught);
                            setSelectedBnccCodes(lesson.bnccSkillCodes || []);
                            setLessonMethodologyInput(lesson.methodology || '');
                            setLessonHomeworkInput(lesson.homework || '');
                            setLessonObservationsInput(lesson.pedagogicalObservations || '');
                            setLessonOccurrencesInput(lesson.occurrences || '');
                            setLessonCountInput(lesson.lessonCount);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Deseja excluir este registro de aula?')) {
                              onDeleteLessonRegistry(lesson.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: FOLHA OFICIAL DO DIÁRIO
          ==================================================================== */}
      {activeTab === 'OVERVIEW_DIARY' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Folha Oficial do Diário de Classe — {selectedTerm}
              </h3>
              <p className="text-xs text-slate-500">
                Visualização consolidada de presenças, faltas e índice de aproveitamento curricular da turma
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPrintDocumentType('MONTHLY_DIARY');
                setIsPrintModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Folha do Diário Oficial (A4)</span>
            </button>
          </div>

          {/* Consolidated Attendance Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Quadro Resumo de Frequência dos Alunos
              </span>
              <span className="text-xs font-medium text-slate-500">
                Carga Horária Mínima Obrigatória: {activeRegulation.minAnnualWorkloadHours}h / 200 dias
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Nº</th>
                    <th className="p-2.5">Nome do Aluno</th>
                    <th className="p-2.5 text-center">Aulas Dadas</th>
                    <th className="p-2.5 text-center text-emerald-700">Presenças</th>
                    <th className="p-2.5 text-center text-rose-700">Faltas</th>
                    <th className="p-2.5 text-center text-amber-700">Justificadas</th>
                    <th className="p-2.5 text-center">% Frequência</th>
                    <th className="p-2.5 text-center">Situação Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => {
                    const relevantSheets = attendanceSheets.filter((s) => s.classId === selectedClassId);
                    let presentCount = 0;
                    let absentCount = 0;
                    let justifiedCount = 0;

                    relevantSheets.forEach((sheet) => {
                      const entry = sheet.entries.find((e) => e.studentId === st.id);
                      if (entry) {
                        if (entry.status === 'PRESENTE') presentCount++;
                        else if (entry.status === 'FALTA') absentCount++;
                        else if (entry.status === 'FALTA_JUSTIFICADA') justifiedCount++;
                      }
                    });

                    const totalLessonsGiven = relevantSheets.length || 1;
                    const effectivePresences = presentCount + justifiedCount;
                    const rate = Math.round((effectivePresences / totalLessonsGiven) * 100);
                    const isBelowMin = rate < activeRegulation.minAttendancePercentage;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{st.name}</td>
                        <td className="p-2.5 text-center font-mono">{totalLessonsGiven}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{presentCount}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-rose-700">{absentCount}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-amber-700">{justifiedCount}</td>
                        <td className="p-2.5 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              isBelowMin
                                ? 'bg-rose-100 text-rose-800 font-black'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          {isBelowMin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertTriangle className="h-3 w-3" />
                              Risco de Evasão (Busca Ativa)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Regular ({activeRegulation.stateCode})
                            </span>
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
      )}

      {/* ====================================================================
          TAB 4: NORMATIVAS ESTADUAIS DE EDUCAÇÃO (SEDUC/SEE)
          ==================================================================== */}
      {activeTab === 'REGULATIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configurador de Normativas das Secretarias Estaduais de Educação
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste os parâmetros de frequência mínima, regime letivo e regras de busca ativa para qualquer estado brasileiro ou importe novas normas em JSON
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Importar Norma JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportRegulationFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Cards of Available State Regulations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stateRegulations.map((reg) => {
              const isActive = reg.stateCode === activeStateRegulationCode;

              return (
                <div
                  key={reg.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        UF: {reg.stateCode}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Normativa em Uso
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900">{reg.stateName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{reg.regulationTitle}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Freq. Mínima Fundamental:</span>
                        <span className="font-bold text-slate-800">{reg.minAttendancePercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Freq. Mínima Infantil:</span>
                        <span className="font-bold text-slate-800">{reg.minInfantileAttendancePercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Regime Letivo:</span>
                        <span className="font-bold text-slate-800">{reg.termType} ({reg.termsCount} períodos)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Alerta de Evasão:</span>
                        <span className="font-bold text-rose-700">{reg.consecutiveAbsencesAlert} faltas seguidas</span>
                      </div>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-800 block mb-0.5">Regra Conselho Tutelar:</span>
                      {reg.conselhoTutelarNotificationRule}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditingRegulation(reg)}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Ajustar Parâmetros
                    </button>

                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => onSelectActiveStateRegulation(reg.stateCode)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Ativar Este Estado
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700">Ativa no Sistema</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit Regulation Modal */}
          {editingRegulation && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Ajustar Normativa: {editingRegulation.stateName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingRegulation(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Frequência Mínima Fundamental (%)
                    </label>
                    <input
                      type="number"
                      value={editingRegulation.minAttendancePercentage}
                      onChange={(e) =>
                        setEditingRegulation({
                          ...editingRegulation,
                          minAttendancePercentage: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Frequência Mínima Infantil (%)
                    </label>
                    <input
                      type="number"
                      value={editingRegulation.minInfantileAttendancePercentage}
                      onChange={(e) =>
                        setEditingRegulation({
                          ...editingRegulation,
                          minInfantileAttendancePercentage: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dias Letivos Anuais
                    </label>
                    <input
                      type="number"
                      value={editingRegulation.minAnnualSchoolDays}
                      onChange={(e) =>
                        setEditingRegulation({
                          ...editingRegulation,
                          minAnnualSchoolDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Carga Horária Anual (Horas)
                    </label>
                    <input
                      type="number"
                      value={editingRegulation.minAnnualWorkloadHours}
                      onChange={(e) =>
                        setEditingRegulation({
                          ...editingRegulation,
                          minAnnualWorkloadHours: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regra de Notificação ao Conselho Tutelar
                  </label>
                  <textarea
                    value={editingRegulation.conselhoTutelarNotificationRule}
                    onChange={(e) =>
                      setEditingRegulation({
                        ...editingRegulation,
                        conselhoTutelarNotificationRule: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingRegulation(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStateRegulation(editingRegulation);
                      setEditingRegulation(null);
                      alert('Parâmetros da normativa atualizados com sucesso!');
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PRINT & EXPORT MODAL
          ==================================================================== */}
      {isPrintModalOpen && (
        <PrintExportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={
            printDocumentType === 'ATTENDANCE_SUMMARY'
              ? `Folha de Chamada Diária — ${activeClass?.name}`
              : printDocumentType === 'LESSON_DIARY'
              ? `Registro de Conteúdos do Diário — ${activeSubject?.name}`
              : `Diário de Classe Oficial — ${activeClass?.name}`
          }
          subtitle={`Componente Curricular: ${activeSubject?.name} • Período: ${selectedTerm} • Unidade: ${activeClass?.roomNumber || 'Sede'}`}
          documentCategory="DIÁRIO ESCOLAR OFICIAL"
          items={classStudents}
          settings={settings}
          extraHeaderInfo={[
            { label: 'Turma', value: activeClass?.name || '—' },
            { label: 'Turno', value: activeClass?.shift || '—' },
            { label: 'Disciplina', value: activeSubject?.name || '—' },
            { label: 'Professor(a)', value: teacherNameInput },
            { label: 'Data da Emissão', value: new Date().toLocaleDateString('pt-BR') },
            { label: 'Normativa', value: `${activeRegulation.stateCode} (${activeRegulation.legislationNumber})` },
          ]}
          summaryMetrics={[
            { label: 'Total de Alunos', value: classStudents.length },
            { label: 'Freq. Média Turma', value: `${classAttendanceStats.avgRate}%`, colorClass: 'text-emerald-700' },
            { label: 'Mínimo Legal', value: `${activeRegulation.minAttendancePercentage}%` },
            { label: 'Aulas Ministradas', value: classAttendanceStats.totalLessons },
          ]}
          defaultFileName={`diario_classe_${activeClass?.name?.toLowerCase().replace(/\s+/g, '_')}`}
          columns={[
            {
              key: 'enrollmentNumber',
              label: 'Matrícula / RA',
              getValue: (st: Student) => st.enrollmentNumber,
            },
            {
              key: 'name',
              label: 'Nome do Aluno',
              getValue: (st: Student) => st.name,
            },
            {
              key: 'specialConditions',
              label: 'Inclusão / CID',
              render: (st: Student) =>
                st.specialConditions && st.specialConditions.length > 0 ? (
                  <span className="font-semibold text-indigo-700">
                    {st.specialConditions.join(', ')}
                  </span>
                ) : (
                  '—'
                ),
              getValue: (st: Student) => st.specialConditions?.join(', ') || '—',
            },
            {
              key: 'attendanceStatus',
              label: 'Status da Frequência',
              render: (st: Student) => {
                const rec = localAttendance[st.id] || { status: 'PRESENTE' };
                return (
                  <span
                    className={`font-bold ${
                      rec.status === 'PRESENTE'
                        ? 'text-emerald-700'
                        : rec.status === 'FALTA'
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {rec.status.replace('_', ' ')}
                  </span>
                );
              },
              getValue: (st: Student) => localAttendance[st.id]?.status || 'PRESENTE',
            },
            {
              key: 'justification',
              label: 'Justificativa / Protocolo',
              getValue: (st: Student) =>
                localAttendance[st.id]?.justification ||
                localAttendance[st.id]?.cert ||
                '—',
            },
            {
              key: 'guardianPhone',
              label: 'Contato do Responsável',
              getValue: (st: Student) => st.guardianPhone || st.phone || '—',
            },
          ]}
        />
      )}
    </div>
  );
}
