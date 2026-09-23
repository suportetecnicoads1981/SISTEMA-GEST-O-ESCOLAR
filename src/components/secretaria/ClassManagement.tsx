import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Users,
  BookOpen,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  GraduationCap,
  Printer,
  BarChart3,
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Calendar,
  ArrowLeft,
  Home,
  ChevronRight,
  Award,
  Building,
  ArrowUpDown,
  FileDown,
  AlertCircle,
} from 'lucide-react';
import { SchoolClass, Course, Subject, Student, SchoolUnit, STANDARDIZED_GRADE_LEVELS } from '../../types';
import { PrintExportModal } from '../common/PrintExportModal';
import { SubjectMatrixEditor } from './SubjectMatrixEditor';
import {
  ConfigurablePrintModal,
  PrintColumnConfig,
  AppliedFilterItem,
  SummaryMetricItem,
} from '../common/ConfigurablePrintModal';
import { triggerPrint, downloadPrintableHtml } from '../../utils/printHelper';

interface ClassManagementProps {
  classes: SchoolClass[];
  courses: Course[];
  subjects: Subject[];
  students: Student[];
  schoolUnits?: SchoolUnit[];
  onSaveClass: (cls: SchoolClass) => void;
  onDeleteClass: (id: string) => void;
  onSaveSubject?: (subject: Subject) => void;
  onDeleteSubject?: (id: string) => void;
  onBatchImportClasses?: (classes: SchoolClass[]) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  courses,
  subjects,
  students,
  schoolUnits = [],
  onSaveClass,
  onDeleteClass,
  onSaveSubject,
  onDeleteSubject,
  onBatchImportClasses,
  onBack,
  onNavigate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState('ALL');
  const classPrintRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<SchoolClass>>({
    name: '',
    gradeLevel: '1º Ano - Ensino Fundamental',
    segment: 'ENSINO_FUNDAMENTAL',
    shift: 'MATUTINO',
    schoolYear: 2026,
    maxCapacity: 35,
    roomNumber: 'Sala 101',
    classTeacher: '',
    schoolUnitId: schoolUnits[0]?.id || '',
  });

