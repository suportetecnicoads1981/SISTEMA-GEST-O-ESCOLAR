import React, { useState, useMemo } from 'react';
import { isCpfPending } from '../../utils/studentDocuments';
import {
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Printer,
  Download,
  Edit2,
  Building2,
  Calendar,
  HeartPulse,
  FileCheck,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  FileWarning,
} from 'lucide-react';
import { Student, SchoolUnit, SchoolClass } from '../../types';
import { triggerPrint } from '../../utils/printHelper';

interface CadastralPendingCensusDashboxProps {
  students: Student[];
  schoolUnits?: SchoolUnit[];
  classes?: SchoolClass[];
  onEditStudent?: (student: Student) => void;
  onOpenImportModal?: () => void;
  onNavigateToSecretaria?: () => void;
}

export const CadastralPendingCensusDashbox: React.FC<CadastralPendingCensusDashboxProps> = ({
  students,
  schoolUnits = [],
  classes = [],
  onEditStudent,
  onOpenImportModal,
  onNavigateToSecretaria,
}) => {
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedPendingType, setSelectedPendingType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Identificar alunos com cadastros incompletos ou pendências
  const incompleteStudents = useMemo(() => {
    return students.filter((s) => {
      const isStatusIncomplete =
        s.cadastralStatus === 'INCOMPLETE' ||
        s.cadastralStatus === 'PENDING_DOCS' ||
        s.cadastralStatus === 'NEEDS_UPDATE';

      const hasPendingFields = (s.pendingFields && s.pendingFields.length > 0);
      // Sem CPF ou com CPF inválido: continua pendente até ser corrigido.
      const isMissingCpf = isCpfPending(s.cpf);
      const isMissingBirth = !s.birthDate || s.birthDate === '2020-01-01' || s.birthDate === '2012-01-01';
      const isMissingAddress = !s.address || s.address.toLowerCase().includes('pendente');
      const hasMedicalPending =
        s.medicalClassification &&
        s.medicalClassification !== 'Não declarada' &&
        !s.hasMedicalReport;

      return isStatusIncomplete || hasPendingFields || isMissingCpf || hasMedicalPending;
    });
  }, [students]);

  // Lista única de escolas/polos encontrados nos cadastros com pendência
  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    incompleteStudents.forEach((s) => {
      if (s.schoolOriginName) set.add(s.schoolOriginName);
      else if (s.schoolUnitId) {
        const u = schoolUnits.find((unit) => unit.id === s.schoolUnitId);
        if (u) set.add(u.name);
      }
    });
    return Array.from(set);
  }, [incompleteStudents, schoolUnits]);

  // Filtros aplicados
  const filteredList = useMemo(() => {
    return incompleteStudents.filter((s) => {
      // Filtro de Polo / Escola
      if (selectedSchool !== 'ALL') {
        const studentSchool = s.schoolOriginName || schoolUnits.find((u) => u.id === s.schoolUnitId)?.name;
        if (studentSchool !== selectedSchool) return false;
      }

      // Filtro de Tipo de Pendência
      if (selectedPendingType === 'LAUDO') {
        const hasLaudoPending =
          (s.medicalClassification && !s.hasMedicalReport) ||
          s.pendingFields?.some((f) => f.toLowerCase().includes('laudo'));
        if (!hasLaudoPending) return false;
      } else if (selectedPendingType === 'BIRTH') {
        const hasBirthPending =
          !s.birthDate ||
          s.birthDate === '2020-01-01' ||
          s.pendingFields?.some((f) => f.toLowerCase().includes('nascimento'));
        if (!hasBirthPending) return false;
      } else if (selectedPendingType === 'ADDRESS') {
        const hasAddressPending =
          !s.address ||
          s.address.toLowerCase().includes('pendente') ||
          s.pendingFields?.some((f) => f.toLowerCase().includes('endereço') || f.toLowerCase().includes('endereco'));
        if (!hasAddressPending) return false;
      } else if (selectedPendingType === 'CPF') {
        const hasCpfPending = isCpfPending(s.cpf);
        if (!hasCpfPending) return false;
      }

      // Busca por nome do aluno
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(term);
        const matchesRa = s.enrollmentNumber.toLowerCase().includes(term);
        const matchesSchool = (s.schoolOriginName || '').toLowerCase().includes(term);
        if (!matchesName && !matchesRa && !matchesSchool) return false;
      }

      return true;
    });
  }, [incompleteStudents, selectedSchool, selectedPendingType, searchTerm, schoolUnits]);

  // Métricas agregadas
  const stats = useMemo(() => {
    const totalIncomplete = incompleteStudents.length;
    const missingLaudoCount = incompleteStudents.filter(
      (s) =>
        (s.medicalClassification && s.medicalClassification !== 'Não declarada' && !s.hasMedicalReport) ||
        s.pendingFields?.some((f) => f.toLowerCase().includes('laudo'))
    ).length;
    const missingBirthCount = incompleteStudents.filter(
      (s) =>
        !s.birthDate ||
        s.birthDate === '2020-01-01' ||
        s.pendingFields?.some((f) => f.toLowerCase().includes('nascimento'))
    ).length;
    const missingAddressCount = incompleteStudents.filter(
      (s) =>
        !s.address ||
        s.address.toLowerCase().includes('pendente') ||
        s.pendingFields?.some((f) => f.toLowerCase().includes('endereço') || f.toLowerCase().includes('endereco'))
    ).length;
    const totalPolos = schoolOptions.length || (schoolUnits.length > 0 ? schoolUnits.length : 1);

    return {
      totalIncomplete,
      missingLaudoCount,
      missingBirthCount,
      missingAddressCount,
      totalPolos,
    };
  }, [incompleteStudents, schoolOptions, schoolUnits]);

  // Função para imprimir relatório oficial das pendências para a Secretaria
  const handlePrintPendingReport = () => {
    const printableContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; color: #0f172a;">SUCESSOEDU - GESTÃO EDUCACIONAL</h2>
          <h3 style="margin: 4px 0 0 0; font-size: 14px; color: #b45309;">LEVANTAMENTO DE PENDÊNCIAS CADASTRAIS DE POLOS REMOTOS & CENSO ESCOLAR</h3>
          <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
            Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} | Total de Cadastros com Pendência: ${filteredList.length}
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Nº / RA</th>
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Aluno(a)</th>
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Polo / Escola</th>
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Série / Turno</th>
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Classificação Médica / PCD</th>
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Laudo</th>
              <th style="padding: 6px; border: 1px solid #e2e8f0;">Campos Pendentes para Regularização</th>
            </tr>
          </thead>
          <tbody>
            ${filteredList
              .map((s, idx) => {
                const pendings =
                  s.pendingFields && s.pendingFields.length > 0
                    ? s.pendingFields.join(', ')
                    : 'CPF, Documento Civil, Laudo';
                const school = s.schoolOriginName || 'Polo Remoto';
                return `
                <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#fcfcfd'};">
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${s.enrollmentNumber}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">${s.name}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${school}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${s.series || 'PRÉ II'} (${s.shift || 'MANHÃ'})</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${s.medicalClassification || 'A Avaliar'}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${s.hasMedicalReport ? 'SIM' : 'NÃO / PENDENTE'}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; color: #b45309;">${pendings}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
        <div style="margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          * Documento gerado para controle e regularização cadastral junto à Secretaria Municipal de Educação.
        </div>
      </div>
    `;
    triggerPrint(printableContent);
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'Matrícula/RA',
      'Nome do Aluno',
      'Polo/Escola',
      'Série/Turma',
      'Turno',
      'Data de Nascimento',
      'Classificação Médica/PCD',
      'Tem Laudo',
      'Pendências Cadastrais',
    ];

    const rows = filteredList.map((s) => [
      `"${s.enrollmentNumber}"`,
      `"${s.name}"`,
      `"${s.schoolOriginName || 'Polo Remoto'}"`,
      `"${s.series || 'PRÉ II'}"`,
      `"${s.shift || 'MANHÃ'}"`,
      `"${s.birthDate || ''}"`,
      `"${s.medicalClassification || ''}"`,
      `"${s.hasMedicalReport ? 'SIM' : 'NÃO/PENDENTE'}"`,
      `"${(s.pendingFields || []).join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pendencias_Cadastrais_Polos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden space-y-4">
      {/* Header em Destaque */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-white/20 backdrop-blur-xs rounded-xl text-white shadow-inner">
            <AlertTriangle className="h-6 w-6 text-amber-100 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-900/40 text-amber-100 text-[10px] font-bold rounded-md uppercase tracking-wider">
                Polos Remotos & Censo Escolar
              </span>
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-md">
                {stats.totalIncomplete} Registros com Pendência
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1">
              Dashbox de Pendências de Dados Cadastrais dos Polos Remotos & Censo
            </h2>
            <p className="text-xs text-amber-100/90 max-w-2xl mt-0.5">
              Alunos importados de planilhas de polos remotos (ex: Maria da Praia) incluídos no sistema com vagas garantidas. A Secretaria deve coletar os documentos pendentes antes do fechamento do Censo Escolar.
            </p>
          </div>
        </div>

        {/* Botões de Ação Rápida no Cabeçalho */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="px-3 py-2 bg-white text-amber-800 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-amber-600" />
              <span>Importar Mais Planilhas</span>
            </button>
          )}

          <button
            onClick={handlePrintPendingReport}
            className="px-3 py-2 bg-amber-800/80 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Guia de Cobrança</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-amber-800/80 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores Rápidos */}
      <div className="px-5 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Total Pendentes</span>
              <FileWarning className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900 mt-1">{stats.totalIncomplete}</p>
            <span className="text-[11px] text-amber-700 font-medium">Requerem ação da Secretaria</span>
          </div>

          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Sem Laudo PCD</span>
              <HeartPulse className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-900 mt-1">{stats.missingLaudoCount}</p>
            <span className="text-[11px] text-rose-700 font-medium">Marcados como a avaliar</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Sem Data Nasc.</span>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-900 mt-1">{stats.missingBirthCount}</p>
            <span className="text-[11px] text-blue-700 font-medium">Data padrão temporária</span>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">Polos Afetados</span>
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-900 mt-1">{stats.totalPolos}</p>
            <span className="text-[11px] text-purple-700 font-medium">Escolas com pendências</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="px-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno pendente por nome, matrícula ou escola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filtro por Polo */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
            >
              <option value="ALL">Todos os Polos ({incompleteStudents.length})</option>
              {schoolOptions.map((school) => {
                const count = incompleteStudents.filter(
                  (s) => (s.schoolOriginName || schoolUnits.find((u) => u.id === s.schoolUnitId)?.name) === school
                ).length;
                return (
                  <option key={school} value={school}>
                    {school} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filtro por Tipo de Pendência */}
          <select
            value={selectedPendingType}
            onChange={(e) => setSelectedPendingType(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
          >
            <option value="ALL">Todas as Pendências</option>
            <option value="LAUDO">Sem Laudo PCD ({stats.missingLaudoCount})</option>
            <option value="BIRTH">Sem Data de Nascimento ({stats.missingBirthCount})</option>
            <option value="ADDRESS">Sem Endereço Completo ({stats.missingAddressCount})</option>
            <option value="CPF">Sem CPF ou CPF inválido</option>
          </select>
        </div>
      </div>

      {/* Lista de Registros com Pendência */}
      <div className="px-5 pb-5">
        {filteredList.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Nenhuma pendência cadastral encontrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Todos os alunos desta seleção estão com os dados essenciais para o Censo Escolar e Secretaria devidamente preenchidos.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3">Aluno / Matrícula</th>
                  <th className="p-3">Polo / Unidade Escolar</th>
                  <th className="p-3">Série & Turno</th>
                  <th className="p-3">Classificação Médica & Laudo</th>
                  <th className="p-3">Pendências Detectadas</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredList.slice(0, 50).map((student) => {
                  const schoolName = student.schoolOriginName || schoolUnits.find((u) => u.id === student.schoolUnitId)?.name || 'Polo Remoto';
                  return (
                    <tr key={student.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{student.enrollmentNumber}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{schoolName}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                          {student.series || 'PRÉ II'}
                        </span>
                        <span className="ml-1 text-[11px] text-slate-500">({student.shift || 'MANHÃ'})</span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-700">
                            <strong>PCD:</strong> {student.medicalClassification || 'A Avaliar'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold w-fit ${
                              student.hasMedicalReport
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Laudo: {student.hasMedicalReport ? 'SIM' : student.medicalReportText || 'PENDENTE'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(student.pendingFields && student.pendingFields.length > 0
                            ? student.pendingFields
                            : ['CPF', 'Certidão']
                          ).map((field, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[10px] font-bold"
                            >
                              Falta: {field}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onEditStudent && (
                            <button
                              onClick={() => onEditStudent(student)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Completar dados deste aluno agora"
                            >
                              <Edit2 className="h-3 w-3 text-amber-700" />
                              <span>Completar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredList.length > 50 && (
              <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-200">
                Mostrando 50 de {filteredList.length} cadastros pendentes. Filtre por escola ou utilize a busca para refinar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
