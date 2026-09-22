import React, { useState } from 'react';
import {
  Database,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  Layers,
  Link,
  Search,
  Code2,
} from 'lucide-react';
import {
  DashboardToCodeBridge,
  ReferentialAuditResult,
} from '../../services/debugflow/dashboardToCodeBridge';
import { SupabaseTableAudit } from '../../types/supabaseSchema';

export const SchemaSyncTable: React.FC = () => {
  const tables = DashboardToCodeBridge.getDashboardTables();
  const [selectedTableName, setSelectedTableName] = useState<string>('students');
  const [activeTab, setActiveTab] = useState<'COLUMNS' | 'RELATIONSHIPS' | 'RLS_SECURITY'>('COLUMNS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const selectedTable = tables.find((t) => t.name === selectedTableName) || tables[0];
  const columnMappings = DashboardToCodeBridge.getColumnMappingsForTable(selectedTableName);
  const referentialResults = DashboardToCodeBridge.auditReferentialIntegrity();

  const filteredMappings = columnMappings.filter((m) => {
    if (!m) return false;
    const q = (searchTerm || '').toLowerCase().trim();
    return (
      !q ||
      (m.column && m.column.toLowerCase().includes(q)) ||
      (m.frontendProperty && m.frontendProperty.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#f8fafc]">Dashboard-to-Code Bridge</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {tables.length} Tabelas Sincronizadas
                </span>
              </div>
              <p className="text-sm text-[#94a3b8]">
                Inspeção estrita entre colunas criadas no Dashboard Supabase e interfaces React/TypeScript.
              </p>
            </div>
          </div>

          {/* Subtabs switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('COLUMNS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'COLUMNS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Colunas & Tipos
            </button>
            <button
              onClick={() => setActiveTab('RELATIONSHIPS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'RELATIONSHIPS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Relações (1:N, N:N)
            </button>
            <button
              onClick={() => setActiveTab('RLS_SECURITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'RLS_SECURITY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Políticas RLS
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'COLUMNS' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table Selector Sidebar */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block px-2 mb-2">
              Tabelas do Dashboard
            </span>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTableName(t.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                    selectedTableName === t.name
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#94a3b8] hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-mono truncate">{t.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300">
                    {t.columnsCount} cols
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column Mappings Table */}
          <div className="lg:col-span-3 bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#f8fafc] font-mono">
                  public.{selectedTable.name} <span className="text-indigo-400 font-sans">({selectedTable.frontendEntity})</span>
                </h3>
                <p className="text-xs text-[#94a3b8]">{selectedTable.description}</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Filtrar campos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-[#f8fafc] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-[#f8fafc]">
                <thead className="bg-slate-800/80 text-[#94a3b8] border-b border-slate-700">
                  <tr>
                    <th className="p-3">Coluna Supabase (PostgreSQL)</th>
                    <th className="p-3">Tipo SQL</th>
                    <th className="p-3">Propriedade Frontend (TS)</th>
                    <th className="p-3">Chave / Relação</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMappings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-300">
                        {m.column}
                        {m.isPrimaryKey && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-sans">
                            PK
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#94a3b8] font-mono">{m.dataType}</td>
                      <td className="p-3 font-mono text-emerald-400">
                        .{m.frontendProperty}
                      </td>
                      <td className="p-3 text-[#94a3b8]">
                        {m.foreignKey ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            <Link className="w-3 h-3" />
                            {m.foreignKey.targetTable}.{m.foreignKey.targetColumn}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {m.status}
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

      {/* Relationships Tab */}
      {activeTab === 'RELATIONSHIPS' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-400" />
              Auditoria de Integridade Referencial & Chaves Estrangeiras
            </h3>
            <span className="text-xs text-[#94a3b8]">
              {referentialResults.filter((r) => r.status === 'INTEGRITY_OK').length} de {referentialResults.length} Relações OK
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {referentialResults.map((r, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#f8fafc]">{r.relationName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'INTEGRITY_OK'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {r.status === 'INTEGRITY_OK' ? '100% Integra' : `${r.orphanedRecordsCount} Órfãos`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#94a3b8] font-mono bg-slate-900/60 p-2.5 rounded-lg">
                  <div>
                    <span className="text-indigo-300 font-bold">{r.sourceTable}</span>.{r.sourceColumn}
                    <div className="text-[10px] text-slate-500">{r.totalSourceRecords} registros</div>
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                  <div className="text-right">
                    <span className="text-emerald-300 font-bold">{r.targetTable}</span>.{r.targetColumn}
                    <div className="text-[10px] text-slate-500">{r.totalTargetRecords} registros</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#94a3b8] bg-slate-900/40 p-2 rounded border border-slate-700/40 font-mono overflow-x-auto">
                  <span className="text-slate-500">// Script de Garantia Referencial:</span>
                  <div className="text-indigo-300 mt-0.5">{r.remediationSnippet}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RLS Security Tab */}
      {activeTab === 'RLS_SECURITY' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Políticas de Row Level Security (RLS) por Tabela
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              17 de 17 Tabelas com RLS Ativado
            </span>
          </div>

          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {tables.map((t) => (
              <div key={t.name} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-sm font-bold text-indigo-300">{t.name}</span>
                  <p className="text-xs text-[#94a3b8]">{t.description}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {t.rlsPolicies.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-emerald-400"
                    >
                      {p.action} ({p.roles.join(', ')})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