  // Alphabetically sorted classes
  const sortedClasses = useMemo(() => {
    return [...classes]
      .filter((cls) => {
        const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesShift = filterShift === 'ALL' || cls.shift === filterShift ||
          (filterShift === 'MATUTINO' && cls.shift === 'MANHÃ') ||
          (filterShift === 'VESPERTINO' && cls.shift === 'TARDE');
        return matchesSearch && matchesShift;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
  }, [classes, searchTerm, filterShift]);

  // Colunas do Painel de Impressão Configurável de Turmas
  const classPrintColumns: PrintColumnConfig[] = useMemo(
    () => [
      { id: 'index', label: 'Nº', align: 'center', width: '38px', defaultVisible: true },
      { id: 'name', label: 'Nome da Turma', align: 'left', defaultVisible: true },
      { id: 'gradeLevel', label: 'Série / Nível', align: 'left', defaultVisible: true },
      { id: 'shift', label: 'Turno', align: 'center', width: '90px', defaultVisible: true },
      { id: 'schoolUnit', label: 'Unidade Escolar / Polo', align: 'left', defaultVisible: true },
      { id: 'roomNumber', label: 'Sala de Aula', align: 'center', width: '85px', defaultVisible: true },
      { id: 'classTeacher', label: 'Professor(a) Regente', align: 'left', defaultVisible: true },
      { id: 'enrolledCount', label: 'Matriculados', align: 'center', width: '85px', defaultVisible: true },
      { id: 'maxCapacity', label: 'Capacidade', align: 'center', width: '80px', defaultVisible: true },
      { id: 'vacancies', label: 'Vagas Livres', align: 'center', width: '80px', defaultVisible: false },
      { id: 'schoolYear', label: 'Ano Letivo', align: 'center', width: '75px', defaultVisible: false },
      { id: 'signature', label: 'Visto Secretaria', align: 'center', width: '120px', defaultVisible: true },
    ],
    []
  );

  const printClassAppliedFilters: AppliedFilterItem[] = useMemo(() => {
    const list: AppliedFilterItem[] = [];
    if (filterShift !== 'ALL') {
      list.push({ label: 'Turno', value: filterShift });
    } else {
      list.push({ label: 'Turno', value: 'Todos os Turnos' });
    }
    if (searchTerm.trim()) {
      list.push({ label: 'Busca', value: `"${searchTerm.trim()}"` });
    }
    return list;
  }, [filterShift, searchTerm]);

  const printClassSummaryMetrics: SummaryMetricItem[] = useMemo(() => {
    const totalEnrolled = sortedClasses.reduce((acc, c) => acc + students.filter((s) => s.classId === c.id).length, 0);
    const totalCapacity = sortedClasses.reduce((acc, c) => acc + (c.maxCapacity || c.capacity || 35), 0);
    return [
      { label: 'Total de Turmas', value: sortedClasses.length, color: 'text-slate-900' },
      { label: 'Estudantes Enturmados', value: totalEnrolled, color: 'text-indigo-600' },
      { label: 'Capacidade Total das Salas', value: totalCapacity, color: 'text-emerald-600' },
      { label: 'Vagas Remanescentes', value: Math.max(0, totalCapacity - totalEnrolled), color: 'text-amber-600' },
    ];
  }, [sortedClasses, students]);

  const renderPrintClassCell = (c: SchoolClass, colId: string, idx: number) => {
    const unit = schoolUnits.find((u) => u.id === c.schoolUnitId);
    const enrolled = students.filter((s) => s.classId === c.id).length;
    const capacity = c.maxCapacity || 35;
    const vacancies = Math.max(0, capacity - enrolled);

    switch (colId) {
      case 'index':
        return String(idx + 1);
      case 'name':
        return c.name;
      case 'gradeLevel':
        return c.gradeLevel || '—';
      case 'shift':
        return c.shift || 'Matutino';
      case 'schoolUnit':
        return unit?.name || 'Sede Central';
      case 'roomNumber':
        return c.roomNumber || 'Sala 101';
      case 'classTeacher':
        return c.classTeacher || 'A designar';
      case 'enrolledCount':
        return String(enrolled);
      case 'maxCapacity':
        return String(capacity);
      case 'vacancies':
        return String(vacancies);
      case 'schoolYear':
        return String(c.schoolYear || 2026);
      case 'signature':
        return <div className="h-4 border-b border-slate-400 w-full" />;
      default:
        return '';
    }
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormFeedback(null);
    setFormData({
      name: '',
      gradeLevel: '1º Ano - Ensino Fundamental',
      segment: 'ENSINO_FUNDAMENTAL',
      shift: 'MATUTINO',
      schoolYear: 2026,
      maxCapacity: 35,
      roomNumber: 'Sala 101',
      classTeacher: '',
      schoolUnitId: schoolUnits[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    setFormFeedback(null);
    setFormData({
      ...cls,
      schoolUnitId: cls.schoolUnitId || schoolUnits[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormFeedback('Por favor, informe o nome da turma.');
      return;
    }

    const newClass: SchoolClass = {
      id: editingClass?.id || `class-${Date.now()}`,
      name: formData.name.trim(),
      gradeLevel: formData.gradeLevel || '1º Ano - Ensino Fundamental',
      segment: (formData.segment as any) || 'ENSINO_FUNDAMENTAL',
      shift: (formData.shift as any) || 'MATUTINO',
      schoolYear: Number(formData.schoolYear) || 2026,
      maxCapacity: Number(formData.maxCapacity) || 35,
      roomNumber: formData.roomNumber?.trim() || 'Sala 101',
      classTeacher: formData.classTeacher?.trim() || '',
      schoolUnitId: formData.schoolUnitId || schoolUnits[0]?.id || '',
    };

    onSaveClass(newClass);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Nome da Turma', 'Etapa/Série', 'Segmento', 'Turno', 'Unidade Escolar', 'Sala', 'Capacidade', 'Matriculados', 'Professor Regente'];
    const rows = sortedClasses.map((c) => {
      const inClass = students.filter((s) => s.classId === c.id).length;
      const unit = schoolUnits.find((u) => u.id === c.schoolUnitId);
      return [
        `"${c.name}"`,
        `"${c.gradeLevel}"`,
        `"${c.segment}"`,
        `"${c.shift}"`,
        `"${unit?.name || 'Sede'}"`,
        `"${c.roomNumber || ''}"`,
        c.maxCapacity || (c as any).capacity || 35,
        inClass,
        `"${c.classTeacher || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relacao_turmas_alfabetica_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    try {
      let imported: SchoolClass[] = [];
      const trimmed = importText.trim();
      if (!trimmed) {
        setImportFeedback('Insira dados no formato CSV ou JSON.');
        return;
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        imported = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('nome')) return;
          const parts = line.includes(';') ? line.split(';') : line.split(',');
          const name = parts[0]?.replace(/"/g, '').trim() || `Turma ${idx + 1}`;
          const shift = (parts[1]?.replace(/"/g, '').trim().toUpperCase() as any) || 'MATUTINO';
          const room = parts[2]?.replace(/"/g, '').trim() || `Sala ${100 + idx}`;
          const teacher = parts[3]?.replace(/"/g, '').trim() || 'Prof. Coordenador';

          imported.push({
            id: `class-imp-${Date.now()}-${idx}`,
            name,
            gradeLevel: '1º Ano - Ensino Fundamental',
            segment: 'ENSINO_FUNDAMENTAL',
            shift,
            schoolYear: 2026,
            maxCapacity: 35,
            roomNumber: room,
            classTeacher: teacher,
          });
        });
      }

      if (imported.length > 0) {
        if (onBatchImportClasses) {
          onBatchImportClasses(imported);
        } else {
          imported.forEach((c) => onSaveClass(c));
        }
        setImportFeedback(`Sucesso! ${imported.length} turmas cadastradas em ordem.`);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportFeedback(null);
          setImportText('');
        }, 1200);
      }
    } catch (e: any) {
      setImportFeedback(`Erro no processamento: ${e.message}`);
    }
  };

  const totalCapacity = useMemo(
    () => classes.reduce((sum, c) => sum + (c.maxCapacity || (c as any).capacity || 35), 0),
    [classes]
  );

  return (
    <div className="space-y-4">
      {/* Module Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Turmas & Matrizes</span>
          </div>
        </div>

        {/* Quick Module Navigation Tabs */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onNavigate('STUDENTS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Secretaria & Alunos</span>
            </button>
            <button
              onClick={() => onNavigate('CLASSES')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Turmas ({classes.length})</span>
            </button>
            <button
              onClick={() => onNavigate('DOCUMENTS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Award className="h-3.5 w-3.5 text-slate-500" />
              <span>Documentos</span>
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Gestão de Turmas, Cursos e Matrizes Curriculares
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organização dos ciclos letivos, ordenação alfabética, turnos (Matutino/Vespertino) e capacidade de salas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Relatório de Capacidade e Ocupação"
          >
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Gerar Relatório</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Abrir Painel de Impressão Configurável (escolher colunas, filtros aplicados e cabeçalhos)"
          >
            <Printer className="h-4 w-4 text-indigo-600" />
            <span>Painel de Impressão</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Importar Turmas</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Nova Turma</span>
          </button>
        </div>
      </div>

      {/* Filter & Alphabetical Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Pesquisar turma, etapa ou sala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[220px]"
          />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold">Turno:</span>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Todos os Turnos</option>
              <option value="MATUTINO">Matutino (Manhã)</option>
              <option value="VESPERTINO">Vespertino (Tarde)</option>
              <option value="NOTURNO">Noturno (Noite)</option>
              <option value="INTEGRAL">Tempo Integral</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-600" />
            <span>Ordenadas em Ordem Alfabética (A-Z)</span>
          </span>
          <span className="text-xs text-slate-500 font-bold">
            {sortedClasses.length} de {classes.length} Turmas
          </span>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedClasses.map((cls) => {
          const enrolledCount = students.filter((s) => s.classId === cls.id).length;
          const capacityPercent = Math.min(100, Math.round((enrolledCount / cls.maxCapacity) * 100));
          const unit = schoolUnits.find((u) => u.id === cls.schoolUnitId);

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {cls.gradeLevel || cls.segment?.replace('_', ' ')}
                      </span>
                      {unit && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Building className="h-2.5 w-2.5" />
                          {unit.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      title="Editar turma"
                      aria-label={`Editar turma ${cls.name}`}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      title="Excluir turma"
                      aria-label={`Excluir turma ${cls.name}`}
                      onClick={() => {
                        if (window.confirm(`Excluir a turma ${cls.name}?`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Turno:</span>
                    <span className="font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                      {cls.shift === 'MANHÃ' ? 'Matutino' : cls.shift === 'TARDE' ? 'Vespertino' : cls.shift}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Espaço Físico:</span>
                    <span className="font-semibold text-slate-800">{cls.roomNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Professor Regente:</span>
                    <span className="font-semibold text-slate-800">{cls.classTeacher || 'A designar'}</span>
                  </div>
                </div>

                {/* Capacity progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Ocupação
                    </span>
                    <span className="font-bold text-slate-800">
                      {enrolledCount} / {cls.maxCapacity} ({capacityPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPercent >= 90
                          ? 'bg-rose-500'
                          : capacityPercent >= 70
                          ? 'bg-indigo-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matriz de disciplinas (cadastrar, alterar e excluir) */}
      <SubjectMatrixEditor subjects={subjects} onSaveSubject={onSaveSubject} onDeleteSubject={onDeleteSubject} />

      {/* Relatório de Turmas Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Relatório de Ocupação e Distribuição de Turmas
                  </h2>
                  <p className="text-xs text-slate-500">Estatísticas de infraestrutura física e alocação docente</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total de Salas</span>
                  <p className="text-2xl font-black text-slate-900">{classes.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Vagas Ofertadas</span>
                  <p className="text-2xl font-black text-emerald-700">{totalCapacity}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700">Taxa Geral de Ocupação</span>
                  <p className="text-2xl font-black text-indigo-700">
                    {Math.round((students.length / (totalCapacity || 1)) * 100)}%
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Tabela de Alocação por Turma</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Turma</th>
                        <th className="p-2.5">Turno</th>
                        <th className="p-2.5">Sala</th>
                        <th className="p-2.5">Regente</th>
                        <th className="p-2.5 text-center">Matriculados</th>
                        <th className="p-2.5 text-center">Capacidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classes.map((cls) => (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-800">{cls.name}</td>
                          <td className="p-2.5">{cls.shift}</td>
                          <td className="p-2.5 font-mono">{cls.roomNumber || 'Sala 101'}</td>
                          <td className="p-2.5 font-semibold text-indigo-600">{cls.classTeacher || 'A designar'}</td>
                          <td className="p-2.5 text-center font-bold">
                            {students.filter((s) => s.classId === cls.id).length}
                          </td>
                          <td className="p-2.5 text-center text-slate-500">{cls.maxCapacity || cls.capacity || 35}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAINEL DE IMPRESSÃO CONFIGURÁVEL DE TURMAS */}
      <ConfigurablePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Quadro Geral de Turmas, Horários & Capacidade - 2026"
        subtitle="Planejamento acadêmico, alocação de salas e distribuição de matrículas da Rede Escolar"
        columns={classPrintColumns}
        data={sortedClasses}
        appliedFilters={printClassAppliedFilters}
        summaryMetrics={printClassSummaryMetrics}
        defaultOrientation="landscape"
        renderCell={renderPrintClassCell}
      />

      {/* Modal de Importação de Turmas */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Importação de Turmas</h2>
                  <p className="text-xs text-slate-500">Cole linhas no formato CSV (Nome; Turno; Sala; Professor) ou JSON</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {importFeedback && (
                <div
                  className={`p-3 rounded-xl font-medium ${
                    importFeedback.includes('Sucesso')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importFeedback}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dados das Turmas (linha CSV ou JSON):
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Exemplo CSV:\n3º Ano A - Médio; MANHÃ; Sala 101; Prof. Ricardo Souza\n3º Ano B - Médio; MANHÃ; Sala 102; Profa. Camila Duarte\n2º Ano A - Médio; TARDE; Sala 103; Prof. Felipe Martins`}
                  className="w-full h-44 p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessImport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Cadastrar Turmas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Editar Dados da Turma' : 'Nova Turma'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {formFeedback && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{formFeedback}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Turma *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formFeedback) setFormFeedback(null);
                  }}
                  placeholder="Ex: 1º Ano A - Fundamental I"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {schoolUnits.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade Escolar / Escola *
                  </label>
                  <select
                    value={formData.schoolUnitId || ''}
                    onChange={(e) => setFormData({ ...formData, schoolUnitId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {schoolUnits.map((u) => {
                      const isRural = u.locationZone === 'ZONA_RURAL' || u.locationZone === 'RURAL' || u.zone === 'RURAL';
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name} ({isRural ? 'Zona Rural' : 'Zona Urbana'}) - {u.inepCode ? `INEP ${u.inepCode}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Etapa / Ano Letivo *
                  </label>
                  <select
                    value={formData.gradeLevel || '1º Ano - Ensino Fundamental'}
                    onChange={(e) => {
                      const val = e.target.value;
                      let seg: any = 'ENSINO_FUNDAMENTAL';
                      if (val.includes('Infantil')) seg = 'EDUCACAO_INFANTIL';
                      else if (val.includes('Médio')) seg = 'ENSINO_MEDIO';
                      else if (val.includes('EJA')) seg = 'EJA';
                      setFormData({ ...formData, gradeLevel: val, segment: seg });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {STANDARDIZED_GRADE_LEVELS.map((g) => (
                      <option key={typeof g === 'string' ? g : g.level} value={typeof g === 'string' ? g : g.level}>
                        {typeof g === 'string' ? g : g.level}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Segmento
                  </label>
                  <select
                    value={formData.segment || 'ENSINO_FUNDAMENTAL'}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="EDUCACAO_INFANTIL">Educação Infantil</option>
                    <option value="ENSINO_FUNDAMENTAL">Ensino Fundamental (1º ao 9º Ano)</option>
                    <option value="ENSINO_MEDIO">Ensino Médio</option>
                    <option value="EJA">Educação de Jovens e Adultos (EJA)</option>
                    <option value="TECNICO">Ensino Técnico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Turno *</label>
                  <select
                    value={formData.shift || 'MATUTINO'}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="MATUTINO">Matutino (Manhã)</option>
                    <option value="VESPERTINO">Vespertino (Tarde)</option>
                    <option value="NOTURNO">Noturno (Noite)</option>
                    <option value="INTEGRAL">Integral (Tempo Integral)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ano Calendário</label>
                  <input
                    type="number"
                    value={formData.schoolYear || 2026}
                    onChange={(e) => setFormData({ ...formData, schoolYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidade Máxima</label>
                  <input
                    type="number"
                    value={formData.maxCapacity || 35}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Espaço / Sala</label>
                  <input
                    type="text"
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="Ex: Sala 03 / Bloco B"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professor Regente / Coordenador</label>
                <input
                  type="text"
                  value={formData.classTeacher || ''}
                  onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                  placeholder="Nome do professor orientador ou regente da turma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
