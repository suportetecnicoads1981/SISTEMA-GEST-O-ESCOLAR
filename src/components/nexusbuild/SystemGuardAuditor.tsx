import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Bug,
  Cpu,
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wrench
} from 'lucide-react';
import { SastAuditResult, SastFinding } from '../../types/nexusbuild';

interface SystemGuardAuditorProps {
  auditResult: SastAuditResult;
  onRunAudit: () => void;
  onAutoFix: () => void;
  onNotifyDeveloper: () => void;
  isLoading?: boolean;
}

export const SystemGuardAuditor: React.FC<SystemGuardAuditorProps> = ({
  auditResult,
  onRunAudit,
  onAutoFix,
  onNotifyDeveloper,
  isLoading = false,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  const filteredFindings = auditResult.findings.filter((f) => {
    if (filterSeverity === 'ALL') return true;
    return f.severity === filterSeverity;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              System Guard Auditor & Varredura SAST
              {auditResult.passed ? (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  APROVADO (0 FALHAS CRÍTICAS)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-rose-950 text-rose-500 border border-rose-800/60 animate-pulse">
                  BUILD BLOQUEADO ({auditResult.criticalIssuesCount} CRÍTICAS)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Auditoria de sintaxe estrita, detecção de memory leaks e integridade SHA-256 antes da compilação do executável.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunAudit}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
            <span>Re-analisar Código</span>
          </button>
          {auditResult.findings.some(f => f.autoFixAvailable && !f.fixed) && (
            <button
              onClick={onAutoFix}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Corrigir Automaticamente</span>
            </button>
          )}
        </div>
      </div>

      {/* Métricas da Auditoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Arquivos Inspecionados</span>
            <FileCode className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {auditResult.totalScannedFiles}
          </div>
          <div className="mt-1 text-xs text-cyan-400 font-mono">
            Varredura estática profunda
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          auditResult.criticalIssuesCount === 0 
            ? 'bg-slate-950 border-slate-800' 
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Falhas Críticas / Sintaxe</span>
            {auditResult.criticalIssuesCount === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-500" />
            )}
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono ${
            auditResult.criticalIssuesCount === 0 ? 'text-cyan-400' : 'text-rose-500'
          }`}>
            {auditResult.criticalIssuesCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {auditResult.syntaxOk ? 'Sintaxe 100% validada' : 'Interrompe a geração do .exe'}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Memory Leak Monitor</span>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {auditResult.memoryLeakChecksPassed ? 'SEGURO' : 'RISCO'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Checagem de listeners e closures
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Canal de Alerta Ativo</span>
            <Mail className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xs font-mono text-cyan-400 truncate">
            {auditResult.developerEmail}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {auditResult.developerNotified ? (
              <span className="text-cyan-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Log despachado
              </span>
            ) : (
              <button
                onClick={onNotifyDeveloper}
                className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer text-xs"
              >
                Enviar relatório manual
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Integridade Criptográfica SHA-256 */}
      <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-xs text-slate-400 font-mono">Assinatura SHA-256 do Binário:</span>
          <code className="text-xs font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {auditResult.binaryIntegritySha256}
          </code>
        </div>
        <span className="text-2xs text-slate-500 font-mono">
          Auditoria às {new Date(auditResult.auditTimestamp).toLocaleTimeString('pt-BR')}
        </span>
      </div>

      {/* Lista de Ocorrências SAST */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            Detalhamento das Regras SAST Inspecionadas
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-2 py-0.5 rounded text-xs font-mono ${
                filterSeverity === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({auditResult.findings.length})
            </button>
            <button
              onClick={() => setFilterSeverity('CRITICAL')}
              className={`px-2 py-0.5 rounded text-xs font-mono ${
                filterSeverity === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Críticos ({auditResult.findings.filter(f => f.severity === 'CRITICAL').length})
            </button>
            <button
              onClick={() => setFilterSeverity('WARNING')}
              className={`px-2 py-0.5 rounded text-xs font-mono ${
                filterSeverity === 'WARNING'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Alertas ({auditResult.findings.filter(f => f.severity === 'WARNING').length})
            </button>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
            Nenhuma ocorrência encontrada nesta categoria. Código limpo e pronto para compilação.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  finding.severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-2xs font-mono font-bold ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-rose-900 text-rose-300'
                          : 'bg-amber-900/60 text-amber-300'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      {finding.rule}
                    </span>
                    {finding.fixed && (
                      <span className="px-1.5 py-0.2 rounded text-2xs bg-emerald-950 text-cyan-400 border border-emerald-800">
                        CORRIGIDO
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{finding.description}</p>
                  <div className="text-slate-500 font-mono text-2xs">
                    Local: {finding.file}:{finding.line}
                  </div>
                </div>

                {finding.autoFixAvailable && !finding.fixed && (
                  <span className="text-2xs text-cyan-400 font-mono bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/40 shrink-0">
                    Auto-fix disponível
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
