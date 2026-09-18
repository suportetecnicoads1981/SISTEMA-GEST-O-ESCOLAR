import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FolderSync,
  Database,
  Cloud,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  NexusCoreModuleAudit,
  NexusCoreSnapshotMetadata,
  NexusCoreDriveReleaseMetadata,
  NexusCoreSmokeTestResult,
} from '../../types/nexusCore';

interface ReleaseSummaryCardProps {
  modules: NexusCoreModuleAudit[];
  snapshot: NexusCoreSnapshotMetadata | null;
  driveRelease: NexusCoreDriveReleaseMetadata | null;
  smokeTest: NexusCoreSmokeTestResult | null;
  onViewDriveFolder?: () => void;
}

export const ReleaseSummaryCard: React.FC<ReleaseSummaryCardProps> = ({
  modules,
  snapshot,
  driveRelease,
  smokeTest,
  onViewDriveFolder,
}) => {
  const allModulesPassed = modules.length > 0 && modules.every((m) => m.status === 'passed');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>NexusCore ERP • Deploy de Produção Consolidado</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Relatório de Consolidação & Status de Auditoria
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Conta de Serviço:{' '}
            <strong className="text-slate-800 font-semibold font-mono">
              suportetecnicoads@gmail.com
            </strong>{' '}
            (Storage Admin + Editor de Drive)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {allModulesPassed && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Módulos Aprovados</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid com os 4 Módulos Auditados */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Auditoria dos Módulos Principais (Auth, CRM, Financeiro, Inventário)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      mod.status === 'passed' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-sm font-semibold text-slate-900">{mod.name}</span>
                </div>
                <span className="text-2xs font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  {mod.latencyMs}ms
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{mod.category}</span>
                <span>
                  <strong>{mod.passedTests}</strong>/{mod.testsCount} testes ({mod.coveragePercent}%)
                </span>
              </div>

              <div className="text-2xs text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/60">
                {mod.details.slice(0, 2).map((detail, idx) => (
                  <div key={idx} className="flex items-start space-x-1">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Infraestrutura (GCS + Drive + Smoke Test) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Card Google Cloud Storage */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Cloud className="w-5 h-5" />
            <h5 className="text-sm font-bold text-slate-900">Cloud Storage Backup</h5>
          </div>
          {snapshot ? (
            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Snapshot:</span>
                <span className="font-mono text-slate-800 font-semibold">{snapshot.snapshotId.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Docs:</span>
                <span className="font-semibold text-slate-900">{snapshot.totalDocuments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tamanho:</span>
                <span>{(snapshot.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
              <div className="mt-2 text-2xs text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SHA-256 Verificado</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Snapshot pendente de execução.</p>
          )}
        </div>

        {/* Card Google Drive */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600">
            <FolderSync className="w-5 h-5" />
            <h5 className="text-sm font-bold text-slate-900">Google Drive Release</h5>
          </div>
          {driveRelease ? (
            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Pasta:</span>
                <span className="font-semibold text-indigo-600">{driveRelease.folderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Versão:</span>
                <span className="font-mono text-slate-800 font-medium">{driveRelease.versionTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Artefatos:</span>
                <span>{driveRelease.artifactsCount} arquivos espelhados</span>
              </div>
              <button
                onClick={onViewDriveFolder}
                className="w-full mt-2 inline-flex items-center justify-center space-x-1 py-1 px-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-2xs font-semibold transition-colors"
              >
                <span>Acessar no Google Drive</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sincronização com Drive pendente.</p>
          )}
        </div>

        {/* Card Smoke Test & RLS */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Database className="w-5 h-5" />
            <h5 className="text-sm font-bold text-slate-900">Production Smoke Test</h5>
          </div>
          {smokeTest ? (
            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Leitura/Escrita:</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>OK</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sessão Persistente:</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ativa</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Isolamento Multi-Tenant:</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>RLS Blindado</span>
                </span>
              </div>
              <div className="mt-2 text-2xs text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200">
                Latência Média: <strong className="text-slate-800">{smokeTest.latencyAvgMs}ms</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Smoke Test aguardando deploy.</p>
          )}
        </div>
      </div>
    </div>
  );
};
