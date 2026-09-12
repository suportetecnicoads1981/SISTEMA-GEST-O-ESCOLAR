import React, { useState } from 'react';
import {
  Database,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Server,
  FileCode,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ZeroDataBuildSummary, CleanSlateEnvironment } from '../../types/cleanslate';
import { ZeroDataPurifierService } from '../../services/cleanslate/ZeroDataPurifierService';

interface ZeroDataBuildPanelProps {
  onBuildCompleted?: (summary: ZeroDataBuildSummary) => void;
}

export const ZeroDataBuildPanel: React.FC<ZeroDataBuildPanelProps> = ({ onBuildCompleted }) => {
  const [environment, setEnvironment] = useState<CleanSlateEnvironment>('PRODUCTION_ZERO_DATA');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildSummary, setBuildSummary] = useState<ZeroDataBuildSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'PURGED' | 'PRESERVED' | 'MANIFEST'>('PURGED');

  const handleRunBuild = async () => {
    setIsBuilding(true);
    try {
      // Executa a purificação dinâmica das tabelas de seed
      const summary = await ZeroDataPurifierService.executeZeroDataBuild(environment);
      setBuildSummary(summary);
      if (onBuildCompleted) onBuildCompleted(summary);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Módulo Zero-Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                PRODUÇÃO ZERO-DATA • MÓDULO ENTERPRISE
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Purificador de Seeds &amp; Gerador de Build Puro
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Elimina dinamicamente todas as tabelas e registros de <code>seed_test</code> antes da compilação do instalador desktop. O banco final preserva estritamente metadados estruturais, DDL, migrações e parâmetros de sistema, garantindo zero contaminação de dados de QA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunBuild}
              disabled={isBuilding}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold rounded-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isBuilding ? (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Executar Build Zero-Data</span>
            </button>
          </div>
        </div>

        {/* Seletor de Ambiente e Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Ambiente Alvo de Deploy
            </span>
            <div className="flex items-center gap-2">
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as CleanSlateEnvironment)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-sm px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="PRODUCTION_ZERO_DATA">Produção Limpa (Zero-Data)</option>
                <option value="STAGING">Homologação (Staging)</option>
                <option value="DEVELOPMENT">Desenvolvimento (Dev com Seeds)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Endpoint de Produção
            </span>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5 truncate">
              <Server className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">https://sucessoedu-prod-vault.supabase.co</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Estado de Pureza do Banco
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300 font-bold">
                {buildSummary ? '100% Zero-Data Verificado' : 'Aguardando Execução'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo da Purificação e Abas de Inspeção */}
      {buildSummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-md border border-emerald-800">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">
                  Relatório de Auditoria de Build Zero-Data
                </h4>
                <p className="text-xs text-slate-400">
                  Total de registros de teste purgados: <strong className="text-rose-400">{buildSummary.totalPurgedRows}</strong> | Metadados preservados: <strong className="text-emerald-400">{buildSummary.totalPreservedRows}</strong>
                </p>
              </div>
            </div>

            {/* Abas */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-md font-mono text-xs">
              <button
                onClick={() => setActiveTab('PURGED')}
                className={`px-3 py-1 rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PURGED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trash2 className="h-3 w-3" />
                <span>Purgados ({buildSummary.purgedTables.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('PRESERVED')}
                className={`px-3 py-1 rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PRESERVED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Preservados ({buildSummary.preservedTables.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('MANIFEST')}
                className={`px-3 py-1 rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MANIFEST'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="h-3 w-3" />
                <span>Manifesto SHA-256</span>
              </button>
            </div>
          </div>

          {/* Tabela de Dados Purgados */}
          {activeTab === 'PURGED' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Tabela de Teste Purgada</th>
                    <th className="py-2 px-3">Linhas Removidas</th>
                    <th className="py-2 px-3">Descrição da Categoria</th>
                    <th className="py-2 px-3 text-right">Ação de Build</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {buildSummary.purgedTables.map((t) => (
                    <tr key={t.tableName} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-rose-300 flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>{t.tableName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-rose-400 font-bold">-{t.purgedRowCount} linhas</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{t.description}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-xs bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                          PURGADO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela de Dados Preservados */}
          {activeTab === 'PRESERVED' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Tabela Estrutural Preservada</th>
                    <th className="py-2 px-3">Linhas Mantidas</th>
                    <th className="py-2 px-3">Finalidade no Banco de Produção</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {buildSummary.preservedTables.map((t) => (
                    <tr key={t.tableName} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{t.tableName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{t.preservedRowCount} registros</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{t.description}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-xs bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          PRESERVADO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Manifesto Técnico SHA-256 */}
          {activeTab === 'MANIFEST' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Hash Criptográfico do Build de Produção (SHA-256):</span>
                  <span className="text-emerald-400">Assinado Digitalmente pelo Build Pipeline</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-sm text-emerald-400 font-bold text-xs select-all border border-slate-800">
                  {buildSummary.manifestSha256}
                </div>
                <div className="text-[11px] text-slate-400">
                  Garantia de que o instalador desktop compilado a partir deste manifesto conectará exclusivamente a <code>{buildSummary.productionDbUrl}</code> sem transações ou alunos fictícios.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
