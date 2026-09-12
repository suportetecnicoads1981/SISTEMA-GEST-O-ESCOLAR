import React, { useState, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  AlertCircle,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
  SlidersHorizontal,
  Table as TableIcon,
  Trash2,
  Download,
  Sparkles,
  Save,
} from 'lucide-react';
import {
  OmniDeployImportFilterState,
} from '../../types';
import {
  saveImportFilterPreferences,
  getImportFilterPreferences,
} from '../../services/firebaseDeployService';

interface SmartDataTableProps {
  onCommitImport?: (entity: string, records: any[]) => void;
  onClose?: () => void;
}

interface RawDataRow {
  [key: string]: any;
}

const DEFAULT_SAMPLE_DATA: RawDataRow[] = [
  { id: '1', nome: 'Ana Beatriz Souza', matricula: '2026-001', turma: '9º Ano A', data_nasc: '2011-04-12', media_geral: 8.8, status: 'ATIVO', categoria: 'Ensino Fundamental II' },
  { id: '2', nome: 'Carlos Eduardo Santos', matricula: '2026-002', turma: '9º Ano A', data_nasc: '2011-07-22', media_geral: 5.4, status: 'ATIVO', categoria: 'Ensino Fundamental II' },
  { id: '3', nome: 'Daniela Ferreira Lima', matricula: '2026-003', turma: '1º Ano Médio B', data_nasc: '2010-02-18', media_geral: 9.1, status: 'ATIVO', categoria: 'Ensino Médio' },
  { id: '4', nome: 'Enzo Gabriel Oliveira', matricula: '2026-004', turma: '1º Ano Médio B', data_nasc: '2010-11-05', media_geral: 4.8, status: 'ALERTA', categoria: 'Ensino Médio' },
  { id: '5', nome: 'Fernanda Martins Costa', matricula: '2026-005', turma: '8º Ano C', data_nasc: '2012-09-30', media_geral: 7.5, status: 'ATIVO', categoria: 'Ensino Fundamental II' },
  { id: '6', nome: 'Guilherme Albuquerque', matricula: '2026-006', turma: '8º Ano C', data_nasc: '2012-01-14', media_geral: 6.2, status: 'ATIVO', categoria: 'Ensino Fundamental II' },
  { id: '7', nome: 'Helena Rocha Barreto', matricula: '2026-007', turma: '3º Ano Médio A', data_nasc: '2008-05-19', media_geral: 9.6, status: 'ATIVO', categoria: 'Ensino Médio' },
  { id: '8', nome: 'Igor Vinicius Moreira', matricula: '2026-008', turma: '3º Ano Médio A', data_nasc: '2008-12-03', media_geral: 5.9, status: 'RECUPERAÇÃO', categoria: 'Ensino Médio' },
];

