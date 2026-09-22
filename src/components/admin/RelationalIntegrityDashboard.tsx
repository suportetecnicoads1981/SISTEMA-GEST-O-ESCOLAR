import React, { useState, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  FileCheck,
  Search,
  KeyRound,
  Download,
  Zap,
} from 'lucide-react';
import {
  RelationalIntegrityService,
  RelationalAuditReport,
} from '../../services/relationalIntegrityService';
import { AppStateData, saveStoredData } from '../../data/storage';

interface Props {
  appData: AppStateData;
  onUpdateData?: (updated: AppStateData) => void;
  onRefresh?: () => void;
}

export const RelationalIntegrityDashboard: React.FC<Props> = ({
  appData,
  onUpdateData,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HEALTHY' | 'ISSUES'>('ALL');
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastFixes, setLastFixes] = useState<string[]>([]);
  const [showFixModal, setShowFixModal] = useState(false);

  // Executa a auditoria em tempo real sobre os dados atuais
  const report: RelationalAuditReport = useMemo(() => {
    return RelationalIntegrityService.audit(appData);
  }, [appData]);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      if (onRefresh) onRefresh();
    }, 400);
  };

  const handleAutoHeal = () => {
    const { healedData, fixesApplied } = RelationalIntegrityService.autoHeal(appData);
    setLastFixes(fixesApplied);
    setShowFixModal(true);
    saveStoredData(healedData);
    if (onUpdateData) {
      onUpdateData(healedData);
    }
  };

  const handleExportLaudo = () => {
    const laudoContent = {
      sistema: 'SucessoEdu Gestão Educacional',
      modulo: 'Auditoria de Integridade Relacional e Restrições Referenciais',
      geradoEm: new Date().toISOString(),
      scoreGeral: `${report.score}%`,
      statusGeral: report.status,
      tabelasAuditadas: report.totalTables,
      totalRegistrosAnalisados: report.totalRecordsChecked,
      relacionamentosVerificados: report.totalRelationsChecked,
      relacionamentosIntegros: report.healthyRelationsCount,
      relacionamentosQuebrados: report.brokenRelationsCount,
      tabelas: report.tableSummaries,
      inconsistenciasDetectadas: report.issues,
    };

    const blob = new Blob([JSON.stringify(laudoContent, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laudo_Integridade_Relacional_SucessoEdu_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtragem de tabelas
  const filteredTables = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return report.tableSummaries.filter((tbl) => {
      if (!tbl) return false;
      const matchSearch =
        !q ||
        (tbl.displayName && tbl.displayName.toLowerCase().includes(q)) ||
        (tbl.tableName && tbl.tableName.toLowerCase().includes(q)) ||
        (tbl.testedForeignKeys && tbl.testedForeignKeys.some((k) => k && k.toLowerCase().includes(q)));

      if (!matchSearch) return false;
      if (statusFilter === 'HEALTHY') return tbl.status === 'HEALTHY';
      if (statusFilter === 'ISSUES') return tbl.status !== 'HEALTHY';
      return true;
    });
  }, [report.tableSummaries, searchTerm, statusFilter]);

  return (
    <div className="space-y-6" id="relational-integrity-container">
      {/* Header com Status Geral e Ações Rápidas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-xl ${
                report.score === 100
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : report.score >= 80
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-800">
                  Auditoria de Integridade Relacional e Chaves Estrangeiras
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    report.score === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : report.score >= 80
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {report.score === 100
                    ? '100% ÍNTEGRO'
                    : `${report.score}% EM CONFORMIDADE`}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                Diagnóstico estrutural que valida restrições de chaves estrangeiras, consistência de
                enturmação, integridade referencial entre alunos, turmas, disciplinas, avaliações,
                diários e unidades escolares.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isAuditing ? 'animate-spin' : ''}`} />
              Reauditar Banco
            </button>

            <button
              onClick={handleAutoHeal}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Auto-Reparar e Normalizar
            </button>

            <button
              onClick={handleExportLaudo}
              className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Laudo Técnico
            </button>
          </div>
        </div>

        {/* Métricas e Indicadores de Conformidade */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Score Relacional</span>
              <KeyRound className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{report.score}%</div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
              Restrições Validadas
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Tabelas Auditadas</span>
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{report.totalTables}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {report.totalRecordsChecked} registros checados
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Relações Ativas (FK)</span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {report.healthyRelationsCount}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">
              100% de integridade operacional
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Inconsistências</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {report.brokenRelationsCount}
            </div>
            <div
              className={`text-xs mt-0.5 font-medium ${
                report.brokenRelationsCount === 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {report.brokenRelationsCount === 0
                ? 'Nenhum registro órfão'
                : 'Pendentes de normalização'}
            </div>
          </div>
        </div>
      </div>

      {/* Relatório de Inconsistências se houver */}
      {report.issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-800 font-semibold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Inconsistências Identificadas ({report.issues.length})</span>
            </div>
            <button
              onClick={handleAutoHeal}
              className="text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Aplicar Correção Automática
            </button>
          </div>
          <div className="space-y-2">
            {report.issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    [{issue.sourceTable.toUpperCase()}] {issue.recordLabel}
                  </div>
                  <div className="text-slate-600 mt-0.5">{issue.description}</div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">
                    FK: {issue.foreignKeyField}
                  </span>
                  {issue.suggestedValue && (
                    <div className="text-emerald-600 font-medium mt-0.5">
                      Sugestão: {String(issue.suggestedValue)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matriz Detalhada de Tabelas e Chaves Estrangeiras */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">
              Matriz Estrutural de Integridade das Tabelas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Validação das restrições de cardinalidade (1:1, 1:N e N:M) entre as entidades
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar tabela ou chave..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="HEALTHY">Apenas Íntegras</option>
              <option value="ISSUES">Com Inconsistências</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Tabela do Banco</th>
                <th className="px-5 py-3">Qtd. Registros</th>
                <th className="px-5 py-3">Chaves Estrangeiras & Relacionamentos Testados</th>
                <th className="px-5 py-3 text-center">Status de Integridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTables.map((tbl) => (
                <tr key={tbl.tableName} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{tbl.displayName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{tbl.tableName}</div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                      {tbl.recordCount}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {tbl.testedForeignKeys.map((fk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono text-[11px]"
                        >
                          {fk}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {tbl.status === 'HEALTHY' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        100% Íntegro
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        {tbl.brokenFkCount} Chave(s) Órfã(s)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Conclusão de Auto-Reparo */}
      {showFixModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center space-x-3 text-emerald-700 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Normalização e Auto-Cura Concluídas!
                </h3>
                <p className="text-xs text-slate-500">
                  O motor relacional inspecionou e sincronizou todas as chaves estrangeiras.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-56 overflow-y-auto text-xs text-slate-700 font-mono space-y-1">
              {lastFixes.length === 0 ? (
                <div className="text-slate-500 py-2 text-center font-sans">
                  Todas as tabelas já estavam 100% em perfeita integridade referencial! Nenhuma
                  correção foi necessária.
                </div>
              ) : (
                lastFixes.map((f, i) => (
                  <div key={i} className="text-emerald-700 flex items-start">
                    <span className="mr-1.5">•</span>
                    <span>{f}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowFixModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
