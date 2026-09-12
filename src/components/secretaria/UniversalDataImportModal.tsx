import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Users,
  Check,
  RefreshCw,
  Eye,
  Trash2,
  Table,
  Filter,
  Layers,
  Building2,
  HeartPulse,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Edit2,
  Search,
  UserCheck,
  CheckCircle,
  SlidersHorizontal,
  GraduationCap,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Student, SchoolClass, SchoolUnit, ClassShift } from '../../types';
import {
  parseSingleFile,
  convertImportedStudentsToOfficial,
  generateOfficialTemplateXlsx,
  DEFAULT_IMPORT_FILTERS,
  ImportFilterOptions,
  FileImportResult,
  ParsedImportStudent,
} from '../../services/dataImportService';
import { StudentQuickEditModal } from './StudentQuickEditModal';

interface UniversalDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  schoolUnits?: SchoolUnit[];
  studentsCount: number;
  onImportStudents: (
    newStudents: Student[],
    newSchoolUnits?: SchoolUnit[],
    newClasses?: SchoolClass[]
  ) => void;
  onNavigateToPendencias?: () => void;
  onNavigateToSchoolUnits?: () => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
}

export const UniversalDataImportModal: React.FC<UniversalDataImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  schoolUnits = [],
  studentsCount,
  onImportStudents,
  onNavigateToPendencias,
  onNavigateToSchoolUnits,
  onUpdateStudent,
}) => {
  const [fileResults, setFileResults] = useState<FileImportResult[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [filters, setFilters] = useState<ImportFilterOptions>(DEFAULT_IMPORT_FILTERS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importedOfficialStudents, setImportedOfficialStudents] = useState<Student[]>([]);
  const [importedUnits, setImportedUnits] = useState<SchoolUnit[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [postImportFilter, setPostImportFilter] = useState<'ALL' | 'INCOMPLETE' | 'OK'>('INCOMPLETE');
  const [postImportSearch, setPostImportSearch] = useState<string>('');
  const [importedStats, setImportedStats] = useState<{ total: number; incomplete: number }>({
    total: 0,
    incomplete: 0,
  });
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Abre a janela de seleção de arquivo do sistema de forma segura e garantida
  const openFileSelector = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Permite selecionar o mesmo arquivo novamente
      fileInputRef.current.click();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelect(e.dataTransfer.files);
    }
  };

  // Processa múltiplos arquivos de qualquer formato suportado
  const handleFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setImportSuccess(false);

    const results: FileImportResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await parseSingleFile(file, filters, classes, schoolUnits);
      results.push(res);
    }

    setFileResults((prev) => [...prev, ...results]);
    setIsProcessing(false);
  };

  // Carregar dados de exemplo diretos da planilha da Escola Maria da Praia
  const handleLoadSampleMariaDaPraia = () => {
    setIsProcessing(true);
    setImportSuccess(false);

    const sampleRows = [
      { name: 'THAYLA VITORIA FERNANDES MARTINS', birth: '2021-08-25', formatted: '25/08/2021', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'KAUÊ DE AQUINO GUEDES', birth: '2021-06-01', formatted: '01/06/2021', gender: 'M', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'REBECA SANTOS RODRIGUES', birth: '2020-04-15', formatted: '15/04/2020', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'SAMUEL SILVA SANTOS', birth: '2021-05-01', formatted: '01/05/2021', gender: 'M', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'THAYLLA EMANUELLY ALMEDIA DE SOUSA', birth: '2022-03-23', formatted: '23/03/2022', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'LARISSA MANOELA SOUSA LOBATO', birth: '2021-11-10', formatted: '10/11/2021', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'YASMIM ALVES REIS', birth: '2022-01-03', formatted: '03/01/2022', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'MARIA CECILIA MARTINS MORAIS', birth: '2021-07-12', formatted: '12/07/2021', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'ANA LARA BARROS ARAÚJO', birth: '2021-02-26', formatted: '26/02/2021', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'VALENTINA SANTOS DA SILVA', birth: '2021-03-19', formatted: '19/03/2021', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'MARIA JULIA PESSOA LOPES', birth: '2020-08-03', formatted: '03/08/2020', gender: 'F', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'THALISSON DE SOUSA SILVA', birth: '2020-12-16', formatted: '16/12/2020', gender: 'M', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'ENZO SAMUEL BATISTA OLIVEIRA', birth: '2022-05-12', formatted: '12/05/2022', gender: 'M', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'ÂNGELO MIGUEL ALVES LIMA', birth: '2022-04-22', formatted: '22/04/2022', gender: 'M', race: 'PARDO', addr: 'VILA: BRILHANTE', pcd: '', laudo: '' },
      { name: 'HELOISA BARROS DA SILVA', birth: '2020-06-05', formatted: '05/06/2020', gender: 'F', race: 'BRANCO', addr: 'VILA: BRILHNATE', pcd: '', laudo: '' },
    ];

    const currentSeries = filters.overrideSeriesWithDefault && filters.defaultSeries ? filters.defaultSeries : 'PRÉ II';

    const sampleStudents: ParsedImportStudent[] = sampleRows.map((r, idx) => ({
      tempId: `sample-${idx}`,
      sequenceNumber: String(idx + 1),
      name: r.name,
      birthDate: r.birth,
      formattedBirthDate: r.formatted,
      gender: r.gender as any,
      raceColor: (r.race === 'BRANCO' ? 'BRANCA' : 'PARDA') as any,
      address: r.addr,
      shift: filters.defaultShift || 'MANHÃ',
      series: currentSeries,
      seriesFromFirstCol: 'PRÉ II',
      medicalClassification: 'A Avaliar / PCD Não especificado',
      hasMedicalReport: false,
      medicalReportText: 'PENDENTE',
      schoolName: 'ESCOLA: MARIA DA PRAIA',
      cadastralStatus: 'INCOMPLETE',
      pendingFields: ['Avaliação de Laudo (SIM/NÃO)', 'CPF / Certidão de Nascimento'],
      sourceFileName: 'Exemplo_Escola_Maria_da_Praia.xlsx',
      rawRow: r,
    }));

    const sampleResult: FileImportResult = {
      fileName: 'Exemplo_Escola_Maria_da_Praia.xlsx',
      fileSize: 24500,
      schoolNameDetected: 'ESCOLA: MARIA DA PRAIA',
      seriesDetected: 'PRÉ II',
      firstColumnHeaderDetected: 'PRÉ II\nNº',
      seriesFromFirstColumn: 'PRÉ II',
      dateDetected: '01/09/2026',
      totalRows: sampleStudents.length,
      students: sampleStudents,
      completeCount: 0,
      incompleteCount: sampleStudents.length,
      errors: [],
    };

    setFileResults([sampleResult]);
    setActiveFileIndex(0);
    setIsProcessing(false);
  };

  // Atualiza os filtros e sincroniza dinamicamente com os alunos e arquivos já carregados no preview
  const handleUpdateFilters = (updater: (prev: ImportFilterOptions) => ImportFilterOptions) => {
    setFilters((prev) => {
      const next = updater(prev);
      setFileResults((existing) =>
        existing.map((res) => {
          const updatedStudents = res.students.map((s) => {
            let newSeries = s.series;
            if (next.overrideSeriesWithDefault && next.defaultSeries) {
              newSeries = next.defaultSeries;
            } else if (next.extractSeriesFromFirstColumn && (s.seriesFromFirstCol || res.seriesFromFirstColumn)) {
              newSeries = s.seriesFromFirstCol || res.seriesFromFirstColumn || next.defaultSeries || 'PRÉ II';
            } else if (res.seriesDetected) {
              newSeries = res.seriesDetected;
            } else if (next.defaultSeries) {
              newSeries = next.defaultSeries;
            }

            const updatedClass = classes.find(
              (c) =>
                c.name.toLowerCase().includes(newSeries.toLowerCase()) ||
                c.gradeLevel.toLowerCase().includes(newSeries.toLowerCase())
            );

            return {
              ...s,
              series: newSeries,
              shift: next.defaultShift || s.shift,
              className: updatedClass?.name || newSeries,
              classId: updatedClass?.id || s.classId,
            };
          });

          return {
            ...res,
            seriesDetected:
              next.overrideSeriesWithDefault && next.defaultSeries
                ? next.defaultSeries
                : res.seriesFromFirstColumn || res.seriesDetected || next.defaultSeries,
            students: updatedStudents,
          };
        })
      );
      return next;
    });
  };

  // Remove arquivo da lista
  const handleRemoveFile = (index: number) => {
    setFileResults((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activeFileIndex >= next.length) {
        setActiveFileIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Limpa todos os arquivos
  const handleClearAll = () => {
    setFileResults([]);
    setActiveFileIndex(0);
    setImportSuccess(false);
  };

  // Total de alunos em todos os arquivos carregados
  const allParsedStudents = fileResults.flatMap((r) => r.students);
  const totalIncompleteAcrossFiles = allParsedStudents.filter((s) => s.cadastralStatus !== 'OK').length;

  // Executa a importação oficial para o estado do sistema
  const handleConfirmImport = () => {
    if (allParsedStudents.length === 0) return;

    setIsProcessing(true);

    // Coleta as unidades escolares sugeridas e turmas sugeridas para cadastro automático
    const newSchoolUnits: SchoolUnit[] = [];
    const newClasses: SchoolClass[] = [];

    if (filters.autoRegisterSchoolUnit) {
      fileResults.forEach((fr) => {
        if (fr.suggestedSchoolUnit) {
          const exists = schoolUnits.some(
            (u) =>
              u.id === fr.suggestedSchoolUnit!.id ||
              u.name.toLowerCase().trim() === fr.suggestedSchoolUnit!.name.toLowerCase().trim()
          );
          if (!exists && !newSchoolUnits.some((u) => u.id === fr.suggestedSchoolUnit!.id)) {
            newSchoolUnits.push(fr.suggestedSchoolUnit);
          }
        }
        if (fr.suggestedClasses) {
          fr.suggestedClasses.forEach((cls) => {
            const clsExists =
              classes.some((c) => c.id === cls.id) ||
              newClasses.some((c) => c.id === cls.id);
            if (!clsExists) {
              newClasses.push(cls);
            }
          });
        }
      });
    }

    const primaryUnit = newSchoolUnits[0] || fileResults[0]?.suggestedSchoolUnit;

    const officialStudents = convertImportedStudentsToOfficial(
      allParsedStudents,
      filters,
      classes,
      studentsCount,
      primaryUnit,
      newClasses
    );

    onImportStudents(officialStudents, newSchoolUnits, newClasses);
    setImportedOfficialStudents(officialStudents);
    setImportedUnits(
      newSchoolUnits.length > 0
        ? newSchoolUnits
        : primaryUnit
        ? [primaryUnit]
        : []
    );

    const incompleteCount = officialStudents.filter((s) => s.cadastralStatus !== 'OK').length;
    setImportedStats({
      total: officialStudents.length,
      incomplete: incompleteCount,
    });
    setPostImportFilter(incompleteCount > 0 ? 'INCOMPLETE' : 'ALL');

    setIsProcessing(false);
    setImportSuccess(true);
  };

  // Salva alterações feitas em um aluno recém-importado para completar seu cadastro
  const handleSaveEditedStudent = (updatedStudent: Student) => {
    const nextList = importedOfficialStudents.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    setImportedOfficialStudents(nextList);

    const incompleteCount = nextList.filter((s) => s.cadastralStatus !== 'OK').length;
    setImportedStats({
      total: nextList.length,
      incomplete: incompleteCount,
    });

    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent);
    }
  };

  const activeResult = fileResults[activeFileIndex];

  // Filtro de alunos na tela pós-importação
  const filteredImportedStudents = importedOfficialStudents.filter((s) => {
    if (postImportFilter === 'INCOMPLETE' && s.cadastralStatus === 'OK') return false;
    if (postImportFilter === 'OK' && s.cadastralStatus !== 'OK') return false;
    if (postImportSearch.trim()) {
      const q = postImportSearch.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchRa = s.enrollmentNumber.toLowerCase().includes(q);
      const matchSchool = s.schoolOriginName?.toLowerCase().includes(q);
      if (!matchName && !matchRa && !matchSchool) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho do Modal */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileSpreadsheet className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Módulo Universal de Importação de Dados & Polos Remotos
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-bold rounded-md">
                  Multi-Formato (.xlsx, .xls, .csv, .json, .xml, .ods, .tsv)
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Importe planilhas de alunos e polos remotos (ex: Maria da Praia). Cadastros incompletos serão adicionados e destacados automaticamente na Dashbox de Pendências.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {importSuccess ? (
            <div className="space-y-6">
              {/* Header de Sucesso */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Importação Concluída com Sucesso!</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-md">
                        {importedStats.total} Integrados
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Você pode <strong>editar e preencher as informações faltantes</strong> dos alunos agora mesmo abaixo para deixar os cadastros 100% completos e regularizados para o Censo Escolar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onNavigateToPendencias && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToPendencias();
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Dashbox de Pendências</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Concluir e Ver Alunos</span>
                  </button>
                </div>
              </div>

              {/* Card de Unidades Escolares e Séries Cadastradas Automaticamente */}
              {importedUnits.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-amber-50/80 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>Unidade Escolar & Séries Cadastradas com Sucesso</span>
                          <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold rounded-md">
                            Cadastro Pendente de Regularização
                          </span>
                        </h4>
                        <p className="text-xs text-slate-600">
                          A escola e as séries atendidas foram registradas e vinculadas aos estudantes.
                        </p>
                      </div>
                    </div>

                    {onNavigateToSchoolUnits && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToSchoolUnits();
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-indigo-300 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Completar Dados da Escola na Secretaria</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {importedUnits.map((u) => (
                      <div key={u.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{u.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">INEP: {u.inepCode}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-600 mr-1">Séries que Atende:</span>
                          {u.gradesServed && u.gradesServed.length > 0 ? (
                            u.gradesServed.map((g, gIdx) => (
                              <span
                                key={gIdx}
                                className="px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded font-semibold text-[10px]"
                              >
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              {u.gradesServedText || 'Séries Gerais'}
                            </span>
                          )}
                        </div>
                        {u.pendingFields && u.pendingFields.length > 0 && (
                          <p className="text-[10px] text-amber-700 font-medium">
                            ⚠️ Pendências da Escola: {u.pendingFields.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards Métricos e Filtros Rápidos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Incompletos */}
                <button
                  type="button"
                  onClick={() => setPostImportFilter('INCOMPLETE')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    postImportFilter === 'INCOMPLETE'
                      ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Cadastros com Pendências
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 font-extrabold text-xs rounded-md">
                      {importedStats.incomplete}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    {importedStats.incomplete > 0
                      ? 'Clique para editar e completar as informações que faltam.'
                      : 'Nenhuma pendência! Todos os cadastros completos.'}
                  </p>
                </button>

                {/* Completos */}
                <button
                  type="button"
                  onClick={() => setPostImportFilter('OK')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    postImportFilter === 'OK'
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Cadastros 100% Completos
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 font-extrabold text-xs rounded-md">
                      {importedStats.total - importedStats.incomplete}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Cadastros com documentação básica e dados em conformidade.
                  </p>
                </button>

                {/* Todos */}
                <button
                  type="button"
                  onClick={() => setPostImportFilter('ALL')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    postImportFilter === 'ALL'
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-2 ring-indigo-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      Todos os Importados
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-200/70 text-indigo-900 font-extrabold text-xs rounded-md">
                      {importedStats.total}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    Visualização geral de todos os estudantes importados.
                  </p>
                </button>
              </div>

              {/* Barra de Busca e Filtros */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={postImportSearch}
                    onChange={(e) => setPostImportSearch(e.target.value)}
                    placeholder="Buscar por nome, RA ou escola..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                  />
                  {postImportSearch && (
                    <button
                      onClick={() => setPostImportSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Exibindo <strong>{filteredImportedStudents.length}</strong> de{' '}
                  <strong>{importedStats.total}</strong> cadastros
                </div>
              </div>

              {/* Tabela dos Alunos Recém-Importados com Ação de Edição */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Aluno / Matrícula</th>
                        <th className="p-3">Turma / Turno</th>
                        <th className="p-3">Situação & Informações Faltantes</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredImportedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500 text-xs">
                            Nenhum cadastro encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredImportedStudents.map((std, idx) => {
                          const matchedClass = classes.find((c) => c.id === std.classId);
                          const isOk = std.cadastralStatus === 'OK';
                          const hasPendingCpf = !std.cpf || std.cpf === '000.000.000-00';
                          const hasPendingBirth = !std.birthDate || std.birthDate === '2020-01-01';
                          const hasPendingGuardian = !std.guardianName || std.guardianName.includes('Pendente');
                          const hasPendingAddress = !std.address || std.address.toLowerCase().includes('pendente');
                          const hasPendingLaudo =
                            std.medicalClassification &&
                            std.medicalClassification !== 'Não declarada' &&
                            std.medicalClassification !== 'NENHUMA' &&
                            !std.hasMedicalReport;

                          return (
                            <tr
                              key={std.id || idx}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                !isOk ? 'bg-amber-50/20' : ''
                              }`}
                            >
                              {/* Aluno */}
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isOk
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                  >
                                    {std.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 leading-tight">
                                      {std.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                      <span className="font-mono">{std.enrollmentNumber}</span>
                                      {std.schoolOriginName && (
                                        <span className="text-slate-400">
                                          • {std.schoolOriginName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Turma / Turno */}
                              <td className="p-3">
                                <div className="text-slate-800 font-medium">
                                  {matchedClass?.name || std.series || 'Turma Padrão'}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Turno: {std.shift || matchedClass?.shift || 'Manhã'}
                                </div>
                              </td>

                              {/* Situação & Informações Faltantes */}
                              <td className="p-3">
                                {isOk ? (
                                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span>Cadastro Completo</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[11px]">
                                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                                      <span>Incompleto ({std.pendingFields?.length || 1} pendências)</span>
                                    </div>

                                    {/* Badges dos campos específicos que estão faltando */}
                                    <div className="flex flex-wrap gap-1">
                                      {hasPendingCpf && (
                                        <span className="px-1.5 py-0.2 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold rounded">
                                          Falta CPF
                                        </span>
                                      )}
                                      {hasPendingGuardian && (
                                        <span className="px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold rounded">
                                          Falta Nome da Mãe
                                        </span>
                                      )}
                                      {hasPendingBirth && (
                                        <span className="px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold rounded">
                                          Falta Data Nasc.
                                        </span>
                                      )}
                                      {hasPendingAddress && (
                                        <span className="px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold rounded">
                                          Falta Endereço
                                        </span>
                                      )}
                                      {hasPendingLaudo && (
                                        <span className="px-1.5 py-0.2 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold rounded">
                                          Falta Laudo PCD ({std.medicalClassification})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Ação: Botão para Editar e Completar */}
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setEditingStudent(std)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                    !isOk
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  }`}
                                  title="Clique para editar este cadastro e preencher as informações que estão faltando"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>{!isOk ? 'Completar Cadastro' : 'Editar'}</span>
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

              {/* Botões do Rodapé de Pós-Importação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  Cadastros completados são salvos instantaneamente no banco de dados e refletidos no Censo Escolar.
                </div>
                <div className="flex items-center gap-2">
                  {onNavigateToPendencias && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToPendencias();
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Ir para Dashbox de Pendências</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>Concluir e Ver Lista de Alunos</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Seção 1: Área de Upload & Ações Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dropzone / Upload Múltiplos Arquivos com Botão Dedicado e Suporte Robusto */}
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileSelector}
                  className={`md:col-span-2 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative ${
                    isDraggingOver
                      ? 'border-indigo-600 bg-indigo-100/80 ring-4 ring-indigo-400/30 scale-[1.01]'
                      : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.csv,.txt,.tsv,.json,.xml,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,application/json,text/xml"
                    onChange={(e) => handleFilesSelect(e.target.files)}
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    className="hidden"
                  />

                  <div className="flex items-center justify-center gap-3">
                    <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-100">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">
                        {isDraggingOver ? 'Solte os arquivos aqui para importar' : 'Importação Direta de Planilhas e Arquivos'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Arraste para cá ou clique no botão abaixo para escolher do seu computador
                      </p>
                    </div>
                  </div>

                  {/* Botão Dedicado de Alta Visibilidade */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={openFileSelector}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4 text-indigo-200" />
                      <span>Procurar Arquivo no Computador...</span>
                    </button>
                  </div>

                  {/* Badges de Formatos Aceitos */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Formatos aceitos:</span>
                    {['.XLSX', '.XLS', '.CSV', '.ODS', '.JSON', '.XML', '.TXT', '.TSV'].map((fmt) => (
                      <span
                        key={fmt}
                        className="px-1.5 py-0.5 bg-white border border-indigo-100 text-indigo-700 font-mono text-[10px] font-bold rounded-md shadow-2xs"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>

                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-indigo-700">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Processando planilha e identificando alunos...</span>
                    </div>
                  )}
                </div>

                {/* Modelos e Pré-configurações */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Planilha Modelo & Demonstração
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Layout oficial com cabeçalho de Escola, Turma e Perfil de Alunos por Turma.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleLoadSampleMariaDaPraia}
                      className="w-full py-2 px-3 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Carregar Exemplo Maria da Praia</span>
                    </button>

                    <button
                      onClick={generateOfficialTemplateXlsx}
                      className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Baixar Modelo Oficial (.XLSX)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção 2: Painel Configurável de Importação (Série da 1ª Coluna & Filtros de Informações) */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-4">
                {/* Bloco A: Configuração Especial da Série & 1ª Coluna */}
                <div className="bg-white border border-indigo-100 rounded-xl p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-600" />
                      Regras de Série / Etapa Cursada & 1ª Coluna da Planilha
                    </span>
                    <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      Conforme padrão oficial (ex: "PRÉ II Nº")
                    </span>
                  </div>

                  <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex items-start gap-3">
                    <input
                      id="checkbox-first-col-series"
                      type="checkbox"
                      checked={filters.extractSeriesFromFirstColumn}
                      onChange={(e) =>
                        handleUpdateFilters((f) => ({
                          ...f,
                          extractSeriesFromFirstColumn: e.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="checkbox-first-col-series" className="cursor-pointer text-xs text-slate-800 space-y-0.5">
                      <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <span>Importar Série a partir da 1ª Coluna (ex: "PRÉ II Nº")</span>
                        <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded text-[10px] font-extrabold">
                          Ativo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Lê automaticamente a etapa escolar contida no cabeçalho ou nas células da primeira coluna (ex: <code className="bg-white px-1 rounded text-indigo-700 font-bold border border-indigo-200">PRÉ II Nº</code>, <code className="bg-white px-1 rounded text-indigo-700 font-bold border border-indigo-200">1º ANO</code>) e preenche a série de todos os alunos importados daquela turma.
                      </p>
                    </label>
                  </div>

                  {/* Configurações Complementares de Série e Turno */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Série / Etapa Padrão (Fallback):
                      </label>
                      <select
                        value={filters.defaultSeries || 'PRÉ II'}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            defaultSeries: e.target.value,
                          }))
                        }
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="PRÉ II">PRÉ II (Educação Infantil)</option>
                        <option value="PRÉ I">PRÉ I (Educação Infantil)</option>
                        <option value="CRECHE">CRECHE</option>
                        <option value="MATERNAL I">MATERNAL I</option>
                        <option value="MATERNAL II">MATERNAL II</option>
                        <option value="BERÇÁRIO I">BERÇÁRIO I</option>
                        <option value="BERÇÁRIO II">BERÇÁRIO II</option>
                        <option value="1º ANO">1º ANO (Ensino Fundamental)</option>
                        <option value="2º ANO">2º ANO</option>
                        <option value="3º ANO">3º ANO</option>
                        <option value="4º ANO">4º ANO</option>
                        <option value="5º ANO">5º ANO</option>
                        <option value="6º ANO">6º ANO</option>
                        <option value="7º ANO">7º ANO</option>
                        <option value="8º ANO">8º ANO</option>
                        <option value="9º ANO">9º ANO</option>
                        <option value="MULTISSERIADA">MULTISSERIADA</option>
                        <option value="EJA">EJA (Educação Jovens/Adultos)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Turno Escolar Padrão:
                      </label>
                      <select
                        value={filters.defaultShift || 'MANHÃ'}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            defaultShift: e.target.value as ClassShift,
                          }))
                        }
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="MANHÃ">MANHÃ</option>
                        <option value="TARDE">TARDE</option>
                        <option value="INTEGRAL">INTEGRAL</option>
                        <option value="NOITE">NOITE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Escola / Polo de Destino:
                      </label>
                      <select
                        value={filters.selectedSchoolUnitId || ''}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            selectedSchoolUnitId: e.target.value,
                          }))
                        }
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Detectar da Planilha (ou Polo Padrão)</option>
                        {schoolUnits.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold text-slate-700 hover:bg-slate-100 w-full mt-3 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={filters.overrideSeriesWithDefault}
                          onChange={(e) =>
                            handleUpdateFilters((f) => ({
                              ...f,
                              overrideSeriesWithDefault: e.target.checked,
                            }))
                          }
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] text-slate-800">
                          Forçar esta série para todos os alunos
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bloco B: Filtros de Seleção dos Campos da Planilha */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                      Filtros de Campos: Selecione as informações que deseja importar
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            importName: true,
                            importBirthDate: true,
                            importGender: true,
                            importRaceColor: true,
                            importAddress: true,
                            importShift: true,
                            importSeries: true,
                            importMedicalClassification: true,
                            importMedicalReport: true,
                            importSchoolUnit: true,
                          }))
                        }
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Marcar Todos (Censo Completo)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            importName: true,
                            importBirthDate: false,
                            importGender: false,
                            importRaceColor: false,
                            importAddress: false,
                            importShift: false,
                            importSeries: true,
                            importMedicalClassification: false,
                            importMedicalReport: false,
                            importSchoolUnit: false,
                          }))
                        }
                        className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                      >
                        Apenas Nome + Série
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            importName: false,
                            importBirthDate: false,
                            importGender: false,
                            importRaceColor: false,
                            importAddress: false,
                            importShift: false,
                            importSeries: false,
                            importMedicalClassification: false,
                            importMedicalReport: false,
                            importSchoolUnit: false,
                          }))
                        }
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {/* Nome Completo */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importName
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importName}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importName: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Nome Completo</span>
                    </label>

                    {/* Série / Etapa Cursada */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importSeries
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-2xs ring-1 ring-indigo-200'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importSeries}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importSeries: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="flex items-center gap-1 font-bold">
                        <span>Série / Etapa</span>
                        <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1 rounded font-extrabold">
                          1ª Col
                        </span>
                      </span>
                    </label>

                    {/* Data de Nascimento */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importBirthDate
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importBirthDate}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importBirthDate: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Data de Nascimento</span>
                    </label>

                    {/* Sexo / Gênero */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importGender
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importGender}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importGender: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Sexo / Gênero</span>
                    </label>

                    {/* Raça / Cor */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importRaceColor
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importRaceColor}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importRaceColor: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Raça / Cor (Censo)</span>
                    </label>

                    {/* Endereço / Localidade */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importAddress
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importAddress}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importAddress: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Endereço / Vila</span>
                    </label>

                    {/* Turno Escolar */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importShift
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importShift}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importShift: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Turno Escolar</span>
                    </label>

                    {/* Classificação Médica / PCD */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importMedicalClassification
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importMedicalClassification}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({
                            ...f,
                            importMedicalClassification: e.target.checked,
                          }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>PCD / Condição Médica</span>
                    </label>

                    {/* Laudo Médico */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importMedicalReport
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importMedicalReport}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importMedicalReport: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Laudo (SIM/NÃO)</span>
                    </label>

                    {/* Nome da Escola / Polo */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.importSchoolUnit
                          ? 'bg-white border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.importSchoolUnit}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, importSchoolUnit: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Escola / Polo Origem</span>
                    </label>

                    {/* Cadastrar Unidade Escolar & Séries Atendidas */}
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        filters.autoRegisterSchoolUnit
                          ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950 shadow-2xs ring-1 ring-indigo-300'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.autoRegisterSchoolUnit}
                        onChange={(e) =>
                          handleUpdateFilters((f) => ({ ...f, autoRegisterSchoolUnit: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <Building2 className="h-3.5 w-3.5 text-indigo-700" />
                      <span>Cadastrar Unidade & Séries (Pendente)</span>
                    </label>
                  </div>

                  {/* Informação sobre o Cadastro da Unidade Escolar e Séries Atendidas */}
                  {filters.autoRegisterSchoolUnit && (
                    <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950">
                      <Building2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          Cadastro Automático da Unidade Escolar & Séries Atendidas
                        </p>
                        <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                          O sistema detecta a escola e a relação de séries no cabeçalho (ex: <em>"ESCOLA: MARIA DA PRAIA - TURMAS: PRÉ II – 1º AO 5º - 6º AO 9º"</em>), cadastra a unidade escolar com as turmas atendidas e vincula os alunos. O cadastro da escola fica com status <strong>Pendente de Informações Complementares</strong> para preenchimento posterior pelo secretário/diretor.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 3: Lista de Arquivos Carregados & Pré-Visualização */}
              {fileResults.length > 0 && (
                <div className="space-y-4">
                  {/* Abas dos arquivos carregados */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {fileResults.map((res, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveFileIndex(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            activeFileIndex === idx
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span className="max-w-[150px] truncate">{res.fileName}</span>
                          <span className="px-1.5 py-0.2 bg-black/20 rounded-md text-[10px]">
                            {res.totalRows}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx);
                            }}
                            className="hover:text-rose-200 ml-1 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleClearAll}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Limpar Todos</span>
                    </button>
                  </div>

                  {/* Detalhes do Arquivo Ativo */}
                  {activeResult && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {activeResult.schoolNameDetected || 'Escola / Polo Remoto'}
                            </span>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>Turmas: <strong>{activeResult.seriesDetected || 'Geral'}</strong></span>
                              <span>•</span>
                              <span>Data: {activeResult.dateDetected || 'Atual'}</span>
                              {activeResult.firstColumnHeaderDetected && (
                                <>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-800 font-bold text-[10px] flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3 text-indigo-600" />
                                    1ª Coluna: "{activeResult.firstColumnHeaderDetected.replace(/\r?\n/g, ' ')}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg">
                            Total: {activeResult.totalRows} alunos
                          </span>
                          {activeResult.incompleteCount > 0 && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                              <span>{activeResult.incompleteCount} com pendências de cadastro</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unidade Escolar & Séries Atendidas que serão cadastradas */}
                      {activeResult.suggestedSchoolUnit && (
                        <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-amber-50/80 border border-indigo-200/80 rounded-xl space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-indigo-700" />
                              <span className="text-xs font-extrabold text-indigo-950">
                                Unidade Escolar:{' '}
                                <span className="underline decoration-indigo-400">
                                  {activeResult.suggestedSchoolUnit.name}
                                </span>
                              </span>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Cadastro da Escola: Pendente de Complementação
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-700 mr-1">
                              Séries que a Escola Atende:
                            </span>
                            {activeResult.expandedGradesDetected && activeResult.expandedGradesDetected.length > 0 ? (
                              activeResult.expandedGradesDetected.map((serie, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 bg-white border border-indigo-300 text-indigo-900 rounded-md font-bold text-[10px] shadow-2xs"
                                >
                                  {serie}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-500">
                                {activeResult.seriesDetected || 'Geral'}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="font-semibold text-slate-600">
                              Pendências a regularizar da Unidade Escolar:
                            </span>
                            {activeResult.suggestedSchoolUnit.pendingFields?.map((f, pIdx) => (
                              <span key={pIdx} className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                                • {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tabela de Pré-visualização com Coluna da Série */}
                      <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-64">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                            <tr>
                              <th className="p-2.5">Nº</th>
                              <th className="p-2.5">Nome Completo do Aluno</th>
                              <th className="p-2.5">Série Cursada (1ª Col)</th>
                              <th className="p-2.5">Nascimento</th>
                              <th className="p-2.5">Sexo</th>
                              <th className="p-2.5">Raça/Cor</th>
                              <th className="p-2.5">Endereço</th>
                              <th className="p-2.5">PCD / Condição</th>
                              <th className="p-2.5">Laudo</th>
                              <th className="p-2.5">Status Cadastro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeResult.students.slice(0, 30).map((std, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-mono text-slate-500">{std.sequenceNumber}</td>
                                <td className="p-2.5 font-bold text-slate-900">
                                  {filters.importName ? (
                                    std.name
                                  ) : (
                                    <span className="text-slate-400 italic">Aluno Importado (Filtro)</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  {filters.importSeries ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-bold text-[11px]">
                                      <GraduationCap className="h-3 w-3 text-indigo-600" />
                                      {std.series}
                                      {std.seriesFromFirstCol && (
                                        <span className="text-[9px] font-normal text-indigo-700">
                                          (1ª col)
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">
                                      (Não importar)
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {filters.importBirthDate ? (
                                    std.formattedBirthDate
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Ignorado)</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {filters.importGender ? (
                                    std.gender
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Ignorado)</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {filters.importRaceColor ? (
                                    std.raceColor
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Ignorado)</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600 max-w-[150px] truncate">
                                  {filters.importAddress ? (
                                    std.address
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Ignorado)</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {filters.importMedicalClassification ? (
                                    std.medicalClassification
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Ignorado)</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  {filters.importMedicalReport ? (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        std.hasMedicalReport
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {std.medicalReportText}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Ignorado)</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  {std.cadastralStatus === 'OK' ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                                      Regular
                                    </span>
                                  ) : (
                                    <span
                                      className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit"
                                      title={`Pendências: ${std.pendingFields.join(', ')}`}
                                    >
                                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                                      <span>Incompleto ({std.pendingFields.length})</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Informação sobre os cadastros incompletos */}
                  {totalIncompleteAcrossFiles > 0 && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900">
                        <strong className="font-bold">Garantia de Matrícula & Censo dos Polos: </strong>
                        Todos os <strong>{totalIncompleteAcrossFiles} cadastros incompletos</strong> serão adicionados normalmente para assegurar a matrícula e diário de classe. Eles ficarão em destaque na <strong>Dashbox de Pendências de Dados Cadastrais dos Polos Remotos & Censo</strong> para que a Secretaria providencie a documentação necessária.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé com Ações */}
        {!importSuccess && (
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">
                Total para Importar: <strong>{allParsedStudents.length} alunos</strong>
              </span>

              <button
                disabled={allParsedStudents.length === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processando Importação...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirmar e Importar {allParsedStudents.length} Alunos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dedicado para Completar e Editar Cadastros de Alunos Importados */}
      <StudentQuickEditModal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        classes={classes}
        schoolUnits={schoolUnits}
        onSave={handleSaveEditedStudent}
      />
    </div>
  );
};
