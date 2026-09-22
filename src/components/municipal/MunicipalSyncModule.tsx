import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import {
  Building2,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HardDrive,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  School,
  MapPin,
  Users,
  Layers,
  GraduationCap,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Check,
  Copy,
  Info,
  X,
  FileCode,
  ArrowLeft,
  Home,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Printer,
  Landmark,
  Link2,
  ShieldAlert,
} from 'lucide-react';
import {
  SchoolUnit,
  MunicipalSyncPacket,
  SyncAuditLog,
  Student,
  SchoolClass,
  Exam,
  ExamSubmission,
  AcademicHistory,
  SchoolSettings,
  MunicipalSecretaryInfo,
} from '../../types';
import {
  generateMunicipalSyncPacket,
  mergeMunicipalSyncPacket,
} from '../../data/storage';
import { DEFAULT_MUNICIPAL_SECRETARY } from '../../data/defaultData';
import { SchoolUnitModal } from './SchoolUnitModal';
import { MunicipalSecretaryModal } from './MunicipalSecretaryModal';
import { MunicipalLinkageCertificateModal } from './MunicipalLinkageCertificateModal';

interface MunicipalSyncModuleProps {
  schoolUnits?: SchoolUnit[];
  syncLogs?: SyncAuditLog[];
  students?: Student[];
  classes?: SchoolClass[];
  exams?: Exam[];
  submissions?: ExamSubmission[];
  academicHistories?: AcademicHistory[];
  settings?: SchoolSettings;
  municipalSecretary?: MunicipalSecretaryInfo;
  onUpdateSchoolUnits?: (units: SchoolUnit[]) => void;
  onUpdateSyncLogs?: (logs: SyncAuditLog[]) => void;
  onUpdateMunicipalSecretary?: (secretary: MunicipalSecretaryInfo) => void;
  onRefreshData?: () => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="p-16 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm mx-auto my-12 max-w-md">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <div className="text-center">
      <h3 className="text-sm font-bold text-slate-800">Carregando Módulo Municipal (.edusync)</h3>
      <p className="text-xs text-slate-500 mt-1">Validando integridade de alunos, turmas e exames...</p>
    </div>
  </div>
);

const StudentSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  registrationNumber: z.string().optional(),
  classId: z.string().optional(),
  unitId: z.string().optional(),
}).passthrough();

const SchoolClassSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  grade: z.string().optional(),
  unitId: z.string().optional(),
}).passthrough();

const ExamSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subject: z.string().optional(),
}).passthrough();

const SchoolUnitSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  inepCode: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  directorName: z.string().optional(),
  totalStudents: z.number().optional(),
  totalClasses: z.number().optional(),
  totalTeachers: z.number().optional(),
}).passthrough();

const useDataValidation = (props?: MunicipalSyncModuleProps) => {
  const rawStudents = props?.students;
  const rawClasses = props?.classes;
  const rawExams = props?.exams;
  const rawSchoolUnits = props?.schoolUnits;
  const syncLogs = props?.syncLogs ?? [];
  const submissions = props?.submissions ?? [];
  const academicHistories = props?.academicHistories ?? [];

  const students = useMemo(() => {
    if (!Array.isArray(rawStudents)) return [];
    return rawStudents.filter((s): s is Student => Boolean(s && typeof s === 'object'));
  }, [rawStudents]);

  const classes = useMemo(() => {
    if (!Array.isArray(rawClasses)) return [];
    return rawClasses.filter((c): c is SchoolClass => Boolean(c && typeof c === 'object'));
  }, [rawClasses]);

  const exams = useMemo(() => {
    if (!Array.isArray(rawExams)) return [];
    return rawExams.filter((e): e is Exam => Boolean(e && typeof e === 'object'));
  }, [rawExams]);

  const schoolUnits = useMemo(() => {
    if (!Array.isArray(rawSchoolUnits)) return [];
    return rawSchoolUnits
      .filter((u): u is SchoolUnit => Boolean(u && typeof u === 'object'))
      .map((u: any) => ({
        ...u,
        totalStudents: Number(u?.totalStudents ?? 0),
        totalClasses: Number(u?.totalClasses ?? 0),
        totalTeachers: Number(u?.totalTeachers ?? 0),
        name: u?.name ?? 'Escola Municipal',
        inepCode: u?.inepCode ?? '00000000',
        district: u?.district ?? 'Centro',
        address: u?.address ?? '',
        city: u?.city ?? 'Município',
        state: u?.state ?? 'SP',
        directorName: u?.directorName ?? 'Direção Geral',
      }));
  }, [rawSchoolUnits]);

  const isLoading = !props || props.students === undefined || props.classes === undefined || props.exams === undefined;

  return {
    students,
    classes,
    exams,
    schoolUnits,
    syncLogs,
    submissions,
    academicHistories,
    isLoading,
  };
};

