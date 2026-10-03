import React, { useState, useMemo, useEffect } from 'react';
import { isCpfPending, hasCadastralPending } from '../../utils/studentDocuments';
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
import { annexesOf, chosenAnnexIds } from '../../utils/schoolAnnexes';
import { AnnexPicker } from '../secretaria/AnnexPicker';

/** Valor do filtro para alunos ainda sem escola definida no cadastro. */
const NO_SCHOOL = '__SEM_ESCOLA__';

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

interface CadastralPendingCensusDashboxProps {
  students: Student[];
  schoolUnits?: SchoolUnit[];
  classes?: SchoolClass[];
  onEditStudent?: (student: Student) => void;
  onOpenImportModal?: () => void;
  onNavigateToSecretaria?: () => void;
  /**
   * Escola de lotação do usuário. Lotado numa escola: o quadro fica preso à escola dele
   * (e às anexas, se for a sede). Sem lotação (Sede/rede): o usuário escolhe a escola.
   */
  scopeUnitId?: string | null;
}

export const CadastralPendingCensusDashbox: React.FC<CadastralPendingCensusDashboxProps> = ({
  students,
  schoolUnits = [],
  classes = [],
  onEditStudent,
  onOpenImportModal,
  onNavigateToSecretaria,
  scopeUnitId = null,
}) => {
  // Lotado: começa (e fica) na escola dele. Rede: começa em "Todas as escolas".
  const [selectedSchool, setSelectedSchool] = useState<string>(scopeUnitId || 'ALL');
  const [annexChoice, setAnnexChoice] = useState<string[]>([]);
  useEffect(() => {
    setSelectedSchool(scopeUnitId || 'ALL');
    setAnnexChoice([]);
  }, [scopeUnitId]);
  const [selectedPendingType, setSelectedPendingType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Identificar alunos com cadastros incompletos ou pendências
  // Mesma regra do botão "Pendências Censo" de Secretaria & Alunos (hasCadastralPending).
  const incompleteStudents = useMemo(() => students.filter((s) => hasCadastralPending(s)), [students]);

  // Escola do aluno: a do cadastro; sem ela, a da turma.
  const unitIdOf = (s: Student): string =>
    String(s.schoolUnitId || classes.find((c) => c.id === s.classId)?.schoolUnitId || '').trim();
  const unitById = (id: string) => schoolUnits.find((u) => u.id === id);
  // Dados reais de cada aluno (sem valores de exemplo quando faltam).
  const schoolOf = (s: Student) => unitById(unitIdOf(s))?.name || s.schoolOriginName || '—';
  const seriesOf = (s: Student) => s.series || classes.find((c) => c.id === s.classId)?.gradeLevel || '—';
  const shiftOf = (s: Student) => s.shift || classes.find((c) => c.id === s.classId)?.shift || '—';
  const pendingsOf = (s: Student): string[] => {
    if (s.pendingFields && s.pendingFields.length > 0) return s.pendingFields;
    const out: string[] = [];
    if (isCpfPending(s.cpf)) out.push('CPF');
    if (!s.birthDate) out.push('Data de nascimento');
    if (!s.address || s.address.toLowerCase().includes('pendente')) out.push('Endereço');
    if (s.medicalClassification && s.medicalClassification !== 'Não declarada' && !s.hasMedicalReport) out.push('Laudo');
    if (s.cadastralStatus === 'PENDING_DOCS') out.push('Documentos');
    return out.length ? out : ['Cadastro a revisar'];
  };

  // Pendências por escola (para o número ao lado de cada escola no filtro)
  const pendingByUnit = useMemo(() => {
    const m = new Map<string, number>();
    incompleteStudents.forEach((s) => {
      const id = unitIdOf(s) || NO_SCHOOL;
      m.set(id, (m.get(id) || 0) + 1);
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incompleteStudents, classes]);

  // Escolas que o usuário pode escolher:
  // - lotado: a escola dele e as anexas dela (nunca as outras escolas da rede);
  // - rede/Sede: todas as escolas com pendência.
  const schoolOptions = useMemo(() => {
    if (scopeUnitId) {
      const own = schoolUnits.find((u) => u.id === scopeUnitId);
      const list = [own, ...annexesOf(scopeUnitId, schoolUnits)].filter(Boolean) as SchoolUnit[];
      return list.map((u) => ({ id: u.id, name: u.parentUnitId ? `${u.name} (anexa)` : u.name, count: pendingByUnit.get(u.id) || 0 }));
    }
    // Anexa logo abaixo da escola sede dela
    const groupKey = (u: SchoolUnit) => {
      const parent = u.parentUnitId ? schoolUnits.find((x) => x.id === u.parentUnitId) : undefined;
      return parent ? `${parent.name}\u0001${u.name}` : `${u.name}\u0000`;
    };
    return schoolUnits
      .filter((u) => (pendingByUnit.get(u.id) || 0) > 0)
      .sort((a, b) => groupKey(a).localeCompare(groupKey(b), 'pt-BR'))
      .map((u) => ({ id: u.id, name: u.parentUnitId ? `${u.name} (anexa)` : u.name, count: pendingByUnit.get(u.id) || 0 }));
  }, [schoolUnits, pendingByUnit, scopeUnitId]);
  const noSchoolCount = pendingByUnit.get(NO_SCHOOL) || 0;

  // Escola sede escolhida: as anexas podem entrar junto (relatório conjunto)
  const selectedAnnexes = useMemo(
    () => (selectedSchool !== 'ALL' && selectedSchool !== NO_SCHOOL ? annexesOf(selectedSchool, schoolUnits) : []),
    [selectedSchool, schoolUnits]
  );
  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedSchool === 'ALL' || selectedSchool === NO_SCHOOL) return ids;
    ids.add(selectedSchool);
    chosenAnnexIds(selectedSchool, schoolUnits, annexChoice).forEach((id) => ids.add(id));
    return ids;
  }, [selectedSchool, schoolUnits, annexChoice]);

  // Lotado numa escola sem anexas: não há o que escolher, o quadro mostra só a escola dele.
  const lockedToOwnSchool = !!scopeUnitId && schoolOptions.length <= 1;
  const selectedSchoolLabel =
    selectedSchool === 'ALL'
      ? 'Todas as escolas da rede'
      : selectedSchool === NO_SCHOOL
        ? 'Alunos sem escola definida'
        : [unitById(selectedSchool)?.name || '—', ...chosenAnnexIds(selectedSchool, schoolUnits, annexChoice).map((id) => unitById(id)?.name || '')]
            .filter(Boolean)
            .join(' + ');

  // Filtro da escola (vale para a tela, os indicadores, a impressão e o CSV)
  const schoolFiltered = useMemo(() => {
    if (selectedSchool === 'ALL') return incompleteStudents;
    if (selectedSchool === NO_SCHOOL) return incompleteStudents.filter((s) => !unitIdOf(s));
    return incompleteStudents.filter((s) => selectedIds.has(unitIdOf(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incompleteStudents, selectedSchool, selectedIds, classes]);

  // Filtros aplicados
  const filteredList = useMemo(() => {
    return schoolFiltered.filter((s) => {

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
  }, [schoolFiltered, selectedPendingType, searchTerm]);

  // Métricas agregadas
  const stats = useMemo(() => {
    const totalIncomplete = schoolFiltered.length;
    const missingLaudoCount = schoolFiltered.filter(
      (s) =>
        (s.medicalClassification && s.medicalClassification !== 'Não declarada' && !s.hasMedicalReport) ||
        s.pendingFields?.some((f) => f.toLowerCase().includes('laudo'))
    ).length;
    const missingBirthCount = schoolFiltered.filter(
      (s) =>
        !s.birthDate ||
        s.birthDate === '2020-01-01' ||
        s.pendingFields?.some((f) => f.toLowerCase().includes('nascimento'))
    ).length;
    const missingAddressCount = schoolFiltered.filter(
      (s) =>
        !s.address ||
        s.address.toLowerCase().includes('pendente') ||
        s.pendingFields?.some((f) => f.toLowerCase().includes('endereço') || f.toLowerCase().includes('endereco'))
    ).length;
    const totalPolos = new Set(schoolFiltered.map((s) => unitIdOf(s) || NO_SCHOOL)).size;

    return {
      totalIncomplete,
      missingLaudoCount,
      missingBirthCount,
      missingAddressCount,
      totalPolos,
    };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolFiltered, classes]);

  // Relatório impresso das pendências da escola escolhida (com o timbre padrão).
  // Mais de uma escola: um bloco por escola e, no final, o quadro com o total de cada uma.
  const handlePrintPendingReport = () => {
    if (filteredList.length === 0) return;
    const groups = new Map<string, Student[]>();
    filteredList.forEach((s) => {
      const id = unitIdOf(s) || NO_SCHOOL;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id)!.push(s);
    });
    // Ordem: escola escolhida (sede) primeiro, depois as demais em ordem alfabética
    const order = Array.from(groups.keys()).sort((a, b) => {
      if (a === selectedSchool) return -1;
      if (b === selectedSchool) return 1;
      const na = a === NO_SCHOOL ? '~' : unitById(a)?.name || '';
      const nb = b === NO_SCHOOL ? '~' : unitById(b)?.name || '';
      return na.localeCompare(nb, 'pt-BR');
    });
    const nameOfGroup = (id: string) => (id === NO_SCHOOL ? 'Sem escola definida no cadastro' : unitById(id)?.name || '—');
    const th = 'padding: 5px; border: 1px solid #cbd5e1; text-align: left;';
    const td = 'padding: 5px; border: 1px solid #e2e8f0; vertical-align: top;';
    const sortByName = (a: Student, b: Student) => a.name.localeCompare(b.name, 'pt-BR');

    const blocks = order
      .map((id) => {
        const rows = (groups.get(id) || []).slice().sort(sortByName);
        return `
        <div style="margin-top: 14px; page-break-inside: auto;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #0f172a; background: #fef3c7; padding: 5px 8px; border-left: 4px solid #d97706;">
            ${esc(nameOfGroup(id))} — ${rows.length} aluno(s) com pendência
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="${th} width: 28px;">Nº</th>
                <th style="${th}">RA</th>
                <th style="${th}">Aluno(a)</th>
                <th style="${th}">Série / Turno</th>
                <th style="${th}">Classificação Médica / PCD</th>
                <th style="${th}">Laudo</th>
                <th style="${th}">Campos pendentes para regularização</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (s, idx) => `
                <tr>
                  <td style="${td} text-align: center;">${idx + 1}</td>
                  <td style="${td}">${esc(s.enrollmentNumber)}</td>
                  <td style="${td} font-weight: bold;">${esc(s.name)}</td>
                  <td style="${td}">${esc(seriesOf(s))} (${esc(shiftOf(s))})</td>
                  <td style="${td}">${esc(s.medicalClassification || '—')}</td>
                  <td style="${td}">${s.hasMedicalReport ? 'SIM' : 'NÃO / PENDENTE'}</td>
                  <td style="${td} color: #b45309;">${esc(pendingsOf(s).join(', '))}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>`;
      })
      .join('');

    const totals =
      order.length > 1
        ? `
        <div style="margin-top: 18px; page-break-inside: avoid;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #0f172a;">Quadro totalizador</h4>
          <table style="width: 60%; border-collapse: collapse; font-size: 10.5px;">
            <thead><tr style="background-color: #f1f5f9;"><th style="${th}">Escola</th><th style="${th} text-align: right;">Alunos com pendência</th></tr></thead>
            <tbody>
              ${order.map((id) => `<tr><td style="${td}">${esc(nameOfGroup(id))}</td><td style="${td} text-align: right;">${(groups.get(id) || []).length}</td></tr>`).join('')}
              <tr style="font-weight: bold; background: #f8fafc;"><td style="${td}">TOTAL GERAL</td><td style="${td} text-align: right;">${filteredList.length}</td></tr>
            </tbody>
          </table>
        </div>`
        : '';

    const typeLabel: Record<string, string> = {
      ALL: 'Todas as pendências',
      LAUDO: 'Sem laudo PCD',
      BIRTH: 'Sem data de nascimento',
      ADDRESS: 'Sem endereço completo',
      CPF: 'Sem CPF ou CPF inválido',
    };

    const printableContent = `
      <div style="font-family: Arial, sans-serif; color: #1e293b;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 6px; text-align: center;">
          <h3 style="margin: 0; font-size: 14px; color: #0f172a;">LEVANTAMENTO DE PENDÊNCIAS CADASTRAIS (CENSO ESCOLAR)</h3>
          <p style="font-size: 11.5px; margin: 4px 0 0 0;"><strong>Escola:</strong> ${esc(selectedSchoolLabel)}</p>
          <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">
            Filtro: ${esc(typeLabel[selectedPendingType] || 'Todas as pendências')}${searchTerm ? ` | Busca: "${esc(searchTerm)}"` : ''}
            | Emitido em ${new Date().toLocaleDateString('pt-BR')} | Total: ${filteredList.length} aluno(s)
          </p>
        </div>
        ${blocks}
        ${totals}
        <div style="margin-top: 20px; font-size: 10.5px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
          Documento para controle e regularização cadastral junto à Secretaria Municipal de Educação.
        </div>
      </div>
    `;
    const letterheadUnit =
      selectedSchool !== 'ALL' && selectedSchool !== NO_SCHOOL ? selectedSchool : scopeUnitId || undefined;
    triggerPrint(printableContent, {
      title: `Pendências Cadastrais - ${selectedSchoolLabel}`,
      orientation: 'landscape',
      schoolUnitId: letterheadUnit,
    });
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
      `"${schoolOf(s)}"`,
      `"${seriesOf(s)}"`,
      `"${shiftOf(s)}"`,
      `"${s.birthDate || ''}"`,
      `"${s.medicalClassification || ''}"`,
      `"${s.hasMedicalReport ? 'SIM' : 'NÃO/PENDENTE'}"`,
      `"${pendingsOf(s).join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileSchool = selectedSchoolLabel
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
    link.setAttribute('download', `Pendencias_Cadastrais_${fileSchool || 'Rede'}_${new Date().toISOString().slice(0, 10)}.csv`);
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
              Alunos com dados cadastrais incompletos (CPF, nascimento, endereço, laudo ou documentos). A Secretaria deve coletar os documentos pendentes antes do fechamento do Censo Escolar.
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
            disabled={filteredList.length === 0}
            title={`Imprimir as pendências de: ${selectedSchoolLabel}`}
            className="px-3 py-2 bg-amber-800/80 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-xs font-semibold text-purple-800">Escolas Afetadas</span>
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

          {/* Filtro por escola: a Sede/rede escolhe; o usuário lotado vê só a escola dele */}
          {lockedToOwnSchool ? (
            <div
              className="flex items-center gap-2 text-xs py-2 px-3 bg-amber-50 border border-amber-200 rounded-lg font-semibold text-amber-900 max-w-full md:max-w-[340px]"
              title="Seu usuário está lotado nesta escola: o quadro mostra só os alunos dela."
            >
              <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{schoolOptions[0]?.name || selectedSchoolLabel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setAnnexChoice([]);
                }}
                title="Escolha a escola para ver e imprimir as pendências dela"
                className={`text-xs py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium max-w-full md:max-w-[320px] truncate ${
                  selectedSchool !== 'ALL' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {!scopeUnitId && <option value="ALL">Todas as escolas ({incompleteStudents.length})</option>}
                {schoolOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.count})
                  </option>
                ))}
                {!scopeUnitId && noSchoolCount > 0 && <option value={NO_SCHOOL}>Sem escola definida ({noSchoolCount})</option>}
              </select>
              <AnnexPicker
                annexes={selectedAnnexes.map((a) => ({ id: a.id, name: a.name }))}
                chosen={chosenAnnexIds(selectedSchool, schoolUnits, annexChoice)}
                onChange={setAnnexChoice}
              />
            </div>
          )}

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
                  const schoolName = schoolOf(student);
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
                          {seriesOf(student)}
                        </span>
                        <span className="ml-1 text-[11px] text-slate-500">({shiftOf(student)})</span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-700">
                            <strong>PCD:</strong> {student.medicalClassification || '—'}
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
                          {pendingsOf(student).map((field, idx) => (
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
                Mostrando 50 de {filteredList.length} cadastros pendentes na tela. A impressão e o CSV saem com todos os {filteredList.length} da seleção.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
