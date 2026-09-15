import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Layers,
  FileCheck,
  Code
} from 'lucide-react';
import { VisualAuditReport } from '../../types/nexusinstall';

interface VisualValidatorProps {
  report: VisualAuditReport | null;
  isLoading: boolean;
  onRunAudit: () => void;
  onToggleSimulatedMismatch: () => void;
  isSimulatingMismatch: boolean;
}

export const VisualValidator: React.FC<VisualValidatorProps> = ({
  report,
  isLoading,
  onRunAudit,
  onToggleSimulatedMismatch,
  isSimulatingMismatch
}) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-md p-6 space-y-6">
      {/* Header do VisualValidator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${
            report?.isParityVerified
              ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-600/20 border-amber-500/30 text-amber-400'
          }`}>
            {report?.isParityVerified ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-50">
                VisualValidator • Auditoria de Layout & Paridade Dev/Prod
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                Fase 2
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Validação criptográfica de hashes CSS, manifesto de assets e proteção contra purga indevida
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Teste de Divergência de Hash */}
          <button
            onClick={onToggleSimulatedMismatch}
            className={`px-3 py-2 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isSimulatingMismatch
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alterna o teste de bloqueio de geração de instalador"
          >
            <Sliders className="w-3.5 h-3.5" />
            {isSimulatingMismatch ? 'Restaurar Paridade 100%' : 'Simular Mismatch de Hash'}
          </button>

          <button
            onClick={onRunAudit}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-slate-50 text-xs font-bold transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Auditando...' : 'Executar Validação de Build'}
          </button>
        </div>
      </div>

      {/* Alerta de Divergência ou Sucesso */}
      {report && (
        <div className={`p-4 rounded-md border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          report.isParityVerified
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {report.isParityVerified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <strong className="font-bold text-sm block">
                {report.isParityVerified
                  ? 'Paridade Visual Absoluta Confirmada (100% de Conformidade)'
                  : 'Atenção: Divergência de Hash nos Arquivos de Layout'}
              </strong>
              <p className="text-[11px] opacity-90 mt-0.5">
                {report.isParityVerified
                  ? 'Todos os manifestos de build, tokens de design e classes dinâmicas essenciais do Tailwind foram preservados integralmente.'
                  : report.divergenceReason || 'O bundle de produção não corresponde ao spec de desenvolvimento. O empacotador do instalador será bloqueado.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-black font-mono block">
              {report.parityScore}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Índice de Paridade</span>
          </div>
        </div>
      )}

      {/* Comparador Criptográfico de Hashes (Dev vs Prod) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hash do Ambiente Dev */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-blue-400" />
              Manifesto de Desenvolvimento (Source Spec)
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-600/20 text-blue-400">
              Dev Mode
            </span>
          </div>
          <div className="p-2.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 break-all flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{report?.devHash || 'Calculando SHA-256...'}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Referência canônica de tokens CSS e classes de componentes
          </span>
        </div>

        {/* Hash do Bundle de Produção */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Bundle Compilado de Produção (Post-Minify)
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
              report?.isParityVerified
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {report?.isParityVerified ? 'Hash Válido' : 'Hash Divergente'}
            </span>
          </div>
          <div className={`p-2.5 rounded-md border font-mono text-[11px] break-all flex items-center gap-2 ${
            report?.isParityVerified
              ? 'bg-slate-950 border-slate-800 text-slate-300'
              : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          }`}>
            <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{report?.prodHash || 'Calculando SHA-256...'}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Validação de integridade necessária para liberação do instalador
          </span>
        </div>
      </div>

      {/* Auditoria de Classes Dinâmicas Essenciais (Tailwind/PostCSS Purge Guard) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            Safelist & Preservação de Classes Dinâmicas (Purge Guard)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Auditadas 9/9 classes críticas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {report?.purgedClasses.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-md border text-xs space-y-1 ${
                item.preserved
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
                {item.preserved ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
              </div>
              <code className="font-mono text-[11px] font-bold block truncate" title={item.className}>
                {item.className}
              </code>
              <span className={`text-[9px] font-bold uppercase ${
                item.preserved ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {item.preserved ? 'Preservada' : 'Purgada!'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Assets Auditados */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-300 block">
          Manifesto Detalhado de Arquivos CSS e Assets Auditados
        </span>

        <div className="overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Arquivo / Componente</th>
                <th className="px-4 py-2.5">Tamanho Dev</th>
                <th className="px-4 py-2.5">Tamanho Prod</th>
                <th className="px-4 py-2.5">Status Paridade</th>
                <th className="px-4 py-2.5">Observações da Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950 font-mono text-xs">
              {report?.auditedAssets.map((asset, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-200">{asset.name}</td>
                  <td className="px-4 py-2.5 text-slate-400">{(asset.devBytes / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-2.5 text-slate-400">{(asset.prodBytes / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      asset.status === 'MATCH'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {asset.status === 'MATCH' ? 'Íntegro' : 'Divergente'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-[11px] font-sans">{asset.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