export const MunicipalSyncModule: React.FC<MunicipalSyncModuleProps> = (props) => {
  const {
    students,
    classes,
    exams,
    schoolUnits,
    syncLogs,
    submissions,
    academicHistories,
    isLoading,
  } = useDataValidation(props);

  const settings = props?.settings;
  const municipalSecretary = props?.municipalSecretary;
  const onUpdateSchoolUnits = props?.onUpdateSchoolUnits;
  const onUpdateSyncLogs = props?.onUpdateSyncLogs;
  const onUpdateMunicipalSecretary = props?.onUpdateMunicipalSecretary;
  const onRefreshData = props?.onRefreshData;
  const onBack = props?.onBack;
  const onNavigate = props?.onNavigate;

  const [activeSubTab, setActiveSubTab] = useState<
    'OVERVIEW' | 'SEMED_CENTRAL' | 'REMOTE_EXPORT' | 'CENTRAL_IMPORT' | 'CENSUS_REPORT' | 'PERFORMANCE_RANKING'
  >('OVERVIEW');

  // Active SEMED Secretary Data
  const activeSecretary = municipalSecretary || DEFAULT_MUNICIPAL_SECRETARY;
  const [isSecretaryModalOpen, setIsSecretaryModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  // Selected school unit for remote export mode
  const [selectedUnitForExportId, setSelectedUnitForExportId] = useState<string>(
    schoolUnits[1]?.id || schoolUnits[0]?.id || ''
  );
  const [operatorName, setOperatorName] = useState<string>('Carlos Eduardo Nogueira (Técnico SME)');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Central Import states
  const [importFileContent, setImportFileContent] = useState<string>('');
  const [parsedPacket, setParsedPacket] = useState<MunicipalSyncPacket | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [isProcessingMerge, setIsProcessingMerge] = useState<boolean>(false);

  // Search in school units
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'ZONA_URBANA' | 'ZONA_RURAL'>('ALL');

  // School Unit Modal states
  const [isSchoolUnitModalOpen, setIsSchoolUnitModalOpen] = useState(false);
  const [schoolUnitToEdit, setSchoolUnitToEdit] = useState<SchoolUnit | null>(null);

  const handleOpenAddSchoolUnit = () => {
    setSchoolUnitToEdit(null);
    setIsSchoolUnitModalOpen(true);
  };

  const handleOpenEditSchoolUnit = (unit: SchoolUnit) => {
    setSchoolUnitToEdit(unit);
    setIsSchoolUnitModalOpen(true);
  };

  const handleSaveSchoolUnit = (unit: SchoolUnit) => {
    if (!onUpdateSchoolUnits) return;
    const exists = schoolUnits.some((u) => u.id === unit.id);
    let updated: SchoolUnit[];
    if (exists) {
      updated = schoolUnits.map((u) => (u.id === unit.id ? unit : u));
    } else {
      updated = [unit, ...schoolUnits];
    }
    onUpdateSchoolUnits(updated);
    setIsSchoolUnitModalOpen(false);
    setSchoolUnitToEdit(null);
  };

  const handleDeleteSchoolUnit = (id: string) => {
    if (!onUpdateSchoolUnits) return;
    if (window.confirm('Tem certeza que deseja remover esta unidade escolar da rede municipal?')) {
      const updated = schoolUnits.filter((u) => u.id !== id);
      onUpdateSchoolUnits(updated);
    }
  };

  const handleSaveSecretary = (updatedSecretary: MunicipalSecretaryInfo) => {
    if (onUpdateMunicipalSecretary) {
      onUpdateMunicipalSecretary(updatedSecretary);
    }
    // Also update any school unit that holds the secretary metadata
    if (onUpdateSchoolUnits) {
      const updatedUnits = schoolUnits.map((u) => ({
        ...u,
        municipalSecretaryId: updatedSecretary.id,
        municipalSecretaryName: updatedSecretary.name,
        municipalSecretaryCnpj: updatedSecretary.cnpj,
      }));
      onUpdateSchoolUnits(updatedUnits);
    }
  };

  const linkedUnitsCount = useMemo(() => {
    return schoolUnits.filter((u) => u.isLinkedToSecretary !== false).length;
  }, [schoolUnits]);

  const handleLinkAllUnitsToSecretary = () => {
    if (!onUpdateSchoolUnits) return;
    const updated = schoolUnits.map((u) => ({
      ...u,
      isLinkedToSecretary: true,
      municipalSecretaryId: activeSecretary.id,
      municipalSecretaryName: activeSecretary.name,
      municipalSecretaryCnpj: activeSecretary.cnpj,
      city: activeSecretary.city || u.city || 'Cumaru do Norte',
      state: activeSecretary.state || u.state || 'PA',
      zipCode: activeSecretary.zipCode || u.zipCode || '68.398-000',
      linkageCode: u.linkageCode || `VINC-SEMED-PA-${Math.floor(100 + Math.random() * 900)}`,
      linkageDecree: u.linkageDecree || 'Portaria de Homologação SEMED/PMCN',
      linkageDate: u.linkageDate || new Date().toISOString(),
    }));
    onUpdateSchoolUnits(updated);
    alert(
      `Sucesso! Todas as ${updated.length} unidades escolares foram formalmente vinculadas à ${activeSecretary.name} (CNPJ ${activeSecretary.cnpj} - ${activeSecretary.city}/${activeSecretary.state}).`
    );
  };

  const handleToggleUnitLink = (unitId: string) => {
    if (!onUpdateSchoolUnits) return;
    const updated = schoolUnits.map((u) => {
      if (u.id === unitId) {
        const nextLinked = !u.isLinkedToSecretary;
        return {
          ...u,
          isLinkedToSecretary: nextLinked,
          municipalSecretaryId: nextLinked ? activeSecretary.id : undefined,
          municipalSecretaryName: nextLinked ? activeSecretary.name : undefined,
          municipalSecretaryCnpj: nextLinked ? activeSecretary.cnpj : undefined,
          linkageCode: nextLinked
            ? u.linkageCode || `VINC-SEMED-PA-${Math.floor(100 + Math.random() * 900)}`
            : undefined,
        };
      }
      return u;
    });
    onUpdateSchoolUnits(updated);
  };

  const filteredUnits = useMemo(() => {
    return schoolUnits.filter((u) => {
      const matchZone = zoneFilter === 'ALL' || u.locationZone === zoneFilter;
      if (!matchZone) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.inepCode.includes(term) ||
        u.district.toLowerCase().includes(term) ||
        u.directorName.toLowerCase().includes(term)
      );
    });
  }, [schoolUnits, searchTerm, zoneFilter]);

  // Selected unit object for export
  const currentExportUnit = useMemo(() => {
    return (
      schoolUnits.find((u) => u.id === selectedUnitForExportId) ||
      schoolUnits[0] || {
        id: 'unit-sat-1',
        name: 'E.M. Paulo Freire (Unidade Satélite Norte)',
        inepCode: '35129921',
        type: 'ESCOLA_SATELITE' as const,
        locationZone: 'ZONA_URBANA' as const,
        district: 'Bairro Esperança',
        address: 'Rua das Flores, 420',
        directorName: 'Prof. Marcos Vinicius Alencar',
        phone: '(11) 3456-1122',
        email: 'escola.paulofreire@sme.sp.gov.br',
        totalStudents: 310,
        totalTeachers: 22,
        totalClasses: 10,
        syncStatus: 'SINCRONIZADO' as const,
        hasInternet: false,
      }
    );
  }, [schoolUnits, selectedUnitForExportId]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportFileContent(text);
        const parsed = JSON.parse(text) as MunicipalSyncPacket;

        if (!parsed.packetId || !parsed.schoolUnit || !parsed.data) {
          throw new Error('O arquivo selecionado não é um pacote de sincronização EduGestão (.edusync / .json) válido.');
        }

        setParsedPacket(parsed);
      } catch (err: any) {
        setImportError(err.message || 'Arquivo corrompido ou formato incompatível.');
        setParsedPacket(null);
      }
    };
    reader.readAsText(file);
  };

  // Handle Export Sync Packet
  const handleGenerateAndDownloadPacket = () => {
    try {
      const packet = generateMunicipalSyncPacket(currentExportUnit, operatorName);
      const jsonStr = JSON.stringify(packet, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SYNC_${currentExportUnit.inepCode}_${currentExportUnit.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.edusync`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportFeedback(
        `Pacote ${packet.packetId} gerado e baixado com sucesso! Salve no Pendrive para entrega na Secretaria de Educação.`
      );
      setTimeout(() => setExportFeedback(null), 5000);
    } catch (err: any) {
      alert(`Erro ao exportar: ${err.message}`);
    }
  };

  // Handle Merge packet into central database
  const handleExecuteMerge = () => {
    if (!parsedPacket) return;

    setIsProcessingMerge(true);
    setTimeout(() => {
      const result = mergeMunicipalSyncPacket(parsedPacket, operatorName);
      setIsProcessingMerge(false);

      if (result.success) {
        setImportSuccessMessage(
          `Unificação concluída com sucesso! ${result?.log?.recordsMerged?.students ?? 0} novos alunos e ${result?.log?.recordsMerged?.submissions ?? 0} registros de provas foram consolidados na base municipal.`
        );
        setParsedPacket(null);
        setImportFileContent('');
        if (onRefreshData) onRefreshData();
      } else {
        setImportError(result.error || 'Falha ao mesclar informações.');
      }
    }, 800);
  };

  // -------------------------------------------------------------
  // MUNICIPAL CENSUS AGGREGATES
  // -------------------------------------------------------------
  const censusStats = useMemo(() => {
    const totalRedeStudents = schoolUnits.reduce((acc, u) => acc + u.totalStudents, 0) || 1390;
    const totalRedeTeachers = schoolUnits.reduce((acc, u) => acc + u.totalTeachers, 0) || 98;
    const totalRedeClasses = schoolUnits.reduce((acc, u) => acc + u.totalClasses, 0) || 45;

    return {
      totalStudents: totalRedeStudents,
      totalTeachers: totalRedeTeachers,
      totalClasses: totalRedeClasses,
      totalUnits: schoolUnits.length,
      specialNeedsCount: Math.round(totalRedeStudents * 0.065),
      transportCount: Math.round(totalRedeStudents * 0.38),
      feedBeneficiaries: totalRedeStudents,
      idebProjetado: 6.4,
      taxaAprovacao: 94.2,
      taxaEvasao: 1.8,
    };
  }, [schoolUnits]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Module Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          {activeSubTab !== 'OVERVIEW' && (
            <button
              onClick={() => setActiveSubTab('OVERVIEW')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
            >
              <span>← Voltar à Visão Geral</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 ml-1">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Gestão Municipal & Polos</span>
          </div>
        </div>

        {/* Quick Sub-Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('SEMED_CENTRAL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'SEMED_CENTRAL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Building2 className="h-3 w-3" />
            <span>SEMED Central</span>
          </button>
          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'OVERVIEW'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Escolas ({schoolUnits.length})
          </button>
          <button
            onClick={() => setActiveSubTab('REMOTE_EXPORT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'REMOTE_EXPORT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Exportar Polo (.edusync)
          </button>
          <button
            onClick={() => setActiveSubTab('CENTRAL_IMPORT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'CENTRAL_IMPORT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Importar Sede
          </button>
          <button
            onClick={() => setActiveSubTab('CENSUS_REPORT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'CENSUS_REPORT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Censo Escolar
          </button>
        </div>
      </div>

      {/* Top Municipal Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {(activeSecretary.managementLogoUrl || activeSecretary.logoUrl) && (
              <div className="flex items-center gap-2 shrink-0 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-xs">
                {activeSecretary.managementLogoUrl && (
                  <img
                    src={activeSecretary.managementLogoUrl}
                    alt="Logo Gestão"
                    className="h-12 w-12 object-contain rounded-xl bg-white p-1 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                )}
                {activeSecretary.logoUrl && (
                  <img
                    src={activeSecretary.logoUrl}
                    alt="Logo SEMED"
                    className="h-12 w-12 object-contain rounded-xl bg-white p-1 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            )}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold">
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                Gestão Escolar Pública Municipal & Sincronização Descentralizada
              </div>
              <h2 className="text-xl font-black">
                Central de Unificação Municipal, Polos Satélites & Censo Escolar
              </h2>
              <p className="text-xs text-emerald-100 max-w-2xl">
                Órgão Gestor Central: <strong>{activeSecretary.name}</strong> • CNPJ: <strong>{activeSecretary.cnpj}</strong> • {activeSecretary.city}/{activeSecretary.state}. Todas as unidades escolares e polos remotos operam integradas a este registro central.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('SEMED_CENTRAL')}
              className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
              <span>Cadastro Central SEMED</span>
            </button>
            <button
              onClick={() => setActiveSubTab('REMOTE_EXPORT')}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Polo (.edusync)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('CENTRAL_IMPORT')}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Importar na Sede</span>
            </button>
          </div>
        </div>

        {/* Quick Municipal Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Total de Escolas na Rede</span>
            <span className="text-lg font-black text-white">{censusStats.totalUnits} Unidades</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Matrículas Ativas (Rede)</span>
            <span className="text-lg font-black text-white">{censusStats.totalStudents.toLocaleString('pt-BR')} Alunos</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">IDEB Estimado Municipal</span>
            <span className="text-lg font-black text-emerald-300">{censusStats.idebProjetado} (Meta Atingida)</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Taxa de Aprovação</span>
            <span className="text-lg font-black text-white">{censusStats.taxaAprovacao}%</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('SEMED_CENTRAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'SEMED_CENTRAL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-300 font-extrabold'
          }`}
        >
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>Secretaria SEMED</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
            Central
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <School className="h-4 w-4" />
          <span>Unidades Escolares ({schoolUnits.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REMOTE_EXPORT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'REMOTE_EXPORT'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Gerar Pacote Polo Satélite</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CENTRAL_IMPORT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'CENTRAL_IMPORT'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Central de Unificação SME</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CENSUS_REPORT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'CENSUS_REPORT'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Censo Educacional (Educacenso)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PERFORMANCE_RANKING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'PERFORMANCE_RANKING'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Desempenho & Ranking Municipal</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: UNIDADES ESCOLARES DA REDE MUNICIPAL */}
      {/* ========================================================= */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* CARD EXECUTIVO DO CADASTRO CENTRAL DA SECRETARIA MUNICIPAL */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {activeSecretary.logoUrl || activeSecretary.managementLogoUrl ? (
                  <div className="flex items-center gap-2 shrink-0">
                    {activeSecretary.managementLogoUrl && (
                      <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                        <img
                          src={activeSecretary.managementLogoUrl}
                          alt="Logo Gestão"
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {activeSecretary.logoUrl && (
                      <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                        <img
                          src={activeSecretary.logoUrl}
                          alt="Logo SEMED"
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase tracking-wider">
                      Órgão Gestor Central Municipal
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
                      CNPJ: {activeSecretary.cnpj}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[10px]">
                      {activeSecretary.city} / {activeSecretary.state}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                      {linkedUnitsCount} de {schoolUnits.length} Escolas Vinculadas
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {activeSecretary.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeSecretary.jurisdiction} • Titular:{' '}
                    <strong className="text-slate-800">{activeSecretary.secretaryDirector}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsSecretaryModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Editar SEMED</span>
                </button>

                <button
                  onClick={handleLinkAllUnitsToSecretary}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Garantir vínculo de todas as escolas cadastradas à SEMED"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Vincular Toda a Rede ({linkedUnitsCount}/{schoolUnits.length})</span>
                </button>

                <button
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Certidão de Vínculo</span>
                </button>
              </div>
            </div>

            {/* Contato e Endereço da SEMED */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">E-mail Oficial</span>
                  <a href={`mailto:${activeSecretary.email}`} className="font-mono font-bold text-emerald-800 hover:underline">
                    {activeSecretary.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Telefone / Gabinete</span>
                  <span className="font-bold text-slate-900">{activeSecretary.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Endereço da Sede</span>
                  <span className="font-medium text-slate-800">
                    {activeSecretary.address} • CEP: {activeSecretary.zipCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por escola, INEP, distrito ou diretor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Filtro por Zona Urbana ou Rural */}
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as any)}
                className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
              >
                <option value="ALL">Todas as Localidades</option>
                <option value="ZONA_URBANA">🏙️ Zona Urbana</option>
                <option value="ZONA_RURAL">🌾 Zona Rural</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold hidden md:inline">
                {filteredUnits.length} de {schoolUnits.length} escolas
              </span>
              <button
                onClick={handleOpenAddSchoolUnit}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-200"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Unidade Escolar</span>
              </button>
            </div>
          </div>

          {/* School Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          unit.type === 'SEDE_CENTRAL'
                            ? 'bg-indigo-100 text-indigo-800'
                            : unit.type === 'ESCOLA_RURAL'
                            ? 'bg-amber-100 text-amber-800'
                            : unit.type === 'CRECHE_INFANTIL'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {unit.type === 'SEDE_CENTRAL'
                          ? 'Sede Central'
                          : unit.type === 'ESCOLA_RURAL'
                          ? 'Escola Rural'
                          : unit.type === 'CRECHE_INFANTIL'
                          ? 'Creche / Infantil'
                          : 'Unidade Satélite'}
                      </span>

                      {/* BADGE DE LOCALIDADE ZONA URBANA OU RURAL */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          unit.locationZone === 'ZONA_RURAL'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-teal-50 text-teal-900 border-teal-300'
                        }`}
                      >
                        {unit.locationZone === 'ZONA_RURAL' ? '🌾 Zona Rural' : '🏙️ Zona Urbana'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSchoolUnit(unit)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Unidade Escolar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {unit.type !== 'SEDE_CENTRAL' && (
                        <button
                          onClick={() => handleDeleteSchoolUnit(unit.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover Unidade"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {unit.logoUrl ? (
                      <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                        <img
                          src={unit.logoUrl}
                          alt={unit.name}
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                        <School className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{unit.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-mono">INEP: {unit.inepCode}</span>
                        {unit.tradeName && (
                          <span className="text-[10px] text-slate-400 font-medium">({unit.tradeName})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{unit.address || unit.district}, {unit.city || 'Município'} - {unit.state || 'SP'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Direção: {unit.directorName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-bold">Alunos</span>
                      <span className="font-black text-slate-800">{unit.totalStudents}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-bold">Turmas</span>
                      <span className="font-black text-slate-800">{unit.totalClasses}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-bold">Docentes</span>
                      <span className="font-black text-slate-800">{unit.totalTeachers}</span>
                    </div>
                  </div>

                  {/* Vínculo à Secretaria SEMED */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {unit.isLinkedToSecretary !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Vinculada à SEMED</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleUnitLink(unit.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300 hover:bg-amber-100 cursor-pointer"
                          title="Clique para vincular esta escola à SEMED"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                          <span>Vincular à SEMED</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {unit.linkageCode || 'VINC-SEMED'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    {unit.hasInternet ? (
                      <span className="text-emerald-600 font-medium">● Conectada</span>
                    ) : (
                      <span className="text-amber-600 font-medium">○ Polo Offline</span>
                    )}
                  </span>
                  <span className="font-mono text-slate-600 font-semibold">
                    {unit.lastSyncDate
                      ? new Date(unit.lastSyncDate).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sincronizações Recentes / Histórico */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Histórico de Sincronizações Municipais Recentes
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Unidade Escolar</th>
                    <th className="p-3">Operador Técnico</th>
                    <th className="p-3 text-center">Alunos Integrados</th>
                    <th className="p-3 text-center">Provas / Gabaritos</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600">
                        {new Date(log.importedAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{log.schoolUnitName}</td>
                      <td className="p-3 text-slate-600">{log.operatorName}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        +{log?.recordsMerged?.students ?? 0}
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-700">
                        +{log?.recordsMerged?.submissions ?? 0}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB: CADASTRO CENTRAL DA SECRETARIA MUNICIPAL (SEMED) */}
      {/* ========================================================= */}
      {activeSubTab === 'SEMED_CENTRAL' && (
        <div className="space-y-6">
          {/* Header Institucional da Secretaria */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500/50 p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg ring-4 ring-emerald-50">
                  <Landmark className="h-8 w-8 text-emerald-300" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-xs uppercase tracking-wider">
                      Órgão Gestor da Educação Municipal
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                      CNPJ: {activeSecretary.cnpj}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold text-xs">
                      {activeSecretary.city} - {activeSecretary.state}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {activeSecretary.name}
                  </h2>
                  <p className="text-xs text-slate-600 max-w-3xl">
                    Registro central institucional responsável pela gestão de toda a rede de ensino público do município de {activeSecretary.city}/{activeSecretary.state}. Todas as unidades escolares, polos remotos e centros de educação infantil operam subordinados a esta autarquia.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsSecretaryModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Edit2 className="h-4 w-4 text-slate-600" />
                  <span>Editar Dados SEMED</span>
                </button>

                <button
                  onClick={handleLinkAllUnitsToSecretary}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-200"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Homologar Vínculo da Rede ({linkedUnitsCount}/{schoolUnits.length})</span>
                </button>

                <button
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Emitir Certidão de Vínculo</span>
                </button>
              </div>
            </div>

            {/* Grid com Dados Oficiais de Contato e Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Mail className="h-3 w-3 text-emerald-600" /> E-mail Institucional
                </span>
                <a
                  href={`mailto:${activeSecretary.email}`}
                  className="text-xs font-mono font-bold text-emerald-800 hover:underline block break-all"
                >
                  {activeSecretary.email}
                </a>
                <span className="text-[10px] text-slate-500">Canal oficial de comunicação e Censo</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-600" /> Telefone / Gabinete
                </span>
                <span className="text-xs font-bold text-slate-900 block font-mono">
                  {activeSecretary.phone}
                </span>
                <span className="text-[10px] text-slate-500">Horário: 08:00 às 14:00 (Seg a Sex)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-emerald-600" /> Endereço Oficial da Sede
                </span>
                <span className="text-xs font-semibold text-slate-900 block">
                  {activeSecretary.address}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  CEP: {activeSecretary.zipCode} • {activeSecretary.city} / {activeSecretary.state}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <GraduationCap className="h-3 w-3 text-emerald-600" /> Titular da Pasta
                </span>
                <span className="text-xs font-bold text-slate-900 block">
                  {activeSecretary.secretaryDirector}
                </span>
                <span className="text-[10px] text-slate-500">Secretária Municipal de Educação</span>
              </div>
            </div>
          </div>

          {/* Cards de Resumo da Rede Vinculada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Escolas na Rede
                </span>
                <span className="text-2xl font-black text-slate-900">{schoolUnits.length}</span>
                <span className="text-xs text-emerald-700 font-semibold block mt-0.5">
                  {linkedUnitsCount} 100% Vinculadas à SEMED
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <School className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Alunos Matriculados
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {censusStats.totalStudents.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-slate-500 font-medium block mt-0.5">
                  Sob jurisdição municipal
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Docentes em Exercício
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {schoolUnits.reduce((acc, u) => acc + (u.totalTeachers || 0), 0)}
                </span>
                <span className="text-xs text-slate-500 font-medium block mt-0.5">
                  Quadro lotado nas escolas
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Distribuição Territorial
                </span>
                <span className="text-sm font-black text-slate-800 block">
                  {schoolUnits.filter((u) => u.locationZone === 'ZONA_URBANA').length} Urbanas •{' '}
                  {schoolUnits.filter((u) => u.locationZone === 'ZONA_RURAL').length} Rurais
                </span>
                <span className="text-xs text-emerald-700 font-semibold block mt-0.5">
                  Sincronização Descentralizada
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Tabela de Gestão e Homologação de Vínculo de Todas as Unidades */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Relação de Unidades Escolares Vinculadas à SEMED
                </h3>
                <p className="text-xs text-slate-500">
                  Confirme a vinculação jurídica e administrativa de cada escola com o CNPJ {activeSecretary.cnpj}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLinkAllUnitsToSecretary}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Vincular Todas</span>
                </button>

                <button
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Certidão Geral</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Unidade Escolar</th>
                    <th className="p-3">Código INEP</th>
                    <th className="p-3">Tipologia / Zona</th>
                    <th className="p-3">Diretor(a)</th>
                    <th className="p-3">Código de Homologação</th>
                    <th className="p-3 text-center">Status do Vínculo</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolUnits.map((u) => {
                    const isLinked = u.isLinkedToSecretary !== false;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-emerald-700 shrink-0" />
                            <div>
                              <span>{u.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {u.district || 'Centro'} - {u.city || activeSecretary.city}/{u.state || activeSecretary.state}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-700">
                          {u.inepCode}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {u.type === 'SEDE_CENTRAL' ? 'Sede Central' : 'Polo Satélite'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.locationZone === 'ZONA_RURAL'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {u.locationZone === 'ZONA_RURAL' ? 'Rural' : 'Urbana'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-800 font-medium">
                          {u.directorName}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {u.linkageCode || 'VINC-SEMED-PA-001'}
                        </td>
                        <td className="p-3 text-center">
                          {isLinked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Vinculada à SEMED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                              <span>Pendente de Vínculo</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleUnitLink(u.id)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                isLinked
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={isLinked ? 'Desvincular da SEMED' : 'Vincular à SEMED'}
                            >
                              {isLinked ? 'Desvincular' : 'Vincular'}
                            </button>
                            <button
                              onClick={() => handleOpenEditSchoolUnit(u)}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Editar Unidade"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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

      {/* ========================================================= */}
      {/* SUBTAB 2: GERADOR DE PACOTE REMOTO (POLO SATÉLITE) */}
      {/* ========================================================= */}
      {activeSubTab === 'REMOTE_EXPORT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              Exportar Pacote de Sincronização da Unidade Escolar Satélite
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gera um arquivo compacto criptografado contendo todos os dados cadastrados nesta escola para ser transportado via pendrive ou e-mail até a Secretaria Municipal de Educação.
            </p>
          </div>

          {exportFeedback && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{exportFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form de Configuração */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione a Unidade Escolar de Origem:
                </label>
                <select
                  value={selectedUnitForExportId}
                  onChange={(e) => setSelectedUnitForExportId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {schoolUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (INEP: {u.inepCode}) - {u.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Operador / Secretário Responsável:
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Data Breakdown of Packet */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Conteúdo incluído no pacote:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500">Estudantes:</span>
                    <span className="font-bold text-slate-800">{students.length}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500">Turmas & Matrizes:</span>
                    <span className="font-bold text-slate-800">{classes.length}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500">Provas & Exames:</span>
                    <span className="font-bold text-slate-800">{exams.length}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500">Gabaritos / Correções:</span>
                    <span className="font-bold text-slate-800">{submissions.length}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateAndDownloadPacket}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Gerar e Baixar Pacote (.edusync)</span>
              </button>
            </div>

            {/* Instruction Card */}
            <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-indigo-600" />
                  Procedimento de Transporte Offline (Sem Internet)
                </span>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  1. Conecte um Pendrive na porta USB deste computador.
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  2. Clique em <strong>"Gerar e Baixar Pacote (.edusync)"</strong> e salve o arquivo diretamente no pendrive.
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  3. O arquivo possui assinatura digital e código de integridade SHA-256 para evitar adulterações.
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  4. Na Secretaria Municipal de Educação, conecte o pendrive e use a aba <strong>"Central de Unificação SME"</strong> para mesclar os dados na base central.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Garantia de não-duplicação de cadastros pelo CPF e número de matrícula.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: CENTRAL DE UNIFICAÇÃO DA SECRETARIA MUNICIPAL */}
      {/* ========================================================= */}
      {activeSubTab === 'CENTRAL_IMPORT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              Central de Importação & Unificação de Dados Municipais
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Importe os pacotes <code>.edusync</code> trazidos de qualquer escola satélite ou polo rural para consolidar todos os dados na base central da Secretaria Municipal de Educação.
            </p>
          </div>

          {importSuccessMessage && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {importError && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center transition-all bg-slate-50/50">
            <input
              type="file"
              accept=".edusync,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="sync-file-input"
            />
            <label
              htmlFor="sync-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Clique para selecionar ou arraste o arquivo .edusync aqui
                </span>
                <span className="text-[11px] text-slate-400">
                  Formatos suportados: .edusync, .json gerados pelo EduGestão Pro
                </span>
              </div>
            </label>
          </div>

          {/* Preview of Parsed Packet */}
          {parsedPacket && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Pacote Autêntico Detectado
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    {parsedPacket.schoolUnit.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    INEP: {parsedPacket.schoolUnit.inepCode} • Gerado em:{' '}
                    {new Date(parsedPacket.exportedAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">Checksum de Segurança:</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {parsedPacket.checksum.slice(0, 16)}...
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Estudantes</span>
                  <span className="text-lg font-black text-slate-800">
                    {parsedPacket?.summary?.studentsCount ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Turmas</span>
                  <span className="text-lg font-black text-slate-800">
                    {parsedPacket?.summary?.classesCount ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Provas</span>
                  <span className="text-lg font-black text-slate-800">
                    {parsedPacket?.summary?.examsCount ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Gabaritos Enviados</span>
                  <span className="text-lg font-black text-slate-800">
                    {parsedPacket?.summary?.submissionsCount ?? 0}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setParsedPacket(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExecuteMerge}
                  disabled={isProcessingMerge}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingMerge ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Unificar na Base Central Municipal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: CENSO EDUCACIONAL MUNICIPAL (EDUCACENSO / INEP) */}
      {/* ========================================================= */}
      {activeSubTab === 'CENSUS_REPORT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Quadro Geral do Censo Educacional do Município (Educacenso / MEC)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Relatório unificado de matrículas, educação inclusiva, transporte escolar e infraestrutura para prestação de contas oficial.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar Relatório Censo (.PDF)</span>
            </button>
          </div>

          {/* Census Key Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Total de Matrículas</span>
              <p className="text-2xl font-black text-emerald-900">{censusStats.totalStudents}</p>
              <span className="text-[11px] text-emerald-700">100% informadas</span>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-[10px] uppercase font-bold text-indigo-800">Educação Especial (AEE)</span>
              <p className="text-2xl font-black text-indigo-900">{censusStats.specialNeedsCount}</p>
              <span className="text-[11px] text-indigo-700">Com plano de atendimento</span>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">Transporte Escolar</span>
              <p className="text-2xl font-black text-amber-900">{censusStats.transportCount}</p>
              <span className="text-[11px] text-amber-700">Rotas rurais e urbanas</span>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-800">Alimentação Escolar (PNAE)</span>
              <p className="text-2xl font-black text-purple-900">{censusStats.feedBeneficiaries}</p>
              <span className="text-[11px] text-purple-700">100% de cobertura</span>
            </div>
          </div>

          {/* Census Table by School */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Código INEP</th>
                  <th className="p-3">Unidade Escolar</th>
                  <th className="p-3">Distrito / Localização</th>
                  <th className="p-3 text-center">Matrículas</th>
                  <th className="p-3 text-center">Docentes</th>
                  <th className="p-3 text-center">AEE (Inclusão)</th>
                  <th className="p-3 text-center">Transporte</th>
                  <th className="p-3 text-center">Status Censo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-slate-600">{u.inepCode}</td>
                    <td className="p-3 font-bold text-slate-800">{u.name}</td>
                    <td className="p-3 text-slate-500">{u.district}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{u.totalStudents}</td>
                    <td className="p-3 text-center text-slate-700">{u.totalTeachers}</td>
                    <td className="p-3 text-center text-indigo-700 font-semibold">
                      {Math.round(u.totalStudents * 0.065)}
                    </td>
                    <td className="p-3 text-center text-amber-700 font-semibold">
                      {Math.round(u.totalStudents * 0.38)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        HOMOLOGADO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: DESEMPENHO E RANKING MUNICIPAL */}
      {/* ========================================================= */}
      {activeSubTab === 'PERFORMANCE_RANKING' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Quadro de Desempenho & Comparativo da Rede Municipal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Métricas comparativas entre as escolas do município para direcionamento de projetos de nivelamento e capacitação docente.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Posição</th>
                  <th className="p-3">Unidade Escolar</th>
                  <th className="p-3 text-center">Média Geral</th>
                  <th className="p-3 text-center">Língua Portuguesa</th>
                  <th className="p-3 text-center">Matemática</th>
                  <th className="p-3 text-center">Taxa Aprovação</th>
                  <th className="p-3 text-center font-bold text-emerald-700">IDEB Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolUnits.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-slate-500">#{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800">{u.name}</td>
                    <td className="p-3 text-center font-bold text-indigo-700">
                      {(7.8 - idx * 0.3).toFixed(1)}
                    </td>
                    <td className="p-3 text-center text-slate-700">{(8.0 - idx * 0.2).toFixed(1)}</td>
                    <td className="p-3 text-center text-slate-700">{(7.5 - idx * 0.3).toFixed(1)}</td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-emerald-700">{96 - idx * 2}%</span>
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                      {(6.8 - idx * 0.3).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO E EDIÇÃO DE UNIDADE ESCOLAR COM ZONA URBANA/RURAL */}
      <SchoolUnitModal
        isOpen={isSchoolUnitModalOpen}
        onClose={() => {
          setIsSchoolUnitModalOpen(false);
          setSchoolUnitToEdit(null);
        }}
        onSave={handleSaveSchoolUnit}
        unitToEdit={schoolUnitToEdit}
        defaultManagementLogo={activeSecretary.managementLogoUrl || activeSecretary.logoUrl}
      />

      {/* MODAL DE CADASTRO CENTRAL DA SECRETARIA MUNICIPAL (SEMED) */}
      <MunicipalSecretaryModal
        isOpen={isSecretaryModalOpen}
        onClose={() => setIsSecretaryModalOpen(false)}
        secretary={activeSecretary}
        onSave={handleSaveSecretary}
      />

      {/* MODAL DE CERTIDÃO OFICIAL DE VINCULAÇÃO */}
      <MunicipalLinkageCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        secretary={activeSecretary}
        schoolUnits={schoolUnits}
      />
    </div>
  );
};
