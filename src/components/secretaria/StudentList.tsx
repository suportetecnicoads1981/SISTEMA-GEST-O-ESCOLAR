import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  UserPlus,
  Filter,
  Award,
  FileText,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Printer,
  BarChart3,
  FileSpreadsheet,
  GraduationCap,
  Users,
  X,
  ArrowLeft,
  Home,
  Layers,
  ChevronRight,
  UserX,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Eye,
  Sliders,
  SlidersHorizontal,
  Building2,
  School,
  Clock,
  RotateCcw,
  Sparkles,
  FolderOpen,
  MapPin,
  Stethoscope,
  Tag,
} from 'lucide-react';
import { triggerPrint } from '../../utils/printHelper';
import {
  ConfigurablePrintModal,
  PrintColumnConfig,
  AppliedFilterItem,
  SummaryMetricItem,
} from '../common/ConfigurablePrintModal';
import {
  Student,
  SchoolClass,
  Course,
  AcademicHistory,
  SchoolUnit,
  DROPOUT_REASON_INFO,
  CADASTRAL_STATUS_INFO,
  ACTIVE_SEARCH_STATUS_INFO,
} from '../../types';
import { StudentModal } from './StudentModal';
import { SchoolUnitModal } from '../municipal/SchoolUnitModal';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';
import { UniversalDataImportModal } from './UniversalDataImportModal';
import { StudentQuickEditModal } from './StudentQuickEditModal';
import { CadastralPendingCensusDashbox } from '../dashboard/CadastralPendingCensusDashbox';
import { PredictiveAlertsModal } from './PredictiveAlertsModal';
import { computePredictiveAlerts } from '../../utils/predictiveAlertsEngine';
import { AttendanceSheet, ClassGradeSheet, NotificationItem } from '../../types';
import { confirmDialog } from '../../utils/dialogs';

