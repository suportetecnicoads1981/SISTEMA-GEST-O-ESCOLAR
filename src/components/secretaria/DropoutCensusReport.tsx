import React, { useState, useMemo, useRef } from 'react';
import {
  UserX,
  FileSpreadsheet,
  Filter,
  Search,
  Download,
  Printer,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Calendar,
  Building,
  ShieldAlert,
  Users,
  Eye,
  Edit,
  PlusCircle,
  Clock,
  Sparkles,
  TrendingDown,
  RefreshCw,
  Home,
  Check,
  FileCheck2,
  X,
  FileText,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import { triggerPrint } from '../../utils/printHelper';
import {
  Student,
  SchoolClass,
  SchoolUnit,
  DropoutReasonKey,
  ActiveSearchStatus,
  CadastralStatus,
  DROPOUT_REASON_INFO,
  CADASTRAL_STATUS_INFO,
  ACTIVE_SEARCH_STATUS_INFO,
} from '../../types';
import {
  CustomizableChartModal,
  ChartDatasetOption,
} from '../common/CustomizableChartModal';
import { CustomizableChartCard } from '../common/CustomizableChartCard';

interface DropoutCensusReportProps {
  students: Student[];
  classes: SchoolClass[];
  schoolUnits?: SchoolUnit[];
  onUpdateStudent: (student: Student) => void;
  onBack?: () => void;
  onNavigate?: (tab: string) => void;
}

export const DropoutCensusReport: React.FC<DropoutCensusReportProps> = ({
  students,
  classes,
  schoolUnits = [],
  onUpdateStudent,
  onBack,
  onNavigate,
}) => {
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('ALL');
  const [selectedSearchStatusFilter, setSelectedSearchStatusFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedCadastralFilter, setSelectedCadastralFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');

  // Customizable Chart Modal State
  const [isChartCustomizerOpen, setIsChartCustomizerOpen] = useState<boolean>(false);
  const [chartCustomizerInitialDataset, setChartCustomizerInitialDataset] = useState<string>('dropout_reasons');
  const [chartViewTab, setChartViewTab] = useState<'VISAO_GERAL' | 'TURMAS_GENERO' | 'ZONA_IDADE' | 'TODOS_GRAFICOS'>('VISAO_GERAL');

  // Modal de Acompanhamento / Atualização de Busca Ativa
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState<Student | null>(null);
  const [newContactType, setNewContactType] = useState<'TELEFONE' | 'WHATSAPP' | 'VISITA_DOMICILIAR' | 'CARTA_CONVOCACAO' | 'REUNIAO_SME'>('VISITA_DOMICILIAR');
  const [newContactAgent, setNewContactAgent] = useState('Equipe Multiprofissional SME');
  const censusPrintRef = useRef<HTMLDivElement>(null);
  const [newContactOutcome, setNewContactOutcome] = useState('');
  const [newContactSuccess, setNewContactSuccess] = useState(true);

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  // Lista de todos os estudantes evadidos
  const droppedOutStudents = useMemo(() => {
    return students.filter((s) => s.status === 'EVADIDO');
  }, [students]);

  // Filtragem dos estudantes evadidos
  const filteredDroppedOut = useMemo(() => {
    return droppedOutStudents.filter((student) => {
      // Busca textual
      const matchesSearch =
        searchTerm === '' ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.cpf.includes(searchTerm) ||
        (student.guardianName && student.guardianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.dropoutObservation && student.dropoutObservation.toLowerCase().includes(searchTerm.toLowerCase()));

      // Motivo
      const matchesReason =
        selectedReasonFilter === 'ALL' || student.dropoutReason === selectedReasonFilter;

      // Status da Busca Ativa
      const studentSearchStatus = student.dropoutIntervention?.searchStatus || 'EM_BUSCA_ATIVA';
      const matchesSearchStatus =
        selectedSearchStatusFilter === 'ALL' || studentSearchStatus === selectedSearchStatusFilter;

      // Turma
      const matchesClass =
        selectedClassFilter === 'ALL' || student.classId === selectedClassFilter;

      // Situação Cadastral
      const studentCadastral = student.cadastralStatus || 'OK';
      const matchesCadastral =
        selectedCadastralFilter === 'ALL' || studentCadastral === selectedCadastralFilter;

      // Gênero
      const matchesGender =
        selectedGenderFilter === 'ALL' || student.gender === selectedGenderFilter;

      // Turno
      const cls = classMap.get(student.classId);
      const matchesShift =
        selectedShiftFilter === 'ALL' || (cls && cls.shift === selectedShiftFilter);

      return (
        matchesSearch &&
        matchesReason &&
        matchesSearchStatus &&
        matchesClass &&
        matchesCadastral &&
        matchesGender &&
        matchesShift
      );
    });
  }, [
    droppedOutStudents,
    searchTerm,
    selectedReasonFilter,
    selectedSearchStatusFilter,
    selectedClassFilter,
    selectedCadastralFilter,
    selectedGenderFilter,
    selectedShiftFilter,
    classMap,
  ]);

  // Métricas do Censo Educacional Municipal
  const totalStudentsCount = students.length;
  const totalDroppedOutCount = droppedOutStudents.length;
  const dropoutRate = totalStudentsCount > 0 ? (totalDroppedOutCount / totalStudentsCount) * 100 : 0;

  const inActiveSearchCount = droppedOutStudents.filter(
    (s) => !s.dropoutIntervention || s.dropoutIntervention.searchStatus === 'EM_BUSCA_ATIVA'
  ).length;

  const rescuedCount = droppedOutStudents.filter(
    (s) => s.dropoutIntervention?.searchStatus === 'RESGATADO_REINSERIDO'
  ).length;

  const rescueSuccessRate = totalDroppedOutCount > 0 ? (rescuedCount / totalDroppedOutCount) * 100 : 0;

  const notifiedConselhoCount = droppedOutStudents.filter(
    (s) => s.dropoutIntervention?.conselhoTutelarNotified
  ).length;

  // Estatísticas por Motivo da Evasão
  const statsByReason = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(DROPOUT_REASON_INFO).forEach((key) => {
      counts[key] = 0;
    });

    droppedOutStudents.forEach((s) => {
      const reasonKey = s.dropoutReason || 'OUTROS';
      counts[reasonKey] = (counts[reasonKey] || 0) + 1;
    });

    return counts;
  }, [droppedOutStudents]);

  // Estatísticas por Status de Busca Ativa
  const statsBySearchStatus = useMemo(() => {
    const counts: Record<string, number> = {
      EM_BUSCA_ATIVA: 0,
      RESGATADO_REINSERIDO: 0,
      MUDOU_MUNICIPIO: 0,
      NOTIFICADO_CONSELHO: 0,
      EVASAO_CONFIRMADA: 0,
    };
    droppedOutStudents.forEach((s) => {
      const st = s.dropoutIntervention?.searchStatus || 'EM_BUSCA_ATIVA';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [droppedOutStudents]);

  // Estatísticas de Evasão por Zona (Rural vs Urbana)
  const statsByZone = useMemo(() => {
    let ruralTotal = 0;
    let ruralDropped = 0;
    let urbanTotal = 0;
    let urbanDropped = 0;

    const isRural = (s: Student) => {
      if (s.locationZone) return s.locationZone.includes('RURAL');
      const addr = (s.address || '').toLowerCase() + ' ' + (s.neighborhood || '').toLowerCase();
      return addr.includes('rural') || addr.includes('sitio') || addr.includes('fazenda') || addr.includes('vila') || addr.includes('povoado') || addr.includes('assentamento');
    };

    students.forEach((s) => {
      if (isRural(s)) {
        ruralTotal++;
        if (s.status === 'EVADIDO') ruralDropped++;
      } else {
        urbanTotal++;
        if (s.status === 'EVADIDO') urbanDropped++;
      }
    });

    const ruralRate = ruralTotal > 0 ? (ruralDropped / ruralTotal) * 100 : 0;
    const urbanRate = urbanTotal > 0 ? (urbanDropped / urbanTotal) * 100 : 0;

    return {
      ruralTotal,
      ruralDropped,
      ruralRate: Number(ruralRate.toFixed(1)),
      urbanTotal,
      urbanDropped,
      urbanRate: Number(urbanRate.toFixed(1)),
    };
  }, [students]);

  // Estatísticas de Evasão por Faixa Etária
  const statsByAgeGroup = useMemo(() => {
    const groups = [
      { id: 'INFANTIL_FUND1', label: 'Menores de 11 anos', min: 0, max: 10 },
      { id: 'FUND2', label: '11 a 14 anos (Fund. II)', min: 11, max: 14 },
      { id: 'MEDIO', label: '15 a 17 anos (Ensino Médio)', min: 15, max: 17 },
      { id: 'EJA_ADULTO', label: '18 anos ou mais (EJA)', min: 18, max: 120 },
    ];

    const getAge = (birthDateStr: string): number => {
      if (!birthDateStr) return 12;
      const birth = new Date(birthDateStr);
      if (isNaN(birth.getTime())) return 12;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 0 ? age : 12;
    };

    return groups.map((g) => {
      const inGroupStudents = students.filter((s) => {
        const age = getAge(s.birthDate);
        return age >= g.min && age <= g.max;
      });
      const droppedInGroup = inGroupStudents.filter((s) => s.status === 'EVADIDO').length;
      const totalInGroup = inGroupStudents.length;
      const rate = totalInGroup > 0 ? (droppedInGroup / totalInGroup) * 100 : 0;

      return {
        id: g.id,
        name: g.label,
        total: totalInGroup,
        value: droppedInGroup,
        secondaryValue: Number(rate.toFixed(1)),
      };
    });
  }, [students]);

  // Datasets para Gráficos Personalizados
  const availableChartDatasets: ChartDatasetOption[] = useMemo(() => {
    return [
      {
        id: 'dropout_reasons',
        title: 'Distribuição dos Motivos da Evasão Escolar (MEC)',
        subtitle: 'Classificação oficial por motivo de desligamento no censo municipal',
        data: Object.entries(DROPOUT_REASON_INFO).map(([key, info]) => {
          const count = statsByReason[key] || 0;
          const percentage = totalDroppedOutCount > 0 ? (count / totalDroppedOutCount) * 100 : 0;
          return {
            name: info.label.length > 25 ? info.label.substring(0, 25) + '...' : info.label,
            value: count,
            secondaryValue: Number(percentage.toFixed(1)),
          };
        }),
        valueLabel: 'Total de Evadidos',
        secondaryValueLabel: 'Proporção (%)',
        unit: 'alunos',
        defaultChartType: 'BAR_HORIZONTAL',
      },
      {
        id: 'search_status',
        title: 'Status & Eficácia da Busca Ativa Municipal',
        subtitle: 'Casos em acompanhamento pelas equipes multiprofissionais da SME',
        data: Object.entries(ACTIVE_SEARCH_STATUS_INFO).map(([key, info]) => {
          const count = statsBySearchStatus[key] || 0;
          const percentage = totalDroppedOutCount > 0 ? (count / totalDroppedOutCount) * 100 : 0;
          return {
            name: info.label,
            value: count,
            secondaryValue: Number(percentage.toFixed(1)),
          };
        }),
        valueLabel: 'Estudantes',
        secondaryValueLabel: 'Taxa (%)',
        unit: 'casos',
        defaultChartType: 'DONUT',
      },
      {
        id: 'dropout_by_zone',
        title: 'Índice de Evasão por Zona de Residência (Rural vs. Urbana)',
        subtitle: 'Comparativo da taxa de abandono escolar entre estudantes da Zona Rural e Zona Urbana',
        data: [
          {
            name: 'Zona Urbana',
            value: statsByZone.urbanDropped,
            secondaryValue: statsByZone.urbanRate,
          },
          {
            name: 'Zona Rural',
            value: statsByZone.ruralDropped,
            secondaryValue: statsByZone.ruralRate,
          },
        ],
        valueLabel: 'Evadidos na Zona',
        secondaryValueLabel: 'Taxa de Evasão (%)',
        unit: 'alunos',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 2.5,
        benchmarkLabel: 'Meta PME (< 2.5%)',
      },
      {
        id: 'dropout_by_age',
        title: 'Índice de Evasão por Faixa Etária dos Alunos',
        subtitle: 'Distribuição e proporção de evasão escolar conforme a idade cronológica do estudante',
        data: statsByAgeGroup.map((ag) => ({
          name: ag.name,
          value: ag.value,
          secondaryValue: ag.secondaryValue,
        })),
        valueLabel: 'Evadidos na Faixa',
        secondaryValueLabel: 'Taxa de Evasão (%)',
        unit: 'alunos',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 2.5,
        benchmarkLabel: 'Meta PME (< 2.5%)',
      },
      {
        id: 'dropout_by_class',
        title: 'Taxa de Evasão Escolar por Turma',
        subtitle: 'Estudantes evadidos distribuídos por turma e segmento',
        data: classes.map((c) => {
          const inClassTotal = students.filter((s) => s.classId === c.id).length;
          const inClassDropped = droppedOutStudents.filter((s) => s.classId === c.id).length;
          const rate = inClassTotal > 0 ? (inClassDropped / inClassTotal) * 100 : 0;
          return {
            name: c.name,
            value: inClassDropped,
            secondaryValue: Number(rate.toFixed(1)),
          };
        }),
        valueLabel: 'Evadidos na Turma',
        secondaryValueLabel: 'Taxa de Evasão (%)',
        unit: 'alunos',
        defaultChartType: 'BAR_VERTICAL',
        benchmarkValue: 2.5,
        benchmarkLabel: 'Meta PME (< 2.5%)',
      },
      {
        id: 'dropout_by_gender',
        title: 'Distribuição da Evasão por Gênero',
        subtitle: 'Comparativo de desligamentos entre alunos do sexo masculino e feminino',
        data: [
          {
            name: 'Masculino',
            value: droppedOutStudents.filter((s) => s.gender === 'MASCULINO').length,
          },
          {
            name: 'Feminino',
            value: droppedOutStudents.filter((s) => s.gender === 'FEMININO').length,
          },
          {
            name: 'Outro / Não Declarado',
            value: droppedOutStudents.filter((s) => s.gender === 'OUTRO').length,
          },
        ],
        valueLabel: 'Total Evadidos',
        unit: 'alunos',
        defaultChartType: 'DONUT',
      },
    ];
  }, [
    statsByReason,
    statsBySearchStatus,
    statsByZone,
    statsByAgeGroup,
    totalDroppedOutCount,
    classes,
    students,
    droppedOutStudents,
  ]);

  // Exportar Relatório do Censo Municipal em CSV
  const handleExportCensusCSV = () => {
    const headers = [
      'Código INEP / Escola',
      'Matrícula RA',
      'Nome do Estudante',
      'CPF',
      'Data Nascimento',
      'Gênero',
      'Turma',
      'Turno',
      'Nome do Responsável',
      'Telefone',
      'Endereço',
      'Situação Cadastral',
      'Data da Evasão',
      'Código MEC Motivo',
      'Motivo da Evasão (Descritivo)',
      'Status da Busca Ativa',
      'Agente Responsável',
      'Conselho Tutelar Notificado',
      'Protocolo Conselho Tutelar',
      'Relato Circunstanciado',
    ];

    const rows = filteredDroppedOut.map((s) => {
      const cls = classMap.get(s.classId);
      const reasonInfo = s.dropoutReason ? DROPOUT_REASON_INFO[s.dropoutReason] : null;
      const interv = s.dropoutIntervention;
      return [
        `"35012345 - EMEF Central Municipal"`,
        `"${s.enrollmentNumber}"`,
        `"${s.name}"`,
        `"${s.cpf}"`,
        `"${s.birthDate}"`,
        `"${s.gender}"`,
        `"${cls?.name || s.classId}"`,
        `"${cls?.shift || ''}"`,
        `"${s.guardianName || ''}"`,
        `"${s.phone || s.guardianPhone || ''}"`,
        `"${s.address || ''}"`,
        `"${CADASTRAL_STATUS_INFO[s.cadastralStatus || 'OK']?.label || 'OK'}"`,
        `"${s.dropoutDate || ''}"`,
        `"${reasonInfo?.mecCode || 'MEC-99'}"`,
        `"${reasonInfo?.label || 'Outros'}"`,
        `"${interv?.searchStatus || 'EM_BUSCA_ATIVA'}"`,
        `"${interv?.responsibleAgent || ''}"`,
        `"${interv?.conselhoTutelarNotified ? 'SIM' : 'NÃO'}"`,
        `"${interv?.conselhoTutelarProtocol || ''}"`,
        `"${(s.dropoutObservation || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `censo_educacao_municipal_evasao_busca_ativa_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Salvar registro de nova intervenção de Busca Ativa
  const handleAddContactAttempt = () => {
    if (!selectedStudentForIntervention) return;
    if (!newContactOutcome.trim()) return;

    const currentInterv = selectedStudentForIntervention.dropoutIntervention || {
      searchStatus: 'EM_BUSCA_ATIVA',
      responsibleAgent: newContactAgent,
      caseOpenedDate: new Date().toISOString().split('T')[0],
      contactAttempts: [],
      conselhoTutelarNotified: false,
      crasNotified: false,
      actionsTaken: '',
    };

    const newAttempt = {
      id: `att-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: newContactType,
      agentName: newContactAgent,
      outcome: newContactOutcome.trim(),
      successful: newContactSuccess,
    };

    const updatedStudent: Student = {
      ...selectedStudentForIntervention,
      dropoutIntervention: {
        ...currentInterv,
        lastContactDate: newAttempt.date,
        contactAttempts: [newAttempt, ...(currentInterv.contactAttempts || [])],
        actionsTaken: `${currentInterv.actionsTaken ? currentInterv.actionsTaken + '\n' : ''}[${newAttempt.date} - ${newContactType}]: ${newAttempt.outcome}`,
      },
    };

    onUpdateStudent(updatedStudent);
    setSelectedStudentForIntervention(updatedStudent);
    setNewContactOutcome('');
  };

  // Alterar status de busca ativa diretamente
  const handleUpdateSearchStatus = (newStatus: ActiveSearchStatus) => {
    if (!selectedStudentForIntervention) return;

    const currentInterv = selectedStudentForIntervention.dropoutIntervention || {
      searchStatus: 'EM_BUSCA_ATIVA',
      responsibleAgent: 'Equipe SME',
      caseOpenedDate: new Date().toISOString().split('T')[0],
      contactAttempts: [],
      conselhoTutelarNotified: false,
      crasNotified: false,
      actionsTaken: '',
    };

    const isReinserted = newStatus === 'RESGATADO_REINSERIDO';

    const updatedStudent: Student = {
      ...selectedStudentForIntervention,
      status: isReinserted ? 'ACTIVE' : 'EVADIDO',
      dropoutIntervention: {
        ...currentInterv,
        searchStatus: newStatus,
        resolutionDate: isReinserted ? new Date().toISOString().split('T')[0] : currentInterv.resolutionDate,
        resolutionNotes: isReinserted
          ? 'Estudante resgatado com sucesso pela Busca Ativa e reinserido na rotina pedagógica escolar.'
          : currentInterv.resolutionNotes,
      },
    };

    onUpdateStudent(updatedStudent);
    setSelectedStudentForIntervention(updatedStudent);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* BARRA DE NAVEGAÇÃO SUPERIOR DO MÓDULO */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (onBack ? onBack() : onNavigate?.('STUDENTS'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer group"
            title="Voltar para a Secretaria Acadêmica"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para Secretaria</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>Secretaria</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span>Censo Educacional</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Evasão Escolar & Busca Ativa</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor Rápido Superior de Turma / Série */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-600 hidden sm:inline">Turma / Série:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              title="Filtrar censo por Turma ou Série específica"
            >
              <option value="ALL">Todas as Turmas / Séries</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.shift || 'Geral'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setChartCustomizerInitialDataset('dropout_reasons');
              setIsChartCustomizerOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Gerar e personalizar gráficos do censo educacional"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Gerar Gráficos</span>
          </button>

          <button
            onClick={() => {
              if (censusPrintRef.current) {
                triggerPrint(censusPrintRef.current, {
                  title: 'Relatório Oficial do Censo Municipal de Evasão Escolar & Busca Ativa 2026',
                  documentCategory: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO - CENSO MEC',
                });
              } else {
                triggerPrint(null, { title: 'Censo Municipal de Evasão Escolar' });
              }
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Imprimir Relatório do Censo Municipal de Evasão"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Imprimir Censo (.PDF)</span>
          </button>

          <button
            onClick={handleExportCensusCSV}
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exportar Planilha Oficial para o Educacenso / INEP"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700" />
            <span>Exportar Censo CSV (Educacenso)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BANNER PRINCIPAL DO CENSO MUNICIPAL DE EVASÃO (E CONTEÚDO IMPRIMÍVEL) */}
      {/* ========================================================================= */}
      <div ref={censusPrintRef} className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>Painel Oficial do Censo da Educação Municipal & Busca Ativa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Diagnóstico de Evasão Escolar & Controle do Censo Municipal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mapeamento nominal de estudantes evadidos, classificação multifatorial de motivos (Padrão MEC/Educacenso), protocolos da Busca Ativa e articulação intersetorial com o Conselho Tutelar e CRAS.
            </p>
          </div>

          {/* Indicadores em Destaque */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase">Taxa de Evasão</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-400">
                {dropoutRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">Meta PME &lt; 2.5%</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase">Total Evadidos</span>
              <span className="text-2xl sm:text-3xl font-black text-white">{totalDroppedOutCount}</span>
              <span className="text-[10px] text-slate-300 block mt-0.5">De {totalStudentsCount} alunos</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase">Em Busca Ativa</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{inActiveSearchCount}</span>
              <span className="text-[10px] text-amber-200 block mt-0.5">Equipe em campo</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase">Resgatados</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{rescuedCount}</span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">
                {rescueSuccessRate.toFixed(0)}% Eficácia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRÁFICOS VISUAIS E ANALÍTICOS CUSTOMIZÁVEIS DO CENSO COM ENQUADRAMENTO */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Painel de Visualização Gráfica do Censo
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setChartViewTab('VISAO_GERAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartViewTab === 'VISAO_GERAL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Motivos & Busca Ativa
            </button>

            <button
              type="button"
              onClick={() => setChartViewTab('TURMAS_GENERO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartViewTab === 'TURMAS_GENERO'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Turmas & Gênero
            </button>

            <button
              type="button"
              onClick={() => setChartViewTab('ZONA_IDADE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartViewTab === 'ZONA_IDADE'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Zona Rural/Urbana & Faixa Etária
            </button>

            <button
              type="button"
              onClick={() => setChartViewTab('TODOS_GRAFICOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartViewTab === 'TODOS_GRAFICOS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos os Gráficos
            </button>
          </div>
        </div>

        {/* Grade de Gráficos */}
        <div className={`grid grid-cols-1 ${chartViewTab === 'TODOS_GRAFICOS' ? 'lg:grid-cols-2' : 'lg:grid-cols-2'} gap-6`}>
          {(chartViewTab === 'VISAO_GERAL' || chartViewTab === 'TODOS_GRAFICOS') && (
            <>
              <div>
                <CustomizableChartCard
                  title="Distribuição dos Motivos da Evasão Escolar (MEC)"
                  subtitle="Classificação oficial por motivo de desligamento no censo municipal"
                  data={Object.entries(DROPOUT_REASON_INFO).map(([key, info]) => {
                    const count = statsByReason[key] || 0;
                    const percentage = totalDroppedOutCount > 0 ? (count / totalDroppedOutCount) * 100 : 0;
                    return {
                      name: info.label.length > 24 ? info.label.substring(0, 24) + '...' : info.label,
                      value: count,
                      secondaryValue: Number(percentage.toFixed(1)),
                    };
                  })}
                  valueLabel="Total de Evadidos"
                  secondaryValueLabel="Proporção (%)"
                  unit="alunos"
                  defaultChartType="BAR_HORIZONTAL"
                  height={320}
                  onOpenFullCustomizer={() => {
                    setChartCustomizerInitialDataset('dropout_reasons');
                    setIsChartCustomizerOpen(true);
                  }}
                />
              </div>

              <div>
                <CustomizableChartCard
                  title="Status & Eficácia da Busca Ativa Municipal"
                  subtitle="Casos em acompanhamento pelas equipes da SME"
                  data={Object.entries(ACTIVE_SEARCH_STATUS_INFO).map(([key, info]) => {
                    const count = statsBySearchStatus[key] || 0;
                    const percentage = totalDroppedOutCount > 0 ? (count / totalDroppedOutCount) * 100 : 0;
                    return {
                      name: info.label,
                      value: count,
                      secondaryValue: Number(percentage.toFixed(1)),
                    };
                  })}
                  valueLabel="Estudantes"
                  secondaryValueLabel="Taxa (%)"
                  unit="casos"
                  defaultChartType="DONUT"
                  height={320}
                  onOpenFullCustomizer={() => {
                    setChartCustomizerInitialDataset('search_status');
                    setIsChartCustomizerOpen(true);
                  }}
                />
              </div>
            </>
          )}

          {(chartViewTab === 'TURMAS_GENERO' || chartViewTab === 'TODOS_GRAFICOS') && (
            <>
              <div>
                <CustomizableChartCard
                  title="Evasão Escolar por Turma & Segmento"
                  subtitle="Estudantes evadidos distribuídos por turma e segmento"
                  data={classes.map((c) => {
                    const inClassTotal = students.filter((s) => s.classId === c.id).length;
                    const inClassDropped = droppedOutStudents.filter((s) => s.classId === c.id).length;
                    const rate = inClassTotal > 0 ? (inClassDropped / inClassTotal) * 100 : 0;
                    return {
                      name: c.name,
                      value: inClassDropped,
                      secondaryValue: Number(rate.toFixed(1)),
                    };
                  })}
                  valueLabel="Evadidos na Turma"
                  secondaryValueLabel="Taxa de Evasão (%)"
                  unit="alunos"
                  defaultChartType="BAR_VERTICAL"
                  benchmarkValue={2.5}
                  benchmarkLabel="Meta PME (< 2.5%)"
                  height={320}
                  onOpenFullCustomizer={() => {
                    setChartCustomizerInitialDataset('dropout_by_class');
                    setIsChartCustomizerOpen(true);
                  }}
                />
              </div>

              <div>
                <CustomizableChartCard
                  title="Distribuição da Evasão por Gênero"
                  subtitle="Comparativo de desligamentos entre alunos do sexo masculino e feminino"
                  data={[
                    {
                      name: 'Masculino',
                      value: droppedOutStudents.filter((s) => s.gender === 'MASCULINO').length,
                    },
                    {
                      name: 'Feminino',
                      value: droppedOutStudents.filter((s) => s.gender === 'FEMININO').length,
                    },
                    {
                      name: 'Outro / Não Declarado',
                      value: droppedOutStudents.filter((s) => s.gender === 'OUTRO').length,
                    },
                  ]}
                  valueLabel="Total Evadidos"
                  unit="alunos"
                  defaultChartType="DONUT"
                  height={320}
                  onOpenFullCustomizer={() => {
                    setChartCustomizerInitialDataset('dropout_by_gender');
                    setIsChartCustomizerOpen(true);
                  }}
                />
              </div>
            </>
          )}

          {(chartViewTab === 'ZONA_IDADE' || chartViewTab === 'TODOS_GRAFICOS') && (
            <>
              <div>
                <CustomizableChartCard
                  title="Índice de Evasão por Zona de Residência"
                  subtitle="Comparativo da taxa de abandono escolar entre Zona Rural e Zona Urbana"
                  data={[
                    {
                      name: `Zona Urbana (${statsByZone.urbanDropped}/${statsByZone.urbanTotal})`,
                      value: statsByZone.urbanDropped,
                      secondaryValue: statsByZone.urbanRate,
                    },
                    {
                      name: `Zona Rural (${statsByZone.ruralDropped}/${statsByZone.ruralTotal})`,
                      value: statsByZone.ruralDropped,
                      secondaryValue: statsByZone.ruralRate,
                    },
                  ]}
                  valueLabel="Total Evadidos"
                  secondaryValueLabel="Taxa de Evasão (%)"
                  unit="alunos"
                  defaultChartType="BAR_VERTICAL"
                  defaultPalette="SUNSET"
                  benchmarkValue={2.5}
                  benchmarkLabel="Meta PME (< 2.5%)"
                  height={320}
                  onOpenFullCustomizer={() => {
                    setChartCustomizerInitialDataset('dropout_by_zone');
                    setIsChartCustomizerOpen(true);
                  }}
                />
              </div>

              <div>
                <CustomizableChartCard
                  title="Índice de Evasão por Faixa Etária dos Alunos"
                  subtitle="Distribuição e proporção de evasão escolar conforme a idade do estudante"
                  data={statsByAgeGroup.map((ag) => ({
                    name: ag.name,
                    value: ag.value,
                    secondaryValue: ag.secondaryValue,
                  }))}
                  valueLabel="Total Evadidos"
                  secondaryValueLabel="Taxa de Evasão (%)"
                  unit="alunos"
                  defaultChartType="BAR_VERTICAL"
                  defaultPalette="TRAFFIC_LIGHT"
                  benchmarkValue={2.5}
                  benchmarkLabel="Meta PME (< 2.5%)"
                  height={320}
                  onOpenFullCustomizer={() => {
                    setChartCustomizerInitialDataset('dropout_by_age');
                    setIsChartCustomizerOpen(true);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DISTRIBUIÇÃO GRÁFICA DOS MOTIVOS DA EVASÃO ESCOLAR (PADRÃO MEC) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              <span>Diagnóstico Censitário: Distribuição dos Motivos da Evasão na Rede Municipal</span>
            </h3>
            <p className="text-xs text-slate-500">
              Categorização obrigatória do Ministério da Educação para orientar políticas públicas de permanência escolar.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full self-start sm:self-auto">
            Ano Censitário: 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Object.entries(DROPOUT_REASON_INFO).map(([key, info]) => {
            const count = statsByReason[key] || 0;
            const percentage = totalDroppedOutCount > 0 ? (count / totalDroppedOutCount) * 100 : 0;
            const isSelected = selectedReasonFilter === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedReasonFilter(isSelected ? 'ALL' : key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-300'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {info.mecCode}
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {count} {count === 1 ? 'aluno' : 'alunos'} ({percentage.toFixed(0)}%)
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{info.label}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {info.description}
                </p>

                {/* Barra de Progresso */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA MULTIFATORIAL DE FILTROS PARA ESCLARECER O MOTIVO DA EVASÃO */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span>Filtros Estratégicos do Censo Educacional Municipal</span>
          </div>

          {(selectedReasonFilter !== 'ALL' ||
            selectedSearchStatusFilter !== 'ALL' ||
            selectedClassFilter !== 'ALL' ||
            selectedCadastralFilter !== 'ALL' ||
            selectedGenderFilter !== 'ALL' ||
            selectedShiftFilter !== 'ALL' ||
            searchTerm !== '') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedReasonFilter('ALL');
                setSelectedSearchStatusFilter('ALL');
                setSelectedClassFilter('ALL');
                setSelectedCadastralFilter('ALL');
                setSelectedGenderFilter('ALL');
                setSelectedShiftFilter('ALL');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar Todos os Filtros</span>
            </button>
          )}
        </div>

        {/* Linha de Busca Textual */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do estudante evadido, matrícula (RA), CPF, responsável legal ou relato..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Dropdowns de Filtros */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Filtro por Motivo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Motivo da Evasão</label>
            <select
              value={selectedReasonFilter}
              onChange={(e) => setSelectedReasonFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos os Motivos</option>
              {Object.entries(DROPOUT_REASON_INFO).map(([k, info]) => (
                <option key={k} value={k}>
                  {info.shortLabel} ({info.mecCode})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Busca Ativa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Busca Ativa</label>
            <select
              value={selectedSearchStatusFilter}
              onChange={(e) => setSelectedSearchStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos os Status</option>
              {Object.entries(ACTIVE_SEARCH_STATUS_INFO).map(([k, info]) => (
                <option key={k} value={k}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Turma */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Turma / Série</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas as Turmas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Situação Cadastral */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Situação Cadastral</label>
            <select
              value={selectedCadastralFilter}
              onChange={(e) => setSelectedCadastralFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas as Situações</option>
              <option value="OK">Cadastro OK / Regular</option>
              <option value="PENDING_DOCS">Pendência de Documentos</option>
              <option value="INCOMPLETE">Cadastro Incompleto</option>
              <option value="NEEDS_UPDATE">Necessita Atualização</option>
            </select>
          </div>

          {/* Filtro por Turno */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Turno</label>
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos os Turnos</option>
              <option value="MANHÃ">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="NOITE">Noite</option>
              <option value="INTEGRAL">Integral</option>
            </select>
          </div>

          {/* Filtro por Gênero */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Gênero</label>
            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABELA ANALÍTICA NOMINAL DO CENSO DE EVASÃO ESCOLAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-600" />
              <span>Relação Nominal de Estudantes Evadidos ({filteredDroppedOut.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Registros detalhados com histórico de intervenção, órgãos acionados e ações pedagógicas da rede.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
            Exibindo {filteredDroppedOut.length} de {droppedOutStudents.length} evadidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Estudante & RA</th>
                <th className="py-3 px-3">Turma / Turno</th>
                <th className="py-3 px-3">Cadastro</th>
                <th className="py-3 px-3">Motivo da Evasão (MEC)</th>
                <th className="py-3 px-3">Data Evasão</th>
                <th className="py-3 px-3">Busca Ativa & Responsável</th>
                <th className="py-3 px-3 text-center">Rede de Proteção</th>
                <th className="py-3 px-4 text-right">Ação / Ficha</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDroppedOut.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-slate-700 text-sm">
                      Nenhum estudante evadido encontrado para os filtros selecionados!
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Excelente indicador de permanência escolar na rede municipal.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDroppedOut.map((student) => {
                  const cls = classMap.get(student.classId);
                  const reasonInfo = student.dropoutReason
                    ? DROPOUT_REASON_INFO[student.dropoutReason]
                    : DROPOUT_REASON_INFO['OUTROS'];
                  const searchStatus = student.dropoutIntervention?.searchStatus || 'EM_BUSCA_ATIVA';
                  const searchInfo = ACTIVE_SEARCH_STATUS_INFO[searchStatus];
                  const cadastralInfo = CADASTRAL_STATUS_INFO[student.cadastralStatus || 'OK'];

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nome e Identificação */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{student.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              RA: {student.enrollmentNumber} • CPF: {student.cpf}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Turma / Turno */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {cls?.name || 'Turma não informada'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {cls?.shift || 'Turno Regular'}
                        </span>
                      </td>

                      {/* Situação Cadastral */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cadastralInfo.bg} ${cadastralInfo.color} ${cadastralInfo.border}`}
                          title={cadastralInfo.desc}
                        >
                          {cadastralInfo.label}
                        </span>
                      </td>

                      {/* Motivo da Evasão */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${reasonInfo.bg} ${reasonInfo.color} ${reasonInfo.border}`}
                          >
                            <span className="font-black font-mono">{reasonInfo.mecCode}:</span>
                            <span className="truncate max-w-[170px]">{reasonInfo.shortLabel}</span>
                          </span>
                          {student.dropoutObservation && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                              "{student.dropoutObservation}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Data da Evasão */}
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {student.dropoutDate
                          ? new Date(student.dropoutDate).toLocaleDateString('pt-BR')
                          : 'Não informada'}
                      </td>

                      {/* Status da Busca Ativa & Agente */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${searchInfo.bg} ${searchInfo.color} ${searchInfo.border}`}
                        >
                          {searchInfo.label}
                        </span>
                        {student.dropoutIntervention?.responsibleAgent && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                            {student.dropoutIntervention.responsibleAgent}
                          </p>
                        )}
                      </td>

                      {/* Rede de Proteção (Conselho Tutelar & CRAS) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {student.dropoutIntervention?.conselhoTutelarNotified ? (
                            <span
                              className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[9px] border border-purple-200"
                              title={`Conselho Tutelar Notificado. Protocolo: ${student.dropoutIntervention.conselhoTutelarProtocol || 'S/N'}`}
                            >
                              CT Notificado
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-medium">CT Pendente</span>
                          )}

                          {student.dropoutIntervention?.crasNotified && (
                            <span
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px] border border-blue-200"
                              title="CRAS / Assistência Social Acionada"
                            >
                              CRAS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ações / Abrir Ficha de Busca Ativa */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForIntervention(student)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors inline-flex items-center gap-1 cursor-pointer text-xs shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ficha & Resgate</span>
                        </button>
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

      {/* ========================================================================= */}
      {/* MODAL DE GESTÃO DA BUSCA ATIVA & FICHA DE RESGATE ESCOLAR */}
      {/* ========================================================================= */}
      {selectedStudentForIntervention && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
            {/* Header do Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Ficha de Busca Ativa & Resgate Escolar
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {selectedStudentForIntervention.name} • RA:{' '}
                    {selectedStudentForIntervention.enrollmentNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForIntervention(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Diagnóstico Inicial */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-500">
                    Motivo da Evasão Cadastrado
                  </span>
                  <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    {selectedStudentForIntervention.dropoutReason
                      ? DROPOUT_REASON_INFO[selectedStudentForIntervention.dropoutReason]?.label
                      : 'Outros Motivos'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Responsável Legal:</span>
                    <span className="font-bold text-slate-800">
                      {selectedStudentForIntervention.guardianName || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Telefone / Contato:</span>
                    <span className="font-bold text-slate-800">
                      {selectedStudentForIntervention.phone ||
                        selectedStudentForIntervention.guardianPhone ||
                        'Não informado'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">Endereço Residencial:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedStudentForIntervention.address || 'Não informado'}
                    </span>
                  </div>
                </div>

                {selectedStudentForIntervention.dropoutObservation && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                    "{selectedStudentForIntervention.dropoutObservation}"
                  </div>
                )}
              </div>

              {/* Ações de Transição de Status (Resgatar / Encaminhar) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Atualizar Situação do Caso na Rede
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateSearchStatus('RESGATADO_REINSERIDO')}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Resgatar & Reinserir</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSearchStatus('EM_BUSCA_ATIVA')}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4 text-amber-600" />
                    <span>Em Busca Ativa</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSearchStatus('ENCAMINHADO_CONSELHO')}
                    className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="h-4 w-4 text-purple-600" />
                    <span>Acionar Conselho</span>
                  </button>
                </div>
              </div>

              {/* Registro de Nova Tentativa de Contato / Visita Domiciliar */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="h-4 w-4 text-indigo-600" />
                  <span>Registrar Nova Ação / Visita Domiciliar</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tipo de Contato / Ação
                    </label>
                    <select
                      value={newContactType}
                      onChange={(e) => setNewContactType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="VISITA_DOMICILIAR">Visita Domiciliar Técnica</option>
                      <option value="TELEFONE">Contato Telefônico</option>
                      <option value="WHATSAPP">Mensagem WhatsApp Oficial</option>
                      <option value="REUNIAO_SME">Reunião de Acolhimento na Escola/SME</option>
                      <option value="CARTA_CONVOCACAO">Carta de Notificação / Convocação</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Agente / Técnico Responsável
                    </label>
                    <input
                      type="text"
                      value={newContactAgent}
                      onChange={(e) => setNewContactAgent(e.target.value)}
                      placeholder="Ex: Assistente Social SME"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Resultado / Relatório da Ação Realizada
                    </label>
                    <textarea
                      rows={2}
                      value={newContactOutcome}
                      onChange={(e) => setNewContactOutcome(e.target.value)}
                      placeholder="Ex: Visita realizada à residência do aluno. Família aceitou o plano de transporte escolar e comprometeu-se com o retorno na segunda-feira..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleAddContactAttempt}
                    disabled={!newContactOutcome.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-200"
                  >
                    <Check className="h-4 w-4" />
                    <span>Salvar Registro na Ficha</span>
                  </button>
                </div>
              </div>

              {/* Histórico das Tentativas de Contato / Linha do Tempo */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>Histórico de Intervenções & Protocolos ({selectedStudentForIntervention.dropoutIntervention?.contactAttempts?.length || 0})</span>
                </h4>

                {(!selectedStudentForIntervention.dropoutIntervention?.contactAttempts ||
                  selectedStudentForIntervention.dropoutIntervention.contactAttempts.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    Nenhuma tentativa de contato ou visita registrada anteriormente para este estudante.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStudentForIntervention.dropoutIntervention.contactAttempts.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {att.type.replace('_', ' ')}
                          </span>
                          <span className="font-mono">{new Date(att.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium">{att.outcome}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Responsável: {att.agentName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentForIntervention(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CUSTOMIZAÇÃO AVANÇADA DE GRÁFICOS DO CENSO */}
      <CustomizableChartModal
        isOpen={isChartCustomizerOpen}
        onClose={() => setIsChartCustomizerOpen(false)}
        availableDatasets={availableChartDatasets}
        initialDatasetId={chartCustomizerInitialDataset}
      />
    </div>
  );
};
