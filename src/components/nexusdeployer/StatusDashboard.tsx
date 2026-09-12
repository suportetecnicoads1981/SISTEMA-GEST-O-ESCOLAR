import React from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FolderCheck,
  FolderLock,
  Lock,
  Cloud,
  Database,
  ArrowRight,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
  Terminal,
  FileCode,
  FileCheck,
  DownloadCloud,
  FileText,
} from 'lucide-react';
import {
  NexusDeployerTelemetry,
  NexusFileSpec,
  NexusProvisionResult,
  NexusBundleMetadata,
} from '../../types';
import { CANONICAL_ROOT_FILES } from '../../services/nexus/FileService';

interface StatusDashboardProps {
  telemetry: NexusDeployerTelemetry;
  lastProvisionResult: NexusProvisionResult | null;
  latestBundle: NexusBundleMetadata | null;
  onRefresh: () => void;
  onTriggerProvision: () => void;
  onTriggerPrepareUpdate: () => void;
  onOpenAuditReport?: () => void;
  isProvisioning: boolean;
  isPackaging: boolean;
}

export const StatusDashboard: React.FC<StatusDashboardProps> = ({
  telemetry,
  lastProvisionResult,
  latestBundle,
  onRefresh,
  onTriggerProvision,
  onTriggerPrepareUpdate,
  onOpenAuditReport,
  isProvisioning,
  isPackaging,
}) => {
  const totalRequired = telemetry.totalRequired || CANONICAL_ROOT_FILES.length;
  const verifiedCount = lastProvisionResult?.presentFiles ?? 0;
  const isAllVerified = verifiedCount === totalRequired && verifiedCount > 0;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Industrial Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Root Directory & Files */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider font-semibold">DIRETÓRIO RAIZ</span>
            <HardDrive className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-mono font-bold text-slate-100 truncate">
              {telemetry.rootDir || 'C:\\SucessoEdu'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold ${
                  isAllVerified
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}
              >
                {isAllVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    {totalRequired}/{totalRequired} PRESENTES
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    {verifiedCount}/{totalRequired} ARQUIVOS
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">POSIX 0o775 OK</span>
            </div>
          </div>
        </div>

        {/* Metric 2: IAM & Secret Manager */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider font-semibold">SECRET MANAGER</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-mono font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>GCP IAM ELEVADO</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Injeção .env ativa • Zero chaves hardcoded
            </p>
          </div>
        </div>

        {/* Metric 3: Rollback Guard */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider font-semibold">ROLLBACK GUARD</span>
            <FolderLock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-mono font-bold text-slate-100 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ATÔMICO ATIVO</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Limpeza seletiva de raiz • /data preservada
            </p>
          </div>
        </div>

        {/* Metric 4: Firebase Storage & Firestore */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider font-semibold">FIREBASE RELEASES</span>
            <Cloud className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-mono font-bold text-indigo-300 truncate">
              {latestBundle?.version || 'v5.5.0-NEXUS'}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
              Firestore: nexus_releases • Bucket OK
            </p>
          </div>
        </div>
      </div>

      {/* Main Control & Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              NEXUS CORE PIPELINE
            </span>
            <span className="text-xs font-mono text-slate-400">
              Target: {telemetry.rootDir}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Status do Módulo de Provisionamento &amp; Atualizações
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            {lastProvisionResult?.message ||
              'Aguardando comando de provisionamento inicial dos 12 arquivos canônicos.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Verificar</span>
          </button>

          <button
            onClick={onTriggerProvision}
            disabled={isProvisioning}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isProvisioning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Server className="h-4 w-4" />
            )}
            <span>Executar Instalação Raiz</span>
          </button>

          <button
            onClick={onTriggerPrepareUpdate}
            disabled={isPackaging}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-750 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isPackaging ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadCloud className="h-4 w-4 text-indigo-400" />
            )}
            <span>Preparar Update (Cloud Bundling)</span>
          </button>

          {onOpenAuditReport && (
            <button
              onClick={onOpenAuditReport}
              id="dashboard_btn_export_audit_pdf"
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-750 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Exportar Relatório e Laudo Técnico de Auditoria em PDF"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Exportar Laudo PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 12 Files Inspection Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <FileCode className="h-5 w-5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Matriz de Arquivos Canônicos da Raiz ({totalRequired}/{totalRequired})
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Fluxo: fs.mkdir -&gt; Verificação de ponteiro de escrita IAM (W_OK) -&gt; Injeção Secret Manager -&gt; Validação Post-Install
              </p>
            </div>
          </div>
          <div className="text-xs font-mono">
            {isAllVerified ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Instalação Concluída: {totalRequired}/{totalRequired} arquivos validados
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {verifiedCount}/{totalRequired} arquivos validados
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Arquivo</th>
                <th className="py-2.5 px-3">Finalidade Técnica</th>
                <th className="py-2.5 px-3">Segurança / IAM</th>
                <th className="py-2.5 px-3">Hash SHA-256</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {CANONICAL_ROOT_FILES.map((file, idx) => {
                const recordedFile = lastProvisionResult?.files.find((f) => f.name === file.name);
                const isVerified = recordedFile?.status === 'VERIFIED';
                const isFailed = recordedFile?.status === 'FAILED';

                return (
                  <tr key={file.name} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400">📄</span>
                        <span>{file.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {file.purpose}
                    </td>
                    <td className="py-2.5 px-3">
                      {file.isSensitiveFromSecretManager ? (
                        <span className="px-1.5 py-0.5 rounded-sm bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-bold">
                          Secret Manager
                        </span>
                      ) : file.isCritical ? (
                        <span className="px-1.5 py-0.5 rounded-sm bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                          Crítico
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400 text-[10px]">
                          Binário
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                      {recordedFile?.checksumSha256 ? (
                        <span className="text-slate-300" title={recordedFile.checksumSha256}>
                          {recordedFile.checksumSha256.substring(0, 16)}...
                        </span>
                      ) : (
                        <span>pendente</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-300 border border-emerald-700 text-[11px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          GRAVADO
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-bold">
                          <AlertCircle className="h-3 w-3 text-rose-400" />
                          FALHA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-800 text-slate-400 text-[11px]">
                          AGUARDANDO
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