interface StudentListProps {
  students: Student[];
  classes: SchoolClass[];
  courses?: Course[];
  histories?: AcademicHistory[];
  schoolUnits?: SchoolUnit[];
  attendanceSheets?: AttendanceSheet[];
  classGradeSheets?: ClassGradeSheet[];
  notifications?: NotificationItem[];
  onSaveNotification?: (notification: NotificationItem) => void;
  onBatchSaveNotifications?: (notifications: NotificationItem[]) => void;
  onSaveSchoolUnit?: (unit: SchoolUnit) => void;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onIssueDocument?: (studentId: string, docType?: string) => void;
  onGenerateDocument?: (studentId: string, docType: string) => void;
  onBatchImportStudents?: (
    students: Student[],
    schoolUnits?: SchoolUnit[],
    classes?: SchoolClass[]
  ) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students = [],
  classes = [],
  courses = [],
  histories = [],
  schoolUnits = [],
  attendanceSheets = [],
  classGradeSheets = [],
  notifications = [],
  onSaveNotification,
  onBatchSaveNotifications,
  onSaveSchoolUnit,
  onSaveStudent,
  onDeleteStudent,
  onIssueDocument,
  onGenerateDocument,
  onBatchImportStudents,
  onBack,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedCadastralFilter, setSelectedCadastralFilter] = useState('ALL');
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [showAdvancedFilterDrawer, setShowAdvancedFilterDrawer] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isUniversalImportModalOpen, setIsUniversalImportModalOpen] = useState(false);
  const [showPendingCensusDashbox, setShowPendingCensusDashbox] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [quickEditStudent, setQuickEditStudent] = useState<Student | null>(null);
  const [isSchoolUnitModalOpen, setIsSchoolUnitModalOpen] = useState(false);
  const [schoolUnitToEdit, setSchoolUnitToEdit] = useState<SchoolUnit | null>(null);
  const [schoolUnitActionToast, setSchoolUnitActionToast] = useState<string | null>(null);
  const [isPredictiveAlertsModalOpen, setIsPredictiveAlertsModalOpen] = useState(false);
  const studentPrintRef = useRef<HTMLDivElement>(null);

  // Motor de Inteligência & Alertas Preditivos (3+ faltas consecutivas ou queda >= 20% no rendimento)
  const predictiveResult = useMemo(() => {
    return computePredictiveAlerts(
      students,
      attendanceSheets,
      classGradeSheets,
      histories,
      classes,
      schoolUnits,
      notifications
    );
  }, [students, attendanceSheets, classGradeSheets, histories, classes, schoolUnits, notifications]);

  const handleDocAction = (studentId: string, docType: string) => {
    if (onIssueDocument) {
      onIssueDocument(studentId, docType);
    } else if (onGenerateDocument) {
      onGenerateDocument(studentId, docType);
    }
  };

  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes]
  );

  // Lista unificada e enriquecida de Unidades Escolares com contagem de alunos
  const availableSchoolUnits = useMemo(() => {
    const unitMap = new Map<string, { id: string; name: string; type: string; count: number }>();

    // 1. Unidades já cadastradas nas propriedades
    schoolUnits.forEach((u) => {
      unitMap.set(u.id, {
        id: u.id,
        name: u.name,
        type: u.type,
        count: 0,
      });
    });

    // Se não houver nenhuma unidade cadastrada, cria a Sede Central padrão
    if (unitMap.size === 0) {
      unitMap.set('unit-sede-central', {
        id: 'unit-sede-central',
        name: 'Sede Central - SucessoEdu',
        type: 'SEDE_CENTRAL',
        count: 0,
      });
    }

    // 2. Extrai unidades originárias mencionadas diretamente nos alunos
    students.forEach((s) => {
      if (s.schoolOriginName) {
        const originNormalized = s.schoolOriginName.trim();
        const existingByOrigin = Array.from(unitMap.values()).find(
          (u) => u.name.toLowerCase() === originNormalized.toLowerCase()
        );
        if (!existingByOrigin) {
          const customId = `unit-origin-${originNormalized.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          unitMap.set(customId, {
            id: customId,
            name: originNormalized,
            type: originNormalized.toLowerCase().includes('polo') || originNormalized.toLowerCase().includes('praia')
              ? 'POLO_REMOTO'
              : 'ESCOLA_ANEXA',
            count: 0,
          });
        }
      }
    });

    // 3. Contabiliza a quantidade de alunos em cada unidade
    const unitsList = Array.from(unitMap.values());
    students.forEach((s) => {
      let matched = false;
      // Casamento por schoolUnitId direto
      if (s.schoolUnitId && unitMap.has(s.schoolUnitId)) {
        unitMap.get(s.schoolUnitId)!.count += 1;
        matched = true;
      }
      // Casamento por schoolOriginName
      if (!matched && s.schoolOriginName) {
        const found = unitsList.find(
          (u) => u.name.toLowerCase() === s.schoolOriginName?.trim().toLowerCase()
        );
        if (found) {
          found.count += 1;
          matched = true;
        }
      }
      // Se não deu match, atribui à Sede Central
      if (!matched && unitsList.length > 0) {
        const sede = unitsList.find((u) => u.type === 'SEDE_CENTRAL') || unitsList[0];
        if (sede) {
          sede.count += 1;
        }
      }
    });

    return unitsList;
  }, [schoolUnits, students]);

  // Unidade Escolar Ativa Selecionada no Filtro para visualização detalhada e edição
  const activeSelectedSchoolUnit: SchoolUnit | null = useMemo(() => {
    if (selectedUnitFilter === 'ALL') return null;

    // 1. Busca direta nas unidades cadastradas por ID
    const foundById = schoolUnits.find((u) => u.id === selectedUnitFilter);
    if (foundById) return foundById;

    // 2. Busca na lista disponível unificada
    const availableItem = availableSchoolUnits.find((u) => u.id === selectedUnitFilter);
    if (!availableItem) return null;

    // Verifica se há unidade cadastrada com o mesmo nome
    const cleanAvailableName = availableItem.name.replace(/^escola:\s*/i, '').trim().toLowerCase();
    const foundByName = schoolUnits.find(
      (u) =>
        u.name.toLowerCase().trim() === availableItem.name.toLowerCase().trim() ||
        u.name.toLowerCase().replace(/^escola:\s*/i, '').trim() === cleanAvailableName
    );
    if (foundByName) return foundByName;

    // 3. Monta uma estrutura completa de SchoolUnit caso seja originária de importação ou polo recente
    const studentsInSchool = students.filter(
      (s) =>
        s.schoolUnitId === availableItem.id ||
        (s.schoolOriginName && s.schoolOriginName.toLowerCase().trim() === availableItem.name.toLowerCase().trim())
    );

    const gradesServedSet = new Set<string>();
    studentsInSchool.forEach((s) => {
      if (s.series) gradesServedSet.add(s.series);
    });

    const isRural =
      availableItem.name.toLowerCase().includes('praia') ||
      availableItem.name.toLowerCase().includes('brito') ||
      availableItem.name.toLowerCase().includes('rural') ||
      availableItem.type === 'POLO_REMOTO';

    const synthUnit: SchoolUnit = {
      id: availableItem.id.startsWith('unit-') ? availableItem.id : `unit-${availableItem.id}`,
      name: availableItem.name,
      tradeName: availableItem.name.replace(/^ESCOLA:\s*/i, '').trim(),
      inepCode: 'Pendente de Regularização no Censo',
      type: availableItem.type === 'POLO_REMOTO' ? 'ESCOLA_POLO' : availableItem.type === 'SEDE_CENTRAL' ? 'SEDE_CENTRAL' : 'ESCOLA_SATELITE',
      locationZone: isRural ? 'ZONA_RURAL' : 'ZONA_URBANA',
      cadastralStatus: 'INCOMPLETE',
      totalStudents: studentsInSchool.length || availableItem.count,
      totalTeachers: 0,
      totalClasses: 0,
      hasInternet: false,
      syncStatus: 'PENDENTE',
      district: isRural ? 'Comunidade / Zona Rural' : 'Sede Municipal',
      address: 'Localidade da Escola (Aguardando Regularização Cadastral pela Secretaria)',
      directorName: 'Diretoria / Coordenação (Pendente de Cadastro)',
      phone: '(00) Pendente',
      email: 'secretaria.escola@educacao.gov.br',
      gradesServed: Array.from(gradesServedSet),
      gradesServedText: Array.from(gradesServedSet).join(', ') || undefined,
      pendingFields: [
        'Código INEP da Escola',
        'Ato / Decreto de Criação Escolar',
        'Nome do(a) Diretor(a)',
        'Telefone e Contato Oficial',
        'Endereço Completo e CEP',
      ],
      createdViaImport: true,
    };

    return synthUnit;
  }, [selectedUnitFilter, schoolUnits, availableSchoolUnits, students]);

  // Alunos pertencentes à unidade escolar ativa selecionada
  const studentsInSelectedUnit = useMemo(() => {
    if (!activeSelectedSchoolUnit) return [];
    const unitName = activeSelectedSchoolUnit.name.toLowerCase().trim();
    return students.filter((s) => {
      if (s.schoolUnitId === activeSelectedSchoolUnit.id) return true;
      if (s.schoolOriginName && s.schoolOriginName.toLowerCase().trim() === unitName) return true;
      if (activeSelectedSchoolUnit.type === 'SEDE_CENTRAL' && !s.schoolUnitId && !s.schoolOriginName) return true;
      return false;
    });
  }, [activeSelectedSchoolUnit, students]);

  // Abre modal para edição dos dados cadastrais da unidade escolar
  const handleOpenEditSchoolUnit = () => {
    if (!activeSelectedSchoolUnit) return;
    setSchoolUnitToEdit(activeSelectedSchoolUnit);
    setIsSchoolUnitModalOpen(true);
  };

  // Salva alterações da unidade escolar selecionada
  const handleSaveSchoolUnitModal = (updatedUnit: SchoolUnit) => {
    if (onSaveSchoolUnit) {
      onSaveSchoolUnit(updatedUnit);
    }
    setSchoolUnitActionToast(`Dados da Unidade Escolar "${updatedUnit.name}" salvos com sucesso!`);
    setTimeout(() => setSchoolUnitActionToast(null), 5000);
    setIsSchoolUnitModalOpen(false);
  };

  // Lista unificada e enriquecida de Séries / Etapas com contagem de alunos
  const availableSeries = useMemo(() => {
    const seriesCountMap = new Map<string, number>();

    students.forEach((student) => {
      let s = (student.series || '').trim();
      if (!s && student.classId) {
        const cls = classes.find((c) => c.id === student.classId);
        if (cls?.gradeLevel) {
          s = cls.gradeLevel.trim();
        }
      }
      if (!s) {
        s = 'Ensino Fundamental';
      }
      seriesCountMap.set(s, (seriesCountMap.get(s) || 0) + 1);
    });

    // Inclui séries das turmas cadastradas mesmo se sem alunos no momento
    classes.forEach((c) => {
      if (c.gradeLevel && !seriesCountMap.has(c.gradeLevel.trim())) {
        seriesCountMap.set(c.gradeLevel.trim(), 0);
      }
    });

    return Array.from(seriesCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
  }, [students, classes]);

  // Turmas disponíveis com contagem dinâmica de alunos
  const availableClasses = useMemo(() => {
    return classes.map((cls) => {
      const studentCount = students.filter((s) => s.classId === cls.id).length;
      return {
        ...cls,
        studentCount,
      };
    });
  }, [classes, students]);

  // Contagem de filtros ativos para badge visual
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedUnitFilter !== 'ALL') count++;
    if (selectedSeriesFilter !== 'ALL') count++;
    if (selectedClassFilter !== 'ALL') count++;
    if (selectedShiftFilter !== 'ALL') count++;
    if (selectedStatusFilter !== 'ALL') count++;
    if (selectedCadastralFilter !== 'ALL') count++;
    if (selectedSpecialFilter !== 'ALL') count++;
    if (selectedZoneFilter !== 'ALL') count++;
    if (selectedGenderFilter !== 'ALL') count++;
    return count;
  }, [
    searchTerm,
    selectedUnitFilter,
    selectedSeriesFilter,
    selectedClassFilter,
    selectedShiftFilter,
    selectedStatusFilter,
    selectedCadastralFilter,
    selectedSpecialFilter,
    selectedZoneFilter,
    selectedGenderFilter,
  ]);

  // Função para limpar todos os filtros
  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedUnitFilter('ALL');
    setSelectedSeriesFilter('ALL');
    setSelectedClassFilter('ALL');
    setSelectedShiftFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSelectedCadastralFilter('ALL');
    setSelectedSpecialFilter('ALL');
    setSelectedZoneFilter('ALL');
    setSelectedGenderFilter('ALL');
  };

  // Motor central de filtragem com suporte a Unidade, Série, Turma e Filtros Avançados
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Busca textual abrangente (Nome, RA, CPF, E-mail, Responsável, Escola de Origem, Série)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesRa = student.enrollmentNumber.toLowerCase().includes(q);
        const matchesCpf = (student.cpf || '').includes(q);
        const matchesEmail = (student.email || '').toLowerCase().includes(q);
        const matchesGuardian = (student.guardianName || '').toLowerCase().includes(q);
        const matchesSchool = (student.schoolOriginName || '').toLowerCase().includes(q);
        const matchesSeries = (student.series || '').toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesRa &&
          !matchesCpf &&
          !matchesEmail &&
          !matchesGuardian &&
          !matchesSchool &&
          !matchesSeries
        ) {
          return false;
        }
      }

      // 2. Filtro por Unidade Escolar
      if (selectedUnitFilter !== 'ALL') {
        const matchedUnitObj = availableSchoolUnits.find((u) => u.id === selectedUnitFilter);
        const unitName = matchedUnitObj ? matchedUnitObj.name.toLowerCase() : '';

        const matchesUnitId = student.schoolUnitId === selectedUnitFilter;
        const matchesOrigin =
          student.schoolOriginName &&
          (student.schoolOriginName.toLowerCase() === unitName ||
            `unit-origin-${student.schoolOriginName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` === selectedUnitFilter);

        const isSede = matchedUnitObj && (matchedUnitObj.type === 'SEDE_CENTRAL' || unitName.includes('sede'));
        const matchesDefaultSede = isSede && !student.schoolUnitId && !student.schoolOriginName;

        if (!matchesUnitId && !matchesOrigin && !matchesDefaultSede) {
          return false;
        }
      }

      // 3. Filtro por Série / Etapa
      if (selectedSeriesFilter !== 'ALL') {
        const stdSeries = (student.series || '').toUpperCase().trim();
        const targetSeries = selectedSeriesFilter.toUpperCase().trim();
        const matchedClass = classes.find((c) => c.id === student.classId);
        const classGrade = (matchedClass?.gradeLevel || '').toUpperCase().trim();
        const className = (matchedClass?.name || '').toUpperCase().trim();

        const matchSeriesDirect = stdSeries.includes(targetSeries) || targetSeries.includes(stdSeries);
        const matchClassGrade = classGrade.includes(targetSeries) || targetSeries.includes(classGrade);
        const matchClassName = className.includes(targetSeries);

        if (!matchSeriesDirect && !matchClassGrade && !matchClassName) {
          return false;
        }
      }

      // 4. Filtro por Turma
      if (selectedClassFilter !== 'ALL') {
        if (student.classId !== selectedClassFilter) {
          return false;
        }
      }

      // 5. Filtro por Turno
      if (selectedShiftFilter !== 'ALL') {
        const matchedClass = classes.find((c) => c.id === student.classId);
        const stdShift = (student.shift || matchedClass?.shift || '').toUpperCase();
        const targetShift = selectedShiftFilter.toUpperCase();
        if (!stdShift.includes(targetShift) && !targetShift.includes(stdShift)) {
          return false;
        }
      }

      // 6. Filtro por Status da Matrícula
      if (selectedStatusFilter !== 'ALL') {
        if (student.status !== selectedStatusFilter) {
          return false;
        }
      }

      // 7. Filtro por Situação Cadastral (Censo)
      if (selectedCadastralFilter !== 'ALL') {
        const studentCadastral = student.cadastralStatus || 'OK';
        if (studentCadastral !== selectedCadastralFilter) {
          return false;
        }
      }

      // 8. Filtro por Condição Especial / Laudo / PCD / AEE
      if (selectedSpecialFilter !== 'ALL') {
        const hasReport =
          !!student.hasMedicalReport ||
          (student.medicalClassification &&
            student.medicalClassification !== 'Não declarada' &&
            student.medicalClassification !== 'NENHUMA');
        const hasAEE = (student.specialNeeds && student.specialNeeds.length > 0) || hasReport;

        if (selectedSpecialFilter === 'WITH_REPORT' && !hasReport) return false;
        if (selectedSpecialFilter === 'WITH_AEE' && !hasAEE) return false;
        if (selectedSpecialFilter === 'NO_SPECIAL' && (hasReport || hasAEE)) return false;
      }

      // 9. Filtro por Zona de Residência
      if (selectedZoneFilter !== 'ALL') {
        const stdZone = student.locationZone || 'ZONA_URBANA';
        if (stdZone !== selectedZoneFilter) {
          return false;
        }
      }

      // 10. Filtro por Gênero
      if (selectedGenderFilter !== 'ALL') {
        const stdGender = student.gender || 'OTHER';
        if (stdGender !== selectedGenderFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    students,
    classes,
    availableSchoolUnits,
    searchTerm,
    selectedUnitFilter,
    selectedSeriesFilter,
    selectedClassFilter,
    selectedShiftFilter,
    selectedStatusFilter,
    selectedCadastralFilter,
    selectedSpecialFilter,
    selectedZoneFilter,
    selectedGenderFilter,
  ]);

  // Paginação da listagem de alunos
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedUnitFilter,
    selectedSeriesFilter,
    selectedClassFilter,
    selectedShiftFilter,
    selectedStatusFilter,
    selectedCadastralFilter,
    selectedSpecialFilter,
    selectedZoneFilter,
    selectedGenderFilter,
  ]);

  const deferredFilteredStudents = React.useDeferredValue(filteredStudents);
  const totalPages = Math.ceil(deferredFilteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return deferredFilteredStudents.slice(start, start + itemsPerPage);
  }, [deferredFilteredStudents, currentPage, itemsPerPage]);
  const deferredPaginatedStudents = React.useDeferredValue(paginatedStudents);

  // Colunas do Painel de Impressão Configurável de Estudantes
  const studentPrintColumns: PrintColumnConfig[] = useMemo(
    () => [
      { id: 'index', label: 'Nº', align: 'center', width: '38px', defaultVisible: true },
      { id: 'enrollmentNumber', label: 'Matrícula (RA)', align: 'center', width: '90px', defaultVisible: true },
      { id: 'name', label: 'Nome Completo do Estudante', align: 'left', defaultVisible: true },
      { id: 'series', label: 'Série', align: 'center', width: '80px', defaultVisible: true },
      { id: 'className', label: 'Turma', align: 'center', width: '80px', defaultVisible: true },
      { id: 'shift', label: 'Turno', align: 'center', width: '70px', defaultVisible: false },
      { id: 'birthDate', label: 'Data Nasc.', align: 'center', width: '80px', defaultVisible: true },
      { id: 'gender', label: 'Sexo', align: 'center', width: '50px', defaultVisible: false },
      { id: 'race', label: 'Raça/Cor', align: 'center', width: '75px', defaultVisible: false },
      { id: 'cpf', label: 'CPF', align: 'center', width: '105px', defaultVisible: false },
      { id: 'cadastralStatus', label: 'Situação Cadastral', align: 'center', width: '90px', defaultVisible: true },
      { id: 'specialNeeds', label: 'PCD / Condição', align: 'left', width: '90px', defaultVisible: false },
      { id: 'medicalReport', label: 'Laudo', align: 'center', width: '50px', defaultVisible: false },
      { id: 'schoolOrigin', label: 'Escola / Polo', align: 'left', width: '110px', defaultVisible: false },
      { id: 'guardian', label: 'Responsável', align: 'left', width: '110px', defaultVisible: false },
      { id: 'signature', label: 'Assinatura / Rubrica', align: 'center', width: '130px', defaultVisible: true },
    ],
    []
  );

  // Filtros aplicados visíveis no cabeçalho da impressão configurável
  const printAppliedFilters: AppliedFilterItem[] = useMemo(() => {
    const list: AppliedFilterItem[] = [];

    // Unidade Escolar
    if (selectedUnitFilter !== 'ALL') {
      const u = availableSchoolUnits.find((item) => item.id === selectedUnitFilter);
      list.push({ label: 'Unidade Escolar', value: u?.name || selectedUnitFilter });
    } else {
      list.push({ label: 'Unidade Escolar', value: 'Todas as Unidades' });
    }

    // Série / Etapa
    if (selectedSeriesFilter !== 'ALL') {
      list.push({ label: 'Série / Etapa', value: selectedSeriesFilter });
    } else {
      list.push({ label: 'Série / Etapa', value: 'Todas as Séries' });
    }

    // Turma
    if (selectedClassFilter !== 'ALL') {
      list.push({ label: 'Turma', value: classMap.get(selectedClassFilter) || selectedClassFilter });
    } else {
      list.push({ label: 'Turma', value: 'Todas as Turmas' });
    }

    // Turno
    if (selectedShiftFilter !== 'ALL') {
      list.push({ label: 'Turno', value: selectedShiftFilter });
    }

    // Situação Cadastral
    if (selectedCadastralFilter !== 'ALL') {
      const cadLabel =
        selectedCadastralFilter === 'OK'
          ? 'Cadastro Regular'
          : selectedCadastralFilter === 'INCOMPLETE'
          ? 'Cadastro Incompleto'
          : selectedCadastralFilter === 'PENDING_DOCS'
          ? 'Pendência de Documentos'
          : selectedCadastralFilter;
      list.push({ label: 'Situação Cadastral', value: cadLabel });
    }

    // Status da Matrícula
    if (selectedStatusFilter !== 'ALL') {
      list.push({ label: 'Status da Matrícula', value: selectedStatusFilter });
    }

    // Inclusão & Laudo
    if (selectedSpecialFilter !== 'ALL') {
      const specLabel =
        selectedSpecialFilter === 'WITH_REPORT'
          ? 'Apenas com Laudo Médico'
          : selectedSpecialFilter === 'WITH_AEE'
          ? 'Atendimento Especializado (AEE)'
          : 'Sem Laudo / Regular';
      list.push({ label: 'Inclusão / PCD', value: specLabel });
    }

    // Zona de Residência
    if (selectedZoneFilter !== 'ALL') {
      list.push({
        label: 'Zona de Residência',
        value: selectedZoneFilter === 'ZONA_RURAL' ? 'Zona Rural' : 'Zona Urbana',
      });
    }

    // Termo de Busca
    if (searchTerm.trim()) {
      list.push({ label: 'Termo de Busca', value: `"${searchTerm.trim()}"` });
    }

    return list;
  }, [
    selectedUnitFilter,
    selectedSeriesFilter,
    selectedClassFilter,
    selectedShiftFilter,
    selectedCadastralFilter,
    selectedStatusFilter,
    selectedSpecialFilter,
    selectedZoneFilter,
    searchTerm,
    classMap,
    availableSchoolUnits,
  ]);

  // Resumo de métricas impresso no topo
  const printSummaryMetrics: SummaryMetricItem[] = useMemo(() => {
    return [
      { label: 'Total de Estudantes', value: filteredStudents.length, color: 'text-slate-900' },
      {
        label: 'Matrículas Ativas',
        value: filteredStudents.filter((s) => s.status === 'ACTIVE').length,
        color: 'text-indigo-600',
      },
      {
        label: 'Cadastros com Pendências',
        value: filteredStudents.filter((s) => s.cadastralStatus !== 'OK').length,
        color: 'text-amber-600',
      },
      {
        label: 'Com Laudo / PCD',
        value: filteredStudents.filter((s) => s.hasMedicalReport || s.specialNeeds).length,
        color: 'text-purple-600',
      },
    ];
  }, [filteredStudents]);

  // Renderização customizada de cada célula da tabela de impressão
  const renderPrintStudentCell = (student: Student, colId: string, idx: number) => {
    switch (colId) {
      case 'index':
        return String(idx + 1);
      case 'enrollmentNumber':
        return student.enrollmentNumber;
      case 'name':
        return student.name;
      case 'series':
        return student.series || '—';
      case 'className':
        return classMap.get(student.classId) || student.classId;
      case 'shift':
        return student.shift || 'Manhã';
      case 'birthDate':
        return student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : '—';
      case 'gender':
        return student.gender === 'M' ? 'M' : student.gender === 'F' ? 'F' : 'Outro';
      case 'race':
        return student.raceColor || (student as any).colorRace || '—';
      case 'cpf':
        return student.cpf || 'Não informado';
      case 'cadastralStatus':
        return student.cadastralStatus === 'OK' ? 'Regular' : 'Incompleto';
      case 'specialNeeds':
        return Array.isArray(student.specialNeeds) ? student.specialNeeds.join(', ') : (student.specialNeeds || 'Nenhum');
      case 'medicalReport':
        return student.hasMedicalReport ? 'SIM' : 'NÃO';
      case 'schoolOrigin':
        return student.schoolOriginName || 'Sede';
      case 'guardian':
        return student.guardianName || '—';
      case 'signature':
        return <div className="h-4 border-b border-slate-400 w-full" />;
      default:
        return '';
    }
  };

  const handleOpenAddModal = (presetUnit?: SchoolUnit) => {
    const targetUnit = presetUnit || activeSelectedSchoolUnit;
    if (targetUnit) {
      setStudentToEdit({
        id: `std-new-${Date.now()}`,
        name: '',
        enrollmentNumber: `RA-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'ACTIVE',
        schoolUnitId: targetUnit.id,
        schoolOriginName: targetUnit.name,
        locationZone: targetUnit.locationZone,
        cadastralStatus: 'OK',
      } as any);
    } else {
      setStudentToEdit(null);
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Matrícula RA',
      'Nome do Aluno',
      'CPF',
      'Turma',
      'Situação Cadastral',
      'Status da Matrícula',
      'Motivo da Evasão (se evadido)',
      'Status Busca Ativa',
      'Email',
      'Telefone',
      'Responsável Legal',
    ];
    const rows = filteredStudents.map((s) => [
      s.enrollmentNumber,
      `"${s.name}"`,
      s.cpf,
      `"${classMap.get(s.classId) || s.classId}"`,
      `"${CADASTRAL_STATUS_INFO[s.cadastralStatus || 'OK']?.label || 'OK'}"`,
      s.status,
      `"${s.dropoutReason ? DROPOUT_REASON_INFO[s.dropoutReason]?.label : ''}"`,
      `"${s.dropoutIntervention?.searchStatus || ''}"`,
      s.email,
      s.phone,
      `"${s.guardianName || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relacao_alunos_matriculados_censo_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    try {
      let imported: Student[] = [];
      const trimmed = importText.trim();
      if (!trimmed) {
        setImportFeedback('Insira dados em formato CSV, JSON ou texto de lista.');
        return;
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        imported = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        const defaultClassId = classes[0]?.id || 'TURMA-3A';

        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('nome')) return;
          const parts = line.includes(';') ? line.split(';') : line.split(',');
          const name = parts[0]?.replace(/"/g, '').trim() || `Aluno Importado ${idx + 1}`;
          const cpf = parts[1]?.replace(/"/g, '').trim() || `000.000.${idx}00-00`;
          const email = parts[2]?.replace(/"/g, '').trim() || `aluno${Date.now().toString().slice(-4)}${idx}@escola.edu.br`;

          imported.push({
            id: `std-imp-${Date.now()}-${idx}`,
            enrollmentNumber: `2026-${Math.floor(1000 + Math.random() * 9000)}`,
            name,
            cpf,
            birthDate: '2008-05-15',
            gender: 'OTHER',
            email,
            phone: '(11) 98765-4321',
            address: 'Endereço cadastrado via importação',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000',
            guardianName: 'Responsável Legal',
            guardianPhone: '(11) 91234-5678',
            courseId: 'course-1',
            classId: defaultClassId,
            status: 'ACTIVE',
            entryDate: new Date().toISOString().split('T')[0],
          });
        });
      }

      if (imported.length > 0) {
        if (onBatchImportStudents) {
          onBatchImportStudents(imported);
        } else {
          imported.forEach((s) => onSaveStudent(s));
        }
        setImportFeedback(`Sucesso! ${imported.length} estudantes importados.`);
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

  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div id="bento-students-root" className="space-y-4">
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
            <span className="font-bold text-slate-800">Secretaria & Alunos</span>
          </div>
        </div>

        {/* Quick Module Navigation Tabs */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onNavigate('STUDENTS')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Alunos ({students.length})</span>
            </button>
            <button
              onClick={() => onNavigate('DROPOUT_CENSUS')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Censo de Evasão Escolar, Diagnóstico de Motivos e Busca Ativa Municipal"
            >
              <UserX className="h-3.5 w-3.5 text-rose-600" />
              <span>Censo de Evasão & Busca Ativa ({students.filter((s) => s.status === 'EVADIDO').length})</span>
            </button>
            <button
              onClick={() => onNavigate('CLASSES')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Turmas & Matrizes</span>
            </button>
            <button
              onClick={() => onNavigate('DOCUMENTS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Award className="h-3.5 w-3.5 text-slate-500" />
              <span>Documentos</span>
            </button>
            <button
              onClick={() => onNavigate('PEDAGOGICAL_DASHBOARD')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Pedagógico</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Banner & Quick Metrics in Bento Layout */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Secretaria Acadêmica & Gestão de Matrículas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de estudantes, enturmação, documentação oficial, censo escolar e acompanhamento da evasão
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('DROPOUT_CENSUS')}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Abrir Censo Municipal de Evasão Escolar & Busca Ativa"
            >
              <UserX className="h-3.5 w-3.5 text-rose-600" />
              <span>Painel do Censo / Evasão</span>
            </button>
          )}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Relatório Estatístico de Matrículas"
          >
            <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Gerar Relatório</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Abrir Painel de Impressão Configurável (escolher colunas, filtros aplicados, cabeçalhos e orientação)"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-600" />
            <span>Painel de Impressão</span>
          </button>
          <button
            id="btn-students-export-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => setIsUniversalImportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Importar múltiplos arquivos (.xlsx, .xls, .csv, .json, .xml, .ods) de turmas e polos remotos (ex: Maria da Praia)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
            <span>Importar Planilhas / Polos</span>
          </button>
          <button
            onClick={() => setShowPendingCensusDashbox((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showPendingCensusDashbox
                ? 'bg-amber-500 text-white border-amber-600'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
            }`}
            title="Exibir ou ocultar Dashbox de Pendências de Dados Cadastrais dos Polos Remotos & Censo"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Pendências Censo ({students.filter((s) => s.cadastralStatus !== 'OK').length})</span>
          </button>
          <button
            onClick={() => setIsPredictiveAlertsModalOpen(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              predictiveResult.totalAlerts > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Radar de Alertas Preditivos: Notificar coordenação quando houver 3 faltas consecutivas ou redução >= 20% no desempenho"
          >
            <ShieldAlert
              className={`h-3.5 w-3.5 ${
                predictiveResult.totalAlerts > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span>Alertas Preditivos ({predictiveResult.totalAlerts})</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Importar estudantes via texto bruto"
          >
            <Upload className="h-3.5 w-3.5 text-slate-600" />
            <span>Texto</span>
          </button>
          <button
            id="btn-students-add-student"
            onClick={() => handleOpenAddModal()}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Nova Matrícula</span>
          </button>
        </div>
      </div>

      {/* Alerta Preditivo Inteligente da Secretaria */}
      {predictiveResult.totalAlerts > 0 && (
        <div className="bg-linear-to-r from-amber-50 via-rose-50 to-indigo-50 border border-amber-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800">
                  Radar Preditivo da Secretaria: {predictiveResult.totalAlerts} Estudante(s) em Alerta Crítico
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Ação Preventiva
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {predictiveResult.consecutiveAbsencesCount > 0 && `${predictiveResult.consecutiveAbsencesCount} com 3+ faltas consecutivas. `}
                {predictiveResult.performanceDropCount > 0 && `${predictiveResult.performanceDropCount} com redução ≥ 20% no desempenho acadêmico. `}
                {predictiveResult.pendingCoordinationCount > 0
                  ? `${predictiveResult.pendingCoordinationCount} pendente(s) de notificação automática à Coordenação.`
                  : 'Todas as notificações foram despachadas para o mural da Coordenação.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPredictiveAlertsModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-200" />
            <span>Ver Alertas & Notificar Coordenação</span>
          </button>
        </div>
      )}

      {/* Bento Metric Cards (4 columns) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Total de Alunos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{students.length}</span>
            <span className="text-emerald-500 text-xs font-medium">100% Censo Escolar</span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Matrículas Ativas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">
              {students.filter((s) => s.status === 'ACTIVE').length}
            </span>
            <span className="text-slate-500 text-xs font-medium">Em frequência</span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Evasão & Busca Ativa</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">
              {students.filter((s) => s.status === 'EVADIDO').length}
            </span>
            <span className="text-rose-500 text-xs font-semibold">
              {((students.filter((s) => s.status === 'EVADIDO').length / (students.length || 1)) * 100).toFixed(1)}% Evasão
            </span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Situação Cadastral</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-700">
              {students.filter((s) => !s.cadastralStatus || s.cadastralStatus === 'OK').length} Cadastros OK
            </span>
          </div>
        </div>
      </div>

      {/* Dashbox de Pendências de Dados Cadastrais dos Polos Remotos & Censo */}
      {showPendingCensusDashbox && (
        <CadastralPendingCensusDashbox
          students={students}
          schoolUnits={schoolUnits}
          classes={classes}
          onEditStudent={(s) => {
            setQuickEditStudent(s);
          }}
          onOpenImportModal={() => setIsUniversalImportModalOpen(true)}
        />
      )}

      {/* Advanced Filter, Search, and School Management Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Linha Principal: Busca + Unidade Escolar + Série + Turma + Botão Mais Filtros */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por aluno, RA, CPF, responsável, série ou escola..."
              className="w-full pl-9.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grupo de Filtros Centrais: Unidade Escolar + Série + Turma */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* 1. Filtro de Unidade Escolar / Polo com Ação Rápida de Edição */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-auto">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className={`w-full sm:w-auto pl-8 pr-7 py-2 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                    selectedUnitFilter !== 'ALL'
                      ? 'border-indigo-400 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                  title="Filtrar por Unidade Escolar ou Polo"
                >
                  <option value="ALL">🏫 Todas as Unidades ({students.length})</option>
                  {availableSchoolUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.count})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUnitFilter !== 'ALL' && activeSelectedSchoolUnit && (
                <button
                  type="button"
                  onClick={handleOpenEditSchoolUnit}
                  className="px-2.5 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Editar dados cadastrais desta unidade escolar (INEP, Direção, Endereço, Contato)"
                >
                  <Edit2 className="h-3.5 w-3.5 text-indigo-700" />
                  <span className="hidden xl:inline">Editar Escola</span>
                </button>
              )}
            </div>

            {/* 2. Filtro de Série / Etapa */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-violet-600">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <select
                value={selectedSeriesFilter}
                onChange={(e) => setSelectedSeriesFilter(e.target.value)}
                className={`w-full sm:w-auto pl-8 pr-7 py-2 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                  selectedSeriesFilter !== 'ALL'
                    ? 'border-violet-400 bg-violet-50/70 text-violet-900 ring-2 ring-violet-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                title="Filtrar por Série ou Etapa"
              >
                <option value="ALL">🎓 Todas as Séries</option>
                {availableSeries.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filtro de Turma */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                <Users className="h-3.5 w-3.5" />
              </div>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className={`w-full sm:w-auto pl-8 pr-7 py-2 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                  selectedClassFilter !== 'ALL'
                    ? 'border-emerald-400 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                title="Filtrar por Turma"
              >
                <option value="ALL">👥 Todas as Turmas</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.studentCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Expansão: Mais Filtros */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilterDrawer((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                showAdvancedFilterDrawer || activeFiltersCount > 0
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Mais Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-white text-indigo-700 font-extrabold text-[10px] rounded-full shadow-2xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Botão Limpar Filtros quando ativo */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Limpar todos os filtros e busca"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Painel Retrátil de Mais Filtros Importantes */}
        {showAdvancedFilterDrawer && (
          <div className="pt-3 pb-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* 1. Turno Escolar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                Turno
              </label>
              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Turnos</option>
                <option value="MANHÃ">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="INTEGRAL">Integral</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>

            {/* 2. Situação Cadastral (Censo) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-slate-400" />
                Situação Censo
              </label>
              <select
                value={selectedCadastralFilter}
                onChange={(e) => setSelectedCadastralFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todas as Situações</option>
                <option value="OK">Cadastro OK / Regular</option>
                <option value="PENDING_DOCS">Pendência de Documentos</option>
                <option value="INCOMPLETE">Cadastro Incompleto</option>
                <option value="NEEDS_UPDATE">Necessita Atualização</option>
              </select>
            </div>

            {/* 3. Status da Matrícula */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-slate-400" />
                Status Matrícula
              </label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativo / Regular</option>
                <option value="EVADIDO">Evadido (Busca Ativa)</option>
                <option value="TRANSFERRED">Transferido</option>
                <option value="CONCLUDED">Concluído</option>
                <option value="SUSPENDED">Trancado / Suspenso</option>
              </select>
            </div>

            {/* 4. Inclusão & Saúde (Laudo / PCD / AEE) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Stethoscope className="h-3 w-3 text-slate-400" />
                Inclusão & PCD
              </label>
              <select
                value={selectedSpecialFilter}
                onChange={(e) => setSelectedSpecialFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Perfis</option>
                <option value="WITH_REPORT">Com Laudo Médico / PCD</option>
                <option value="WITH_AEE">Com Atendimento AEE</option>
                <option value="NO_SPECIAL">Sem Laudo / Regular</option>
              </select>
            </div>

            {/* 5. Zona de Residência */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                Zona Residencial
              </label>
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todas as Zonas</option>
                <option value="ZONA_URBANA">Zona Urbana</option>
                <option value="ZONA_RURAL">Zona Rural</option>
              </select>
            </div>

            {/* 6. Sexo / Gênero */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="h-3 w-3 text-slate-400" />
                Gênero / Sexo
              </label>
              <select
                value={selectedGenderFilter}
                onChange={(e) => setSelectedGenderFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Gêneros</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OTHER">Outro / Não Declarado</option>
              </select>
            </div>
          </div>
        )}

        {/* Linha de Atalhos Rápidos (Chips Rápidos de 1 Clique) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Atalhos:
          </span>

          <button
            type="button"
            onClick={() => {
              resetAllFilters();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              activeFiltersCount === 0
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({students.length})
          </button>

          {/* Atalho Sede Central */}
          {availableSchoolUnits.find((u) => u.type === 'SEDE_CENTRAL') && (
            <button
              type="button"
              onClick={() => {
                const sede = availableSchoolUnits.find((u) => u.type === 'SEDE_CENTRAL');
                if (sede) {
                  setSelectedUnitFilter(selectedUnitFilter === sede.id ? 'ALL' : sede.id);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                availableSchoolUnits.find((u) => u.type === 'SEDE_CENTRAL')?.id === selectedUnitFilter
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Sede Central</span>
            </button>
          )}

          {/* Atalho Polo Remoto (Maria da Praia, etc) */}
          {availableSchoolUnits.find((u) => u.type === 'POLO_REMOTO' || u.name.toLowerCase().includes('praia')) && (
            <button
              type="button"
              onClick={() => {
                const polo = availableSchoolUnits.find(
                  (u) => u.type === 'POLO_REMOTO' || u.name.toLowerCase().includes('praia')
                );
                if (polo) {
                  setSelectedUnitFilter(selectedUnitFilter === polo.id ? 'ALL' : polo.id);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                availableSchoolUnits.find(
                  (u) => u.type === 'POLO_REMOTO' || u.name.toLowerCase().includes('praia')
                )?.id === selectedUnitFilter
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100'
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Polos Remotos / Praia</span>
            </button>
          )}

          {/* Atalho Pendências Censo */}
          <button
            type="button"
            onClick={() => {
              setSelectedCadastralFilter(selectedCadastralFilter === 'PENDING_DOCS' ? 'ALL' : 'PENDING_DOCS');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
              selectedCadastralFilter === 'PENDING_DOCS'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Pendências Censo ({students.filter((s) => s.cadastralStatus === 'PENDING_DOCS').length})</span>
          </button>

          {/* Atalho Com Laudo / PCD */}
          <button
            type="button"
            onClick={() => {
              setSelectedSpecialFilter(selectedSpecialFilter === 'WITH_REPORT' ? 'ALL' : 'WITH_REPORT');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
              selectedSpecialFilter === 'WITH_REPORT'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100'
            }`}
          >
            <Stethoscope className="h-3 w-3" />
            <span>Com Laudo / PCD ({students.filter((s) => s.hasMedicalReport).length})</span>
          </button>

          {/* Atalho Evasão / Busca Ativa */}
          <button
            type="button"
            onClick={() => {
              setSelectedStatusFilter(selectedStatusFilter === 'EVADIDO' ? 'ALL' : 'EVADIDO');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
              selectedStatusFilter === 'EVADIDO'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <UserX className="h-3 w-3" />
            <span>Evadidos ({students.filter((s) => s.status === 'EVADIDO').length})</span>
          </button>

          {/* Atalho Zona Rural */}
          <button
            type="button"
            onClick={() => {
              setSelectedZoneFilter(selectedZoneFilter === 'ZONA_RURAL' ? 'ALL' : 'ZONA_RURAL');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
              selectedZoneFilter === 'ZONA_RURAL'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <MapPin className="h-3 w-3" />
            <span>Zona Rural ({students.filter((s) => s.locationZone === 'ZONA_RURAL').length})</span>
          </button>
        </div>

        {/* Resumo e Tags de Filtros Ativos */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700">
              Exibindo <strong>{filteredStudents.length}</strong> de <strong>{students.length}</strong> estudantes
            </span>

            {/* Badges de filtros ativos para remoção com 1 clique */}
            {selectedUnitFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded-md text-[11px] border border-indigo-200">
                Unidade: {availableSchoolUnits.find((u) => u.id === selectedUnitFilter)?.name || selectedUnitFilter}
                <button type="button" onClick={() => setSelectedUnitFilter('ALL')} className="hover:text-indigo-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedSeriesFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 font-medium rounded-md text-[11px] border border-violet-200">
                Série: {selectedSeriesFilter}
                <button type="button" onClick={() => setSelectedSeriesFilter('ALL')} className="hover:text-violet-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedClassFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium rounded-md text-[11px] border border-emerald-200">
                Turma: {classMap.get(selectedClassFilter) || selectedClassFilter}
                <button type="button" onClick={() => setSelectedClassFilter('ALL')} className="hover:text-emerald-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedShiftFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md text-[11px] border border-slate-200">
                Turno: {selectedShiftFilter}
                <button type="button" onClick={() => setSelectedShiftFilter('ALL')} className="hover:text-slate-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCadastralFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 font-medium rounded-md text-[11px] border border-amber-200">
                Censo: {selectedCadastralFilter}
                <button type="button" onClick={() => setSelectedCadastralFilter('ALL')} className="hover:text-amber-950">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedStatusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 font-medium rounded-md text-[11px] border border-rose-200">
                Status: {selectedStatusFilter}
                <button type="button" onClick={() => setSelectedStatusFilter('ALL')} className="hover:text-rose-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedSpecialFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 font-medium rounded-md text-[11px] border border-purple-200">
                {selectedSpecialFilter === 'WITH_REPORT' ? 'Com Laudo' : selectedSpecialFilter}
                <button type="button" onClick={() => setSelectedSpecialFilter('ALL')} className="hover:text-purple-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedZoneFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md text-[11px] border border-slate-200">
                {selectedZoneFilter === 'ZONA_RURAL' ? 'Zona Rural' : 'Zona Urbana'}
                <button type="button" onClick={() => setSelectedZoneFilter('ALL')} className="hover:text-slate-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Printer className="h-3 w-3" />
              <span>Imprimir lista filtrada</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast de Atualização de Unidade Escolar */}
      {schoolUnitActionToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-2xl text-xs font-bold shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{schoolUnitActionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSchoolUnitActionToast(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Painel Aperfeiçoado de Gestão & Dados da Unidade Escolar Selecionada */}
      {selectedUnitFilter !== 'ALL' && activeSelectedSchoolUnit && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Cabeçalho da Escola com Identificação, Tipo, INEP e Ações */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
                <School className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {activeSelectedSchoolUnit.name}
                  </h3>
                  {activeSelectedSchoolUnit.tradeName && activeSelectedSchoolUnit.tradeName !== activeSelectedSchoolUnit.name && (
                    <span className="text-xs text-slate-500 font-medium">
                      ({activeSelectedSchoolUnit.tradeName})
                    </span>
                  )}
                  {/* Badge de Tipo */}
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-lg border border-indigo-200">
                    {activeSelectedSchoolUnit.type === 'SEDE_CENTRAL'
                      ? 'Sede Central'
                      : activeSelectedSchoolUnit.type === 'ESCOLA_POLO'
                      ? 'Escola Polo'
                      : activeSelectedSchoolUnit.type === 'ESCOLA_RURAL'
                      ? 'Escola Rural'
                      : activeSelectedSchoolUnit.type === 'CRECHE_INFANTIL'
                      ? 'Creche Infantil'
                      : 'Escola Satélite / Anexa'}
                  </span>
                  {/* Badge de Zona */}
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border ${
                    activeSelectedSchoolUnit.locationZone === 'ZONA_RURAL'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {activeSelectedSchoolUnit.locationZone === 'ZONA_RURAL' ? 'Zona Rural' : 'Zona Urbana'}
                  </span>
                  {/* Badge de Situação Cadastral da Escola */}
                  {activeSelectedSchoolUnit.cadastralStatus === 'INCOMPLETE' ||
                  !activeSelectedSchoolUnit.inepCode ||
                  activeSelectedSchoolUnit.inepCode.toLowerCase().includes('pendente') ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold rounded-lg">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      Pendente de Regularização no Censo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-extrabold rounded-lg">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Regularizada
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                  <span className="font-semibold text-indigo-950 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-indigo-500" />
                    INEP: <strong className="font-mono text-slate-800">{activeSelectedSchoolUnit.inepCode || 'Não cadastrado'}</strong>
                  </span>
                  {activeSelectedSchoolUnit.cnpjOrDecree && (
                    <span className="text-slate-500">
                      • Ato/Decreto: {activeSelectedSchoolUnit.cnpjOrDecree}
                    </span>
                  )}
                  {activeSelectedSchoolUnit.district && (
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {activeSelectedSchoolUnit.district}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Grupo de Botões de Ação Direta na Escola */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <button
                type="button"
                onClick={handleOpenEditSchoolUnit}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Editar dados cadastrais, endereço, direção e infraestrutura desta escola"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Editar Dados da Escola</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal(activeSelectedSchoolUnit)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Matricular novo estudante diretamente nesta unidade escolar"
              >
                <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                <span>Nova Matrícula</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Imprimir listagem oficial de alunos desta unidade escolar"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUnitFilter('ALL')}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Fechar visão por escola e voltar para todas as unidades"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grade de Informações Cadastrais & Contatos da Escola */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Endereço */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3 text-indigo-500" />
                Localização & Endereço
              </span>
              <p className="font-semibold text-slate-800 leading-snug line-clamp-2">
                {activeSelectedSchoolUnit.address || 'Endereço aguardando preenchimento'}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {activeSelectedSchoolUnit.city || 'São Paulo'} - {activeSelectedSchoolUnit.state || 'SP'}
                {activeSelectedSchoolUnit.zipCode ? ` • CEP: ${activeSelectedSchoolUnit.zipCode}` : ''}
              </span>
            </div>

            {/* Diretoria e Gestão */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Users className="h-3 w-3 text-indigo-500" />
                Diretoria & Coordenação
              </span>
              <p className="font-semibold text-slate-800 leading-snug truncate">
                {activeSelectedSchoolUnit.directorName || 'Diretor(a) não informado'}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                Coord.: {activeSelectedSchoolUnit.coordinatorName || 'Não atribuída'}
              </span>
            </div>

            {/* Contato Institucional */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Phone className="h-3 w-3 text-indigo-500" />
                Contato Oficial
              </span>
              <p className="font-semibold text-slate-800 leading-snug flex items-center gap-1 truncate">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                {activeSelectedSchoolUnit.phone || '(00) Pendente'}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                {activeSelectedSchoolUnit.email || 'Não informado'}
              </span>
            </div>

            {/* Séries & Etapas Atendidas */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <GraduationCap className="h-3 w-3 text-indigo-500" />
                Séries / Etapas Atendidas
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeSelectedSchoolUnit.gradesServed && activeSelectedSchoolUnit.gradesServed.length > 0 ? (
                  activeSelectedSchoolUnit.gradesServed.map((g, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-indigo-50 text-indigo-800 font-bold text-[10px] rounded-md border border-indigo-100"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-[11px] italic">
                    {activeSelectedSchoolUnit.gradesServedText || 'Séries conforme matrículas'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cards de Métricas Rápidas desta Escola + Botão de Filtro de Pendências */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Alunos</span>
                <span className="text-base font-extrabold text-slate-900">{studentsInSelectedUnit.length}</span>
              </div>
              <Users className="h-5 w-5 text-indigo-400" />
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ativos / Regular</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {studentsInSelectedUnit.filter((s) => s.status === 'ACTIVE').length}
                </span>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>

            {/* Alunos com Pendências Cadastrais nesta Escola (com Ação de 1 Clique) */}
            <button
              type="button"
              onClick={() => {
                setSelectedCadastralFilter(selectedCadastralFilter === 'INCOMPLETE' ? 'ALL' : 'INCOMPLETE');
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                selectedCadastralFilter === 'INCOMPLETE'
                  ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400'
                  : 'bg-white/80 hover:bg-amber-50/60 border-amber-200'
              }`}
              title="Clique para filtrar apenas os alunos desta escola com pendências cadastrais"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Pendências Cadastrais</span>
                <span className="text-base font-extrabold text-amber-700">
                  {studentsInSelectedUnit.filter((s) => s.cadastralStatus && s.cadastralStatus !== 'OK').length} alunos
                </span>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </button>

            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PCD / Laudo Médico</span>
                <span className="text-base font-extrabold text-purple-600">
                  {studentsInSelectedUnit.filter((s) => s.hasMedicalReport || s.specialNeeds).length}
                </span>
              </div>
              <Stethoscope className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Student Records Table in Bento Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Estudante</th>
                <th className="py-2.5 px-3">Matrícula (RA)</th>
                <th className="py-2.5 px-3">CPF</th>
                <th className="py-2.5 px-3">Turma</th>
                <th className="py-2.5 px-3">Contato & Responsável</th>
                <th className="py-2.5 px-3 text-center">Situação Cadastral</th>
                <th className="py-2.5 px-3 text-center">Status / Motivo</th>
                <th className="py-2.5 px-4 text-right">Documentos & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deferredPaginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Nenhum estudante encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                deferredPaginatedStudents.map((student) => {
                  const className = classMap.get(student.classId) || 'Turma não atribuída';
                  const cadastralInfo = CADASTRAL_STATUS_INFO[student.cadastralStatus || 'OK'];
                  const reasonInfo = student.dropoutReason ? DROPOUT_REASON_INFO[student.dropoutReason] : null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Identity */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              referrerPolicy="no-referrer"
                              className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0 flex items-center justify-center text-[11px] font-bold"
                            >
                              {(student.name || '?').trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{student.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Nascimento:{' '}
                              {student.birthDate ? new Date(student.birthDate + (student.birthDate.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR') : '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* RA */}
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {student.enrollmentNumber}
                      </td>

                      {/* CPF */}
                      <td className="py-2.5 px-3 font-mono text-slate-600">{student.cpf}</td>

                      {/* Class */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700 block">{className}</span>
                        <span className="text-[10px] text-slate-400">
                          Ano Letivo {student.enrollmentYear}
                        </span>
                      </td>

                      {/* Contact & Guardian */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <p className="truncate text-slate-800 font-medium">{student.guardianName || 'Não informado'}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {student.phone || student.guardianPhone || 'S/N'}
                        </p>
                      </td>

                      {/* Situação Cadastral */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (student.cadastralStatus !== 'OK') {
                              setQuickEditStudent(student);
                            } else {
                              handleOpenEditModal(student);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:shadow-2xs ${cadastralInfo.bg} ${cadastralInfo.color} ${cadastralInfo.border}`}
                          title={`${cadastralInfo.desc} (Clique para editar/completar)`}
                        >
                          {student.cadastralStatus === 'OK' || !student.cadastralStatus ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <AlertCircle className="h-2.5 w-2.5" />
                          )}
                          <span>{cadastralInfo.label}</span>
                        </button>
                      </td>

                      {/* Status & Motivo de Evasão */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              student.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : student.status === 'EVADIDO'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-black'
                                : student.status === 'CONCLUDED'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {student.status === 'ACTIVE'
                              ? 'Ativo'
                              : student.status === 'EVADIDO'
                              ? 'Evadido'
                              : student.status === 'CONCLUDED'
                              ? 'Concluído'
                              : 'Transferido'}
                          </span>

                          {student.status === 'EVADIDO' && reasonInfo && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${reasonInfo.bg} ${reasonInfo.color} ${reasonInfo.border} truncate max-w-[130px]`}
                              title={`${reasonInfo.mecCode}: ${reasonInfo.label}`}
                            >
                              {reasonInfo.shortLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {student.cadastralStatus !== 'OK' && (
                            <button
                              onClick={() => setQuickEditStudent(student)}
                              title="Completar dados e pendências deste cadastro para o Censo"
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs mr-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Completar</span>
                            </button>
                          )}

                          {student.status === 'EVADIDO' && onNavigate && (
                            <button
                              onClick={() => onNavigate('DROPOUT_CENSUS')}
                              title="Ver no Censo & Gerenciar Busca Ativa"
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDocAction(student.id, 'CERTIFICADO_CONCLUSAO')}
                            title="Emitir Certificado Oficial de Conclusão"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Award className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDocAction(student.id, 'HISTORICO_ESCOLAR')}
                            title="Emitir Histórico Escolar Completo"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(student)}
                            title="Editar Matrícula e Situação Cadastral"
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={async () => {
                              if (
                                await confirmDialog(
                                  `Deseja realmente remover a matrícula de ${student.name}?`
                                )
                              ) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            title="Remover Matrícula"
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>
            Mostrando <strong>{filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</strong> de{' '}
            <strong>{filteredStudents.length}</strong> estudantes filtrados (Total geral: {students.length})
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={10}>10 / pág</option>
            <option value={15}>15 / pág</option>
            <option value={25}>25 / pág</option>
            <option value={50}>50 / pág</option>
            <option value={100}>100 / pág</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Anterior
          </button>
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pNum = currentPage - 3 + i + 1;
                  if (pNum > totalPages) pNum = totalPages - (4 - i);
                }
              }
              if (pNum < 1 || pNum > totalPages) return null;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pNum
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Relatório de Matrículas Modal */}
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
                    Relatório Oficial de Matrículas e Enturmação
                  </h2>
                  <p className="text-xs text-slate-500">
                    Resumo estatístico da ocupação de vagas e situação acadêmica geral
                  </p>
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
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Geral</span>
                  <p className="text-2xl font-black text-slate-900">{students.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Taxa de Atividade</span>
                  <p className="text-2xl font-black text-emerald-700">
                    {Math.round((activeCount / (students.length || 1)) * 100)}%
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700">Turmas Ativas</span>
                  <p className="text-2xl font-black text-indigo-700">{classes.length}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Distribuição de Estudantes por Turma</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Turma</th>
                        <th className="p-2.5">Turno</th>
                        <th className="p-2.5 text-center">Matriculados</th>
                        <th className="p-2.5 text-center">Capacidade</th>
                        <th className="p-2.5 text-center">Ocupação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classes.map((cls) => {
                        const inClass = students.filter((s) => s.classId === cls.id).length;
                        const pct = Math.round((inClass / (cls.capacity || 35)) * 100);
                        return (
                          <tr key={cls.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">{cls.name}</td>
                            <td className="p-2.5 text-slate-600">{cls.shift}</td>
                            <td className="p-2.5 text-center font-bold text-indigo-600">{inClass}</td>
                            <td className="p-2.5 text-center text-slate-500">{cls.capacity || 35}</td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                  pct > 90
                                    ? 'bg-rose-50 text-rose-700'
                                    : pct > 70
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* PAINEL DE IMPRESSÃO CONFIGURÁVEL (COLUNAS, FILTROS E CABEÇALHOS) */}
      <ConfigurablePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Relação Nominal de Estudantes - Livro de Matrículas 2026"
        subtitle="Diário oficial de frequência, matrículas e controle de turmas da Secretaria de Educação"
        columns={studentPrintColumns}
        data={filteredStudents}
        appliedFilters={printAppliedFilters}
        summaryMetrics={printSummaryMetrics}
        defaultOrientation="landscape"
        renderCell={renderPrintStudentCell}
      />

      {/* Modal de Importação em Lote */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Importação em Lote de Estudantes</h2>
                  <p className="text-xs text-slate-500">Cole linhas no formato CSV (Nome; CPF; Email) ou JSON</p>
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
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="block font-semibold text-slate-700">
                    Dados de Estudantes (uma linha por aluno ou array JSON):
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer transition-colors shadow-2xs">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>📁 Selecionar Arquivo (.csv / .txt / .json)</span>
                    <input
                      type="file"
                      accept=".csv,.txt,.json,.tsv,text/csv,text/plain,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const content = String(ev.target?.result || '');
                            setImportText(content);
                            setImportFeedback(`Arquivo carregado com sucesso: ${file.name}`);
                          };
                          reader.readAsText(file);
                        }
                        (e.target as HTMLInputElement).value = '';
                      }}
                    />
                  </label>
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Exemplo CSV:\nCarlos Eduardo Silva; 123.456.789-00; carlos@escola.com\nMariana Santos Oliveira; 987.654.321-11; mariana@escola.com\n\nOu cole um JSON completo de alunos.`}
                  className="w-full h-44 p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Dica de formato:</p>
                <p>O sistema gera automaticamente o número de matrícula oficial (RA) e enturmação padrão para cada aluno importado.</p>
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
                Processar e Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Add / Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(student) => {
          onSaveStudent(student);
          setIsModalOpen(false);
        }}
        studentToEdit={studentToEdit}
        classes={classes}
        courses={courses}
        schoolUnits={schoolUnits}
        onSaveSchoolUnit={onSaveSchoolUnit}
      />

      {/* Excel (.xlsx) Student Import Modal */}
      <ExcelStudentImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        classes={classes}
        onImportStudents={(imported) => {
          if (onBatchImportStudents) {
            onBatchImportStudents(imported);
          } else {
            imported.forEach((s) => onSaveStudent(s));
          }
        }}
      />

      {/* Universal Multi-Format Data Import Modal (Polos Remotos, .xlsx, .csv, .json, .xml, .ods) */}
      <UniversalDataImportModal
        isOpen={isUniversalImportModalOpen}
        onClose={() => setIsUniversalImportModalOpen(false)}
        classes={classes}
        schoolUnits={schoolUnits}
        studentsCount={students.length}
        existingStudents={students}
        onImportStudents={(imported, explicitUnits, explicitClasses) => {
          if (onBatchImportStudents) {
            onBatchImportStudents(imported, explicitUnits, explicitClasses);
          } else {
            imported.forEach((s) => onSaveStudent(s));
          }
        }}
        onUpdateStudent={onSaveStudent}
        onNavigateToPendencias={() => {
          setShowPendingCensusDashbox(true);
          setSelectedCadastralFilter('INCOMPLETE');
        }}
      />

      {/* Modal Dedicado de Gestão e Edição da Unidade Escolar Selecionada */}
      <SchoolUnitModal
        isOpen={isSchoolUnitModalOpen}
        onClose={() => setIsSchoolUnitModalOpen(false)}
        onSave={handleSaveSchoolUnitModal}
        unitToEdit={schoolUnitToEdit}
      />

      {/* Modal Dedicado de Edição Rápida de Cadastros e Pendências */}
      <StudentQuickEditModal
        isOpen={Boolean(quickEditStudent)}
        onClose={() => setQuickEditStudent(null)}
        student={quickEditStudent}
        classes={classes}
        schoolUnits={schoolUnits}
        onSave={(updated) => {
          onSaveStudent(updated);
          setQuickEditStudent(null);
        }}
      />

      {/* Modal de Alertas Preditivos da Secretaria (3+ faltas ou redução >= 20% no rendimento) */}
      <PredictiveAlertsModal
        isOpen={isPredictiveAlertsModalOpen}
        onClose={() => setIsPredictiveAlertsModalOpen(false)}
        students={students}
        classes={classes}
        schoolUnits={schoolUnits}
        attendanceSheets={attendanceSheets}
        classGradeSheets={classGradeSheets}
        academicHistories={histories}
        notifications={notifications}
        onSaveNotification={onSaveNotification}
        onBatchSaveNotifications={onBatchSaveNotifications}
        onNavigate={onNavigate}
      />
    </div>
  );
};