export const SmartDataTable: React.FC<SmartDataTableProps> = ({
  onCommitImport,
  onClose,
}) => {
  const [dataRows, setDataRows] = useState<RawDataRow[]>(DEFAULT_SAMPLE_DATA);
  const [fileName, setFileName] = useState<string>('alunos_matriculas_2026.csv (Exemplo Carregado)');
  const [targetEntity, setTargetEntity] = useState<'STUDENTS' | 'TEACHERS' | 'GRADES' | 'ATTENDANCE'>('STUDENTS');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    nome: 'Nome do Estudante',
    matricula: 'Número de Matrícula',
    turma: 'Turma de Enturmação',
    data_nasc: 'Data de Nascimento',
    media_geral: 'Média de Rendimento',
    status: 'Situação Cadastral',
    categoria: 'Etapa de Ensino',
  });

  // Filtros Avançados Dinâmicos
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [minValue, setMinValue] = useState<number | ''>('');
  const [maxValue, setMaxValue] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Persistência de Estado (Lembrar os últimos filtros usados)
  useEffect(() => {
    const saved = getImportFilterPreferences();
    if (saved) {
      if (saved.searchKeyword) setSearchKeyword(saved.searchKeyword);
      if (saved.selectedCategory) setSelectedCategory(saved.selectedCategory);
      if (saved.minValue !== undefined) setMinValue(saved.minValue);
      if (saved.maxValue !== undefined) setMaxValue(saved.maxValue);
      if (saved.startDate) setStartDate(saved.startDate);
      if (saved.endDate) setEndDate(saved.endDate);
    }
  }, []);

  const handleSaveCurrentFilters = () => {
    const filters: OmniDeployImportFilterState = {
      searchKeyword,
      selectedCategory,
      minValue: minValue === '' ? undefined : minValue,
      maxValue: maxValue === '' ? undefined : maxValue,
      startDate,
      endDate,
      targetEntity,
    };
    saveImportFilterPreferences(filters);
    setSuccessMessage('Filtros persistidos no perfil do usuário com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setDataRows(parsed);
          }
        } else {
          // Parse simples de CSV com detecção de delimitador vírgula ou ponto-e-vírgula
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const separator = lines[0].includes(';') ? ';' : ',';
            const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''));
            const rows: RawDataRow[] = [];

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(separator).map((v) => v.trim().replace(/^["']|["']$/g, ''));
              const obj: RawDataRow = { id: String(i) };
              headers.forEach((h, idx) => {
                const val = values[idx] ?? '';
                // Tenta converter para número se aplicável
                const num = Number(val);
                obj[h] = !isNaN(num) && val !== '' ? num : val;
              });
              rows.push(obj);
            }
            setDataRows(rows);

            // Mapeamento automático inteligente
            const newMap: Record<string, string> = {};
            headers.forEach((h) => {
              newMap[h] = h.charAt(0).toUpperCase() + h.slice(1);
            });
            setColumnMapping(newMap);
          }
        }
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
      }
    };
    reader.readAsText(file);
  };

  // Categorias disponíveis para o filtro
  const categories = useMemo(() => {
    const set = new Set<string>();
    dataRows.forEach((r) => {
      if (r.categoria) set.add(String(r.categoria));
      if (r.turma) set.add(String(r.turma));
    });
    return Array.from(set);
  }, [dataRows]);

  // Filtragem Dinâmica em Tempo Real
  const filteredData = useMemo(() => {
    return dataRows.filter((row) => {
      // Busca por palavra-chave em qualquer campo de texto
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const hasMatch = Object.values(row).some((val) =>
          String(val).toLowerCase().includes(query)
        );
        if (!hasMatch) return false;
      }

      // Filtro por categoria ou turma
      if (selectedCategory !== 'TODAS') {
        if (row.categoria !== selectedCategory && row.turma !== selectedCategory) {
          return false;
        }
      }

      // Filtro por valor numérico (ex: Média Geral)
      if (minValue !== '' && typeof row.media_geral === 'number') {
        if (row.media_geral < Number(minValue)) return false;
      }
      if (maxValue !== '' && typeof row.media_geral === 'number') {
        if (row.media_geral > Number(maxValue)) return false;
      }

      return true;
    });
  }, [dataRows, searchKeyword, selectedCategory, minValue, maxValue]);

  const handleProcessCommit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage(`${filteredData.length} registros processados e enviados com sucesso!`);
      if (onCommitImport) {
        onCommitImport(targetEntity, filteredData);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1200);
  };

  const columns = useMemo(() => {
    if (dataRows.length === 0) return [];
    return Object.keys(dataRows[0]).filter((k) => k !== 'id');
  }, [dataRows]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4">
      {/* Top Header Material Design 3 */}
      <div className="bg-[#1a73e8] text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold">Importador Inteligente com Filtros Dinâmicos</h3>
            <p className="text-xs text-blue-100">
              Mapeamento de colunas, validação pré-Firestore e persistência de preferências
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="cursor-pointer px-3.5 py-2 bg-white text-[#1a73e8] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all">
            <UploadCloud className="h-4 w-4" />
            <span>Selecionar Arquivo (CSV / JSON)</span>
            <input
              type="file"
              accept=".csv,.json,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {successMessage && (
        <div className="mx-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Painel de Filtros e Mapeamento */}
      <div className="px-5 space-y-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <SlidersHorizontal className="h-4 w-4 text-[#1a73e8]" />
              <span>Filtros Pré-Processamento</span>
              <span className="text-[10px] font-normal text-slate-500 font-mono">
                ({filteredData.length} de {dataRows.length} registros correspondentes)
              </span>
            </div>

            <button
              onClick={handleSaveCurrentFilters}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
              title="Salva os filtros para a próxima vez"
            >
              <Save className="h-3.5 w-3.5 text-[#1a73e8]" />
              <span>Lembrar Filtros</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Campo de Busca */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Buscar por Texto</label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nome, turma, matrícula..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#1a73e8]"
                />
              </div>
            </div>

            {/* Categoria / Turma */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoria / Segmento</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#1a73e8]"
              >
                <option value="TODAS">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Faixa de Valores */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Média Mínima</label>
              <input
                type="number"
                step="0.1"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 6.0"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#1a73e8]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Média Máxima</label>
              <input
                type="number"
                step="0.1"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 10.0"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#1a73e8]"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Visualização de Dados Filtrados */}
        <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Arquivo Carregado: {fileName}</span>
            <span className="font-mono text-slate-500 text-[11px]">
              {filteredData.length} registros prontos para gravação
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="p-2.5 font-semibold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap">
                      {columnMapping[col] || col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredData.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    {columns.map((col) => {
                      const val = row[col];
                      const isNumber = typeof val === 'number';
                      const isStatus = col.toLowerCase().includes('status');
                      return (
                        <td key={col} className="p-2.5 text-slate-800 whitespace-nowrap">
                          {isStatus ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                val === 'ATIVO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : val === 'ALERTA'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {val}
                            </span>
                          ) : isNumber ? (
                            <span className="font-mono font-semibold text-[#1a73e8]">{val}</span>
                          ) : (
                            val || '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Barra de Ação Inferior */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-3">
          <div className="text-xs text-slate-500">
            Filtros persistidos no <code>localStorage</code> do navegador e integrados à rotina de ingestão.
          </div>

          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Fechar
              </button>
            )}
            <button
              onClick={handleProcessCommit}
              disabled={isProcessing || filteredData.length === 0}
              className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>Processar e Gravar ({filteredData.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
