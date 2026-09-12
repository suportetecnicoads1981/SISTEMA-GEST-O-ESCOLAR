import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileCode,
  Package,
  Key,
  HardDrive,
  Database,
  Layers,
  ShieldCheck,
  RotateCcw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { NexusInstallationRecord } from '../../types';

interface PostInstallStatusProps {
  installation: NexusInstallationRecord | null;
  onRunInstall: () => void;
  onTestRollback: () => void;
  onTestPermissionError: () => void;
  isInstalling: boolean;
}

export const PostInstallStatus: React.FC<PostInstallStatusProps> = ({
  installation,
  onRunInstall,
  onTestRollback,
  onTestPermissionError,
  isInstalling,
}) => {
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!installation) {
    return (
      <div
        id="nexus_post_install_status_empty"
        className="bg-slate-950 border border-slate-800 rounded-md p-6 text-center space-y-4 font-mono text-xs"
      >
        <div className="p-3 w-12 h-12 mx-auto rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
          <HardDrive className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-slate-200 font-bold text-sm">Nenhuma Instalação Executada Nesta Sessão</h4>
          <p className="text-slate-400 mt-1 max-w-md mx-auto">
            Execute o pipeline com buffer temporário para provisionar os 14 binários e validar a presença física de <code>index.js</code>, <code>package.json</code> e <code>.env</code>.
          </p>
        </div>
        <button
          onClick={onRunInstall}
          disabled={isInstalling}
          className="px-5 py-2.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
        >
          <HardDrive className="h-4 w-4" />
          <span>Executar Pipeline de Instalação</span>
        </button>
      </div>
    );
  }

  const isVerified = installation.status === 'verified' && installation.totalBytes > 0;
  const indexJsSpec = installation.essentialFiles.find((f) => f.name === 'index.js');
  const packageJsonSpec = installation.essentialFiles.find((f) => f.name === 'package.json');
  const envSpec = installation.essentialFiles.find((f) => f.name === '.env');

  return (
    <div
      id="nexus_post_install_status_card"
      className="bg-slate-950 border border-slate-800 rounded-md p-5 text-slate-200 shadow-xl space-y-5 font-mono text-xs"
    >
      {/* Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-md ${
              isVerified
                ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                : 'bg-rose-950 border border-rose-800 text-rose-400'
            }`}
          >
            {isVerified ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                {isVerified ? 'Validação Post-Install: Confirmada e Verificada' : 'Falha no Post-Install ou Rollback'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  isVerified
                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                    : 'bg-rose-950 border border-rose-800 text-rose-300'
                }`}
              >
                STATUS: {installation.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{installation.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunInstall}
            disabled={isInstalling}
            className="px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reinstalar</span>
          </button>
          <button
            onClick={onTestRollback}
            disabled={isInstalling}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-rose-950/40 border border-rose-800/60 text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Simula erro de gravação para validar que o buffer temporário é mantido intacto"
          >
            Testar Rollback
          </button>
          <button
            onClick={onTestPermissionError}
            disabled={isInstalling}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-amber-950/40 border border-amber-800/60 text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Simula falha de permissão fs.constants.W_OK no destino"
          >
            Testar W_OK
          </button>
        </div>
      </div>

      {/* Grid de Verificação dos Arquivos Essenciais (index.js, package.json, .env) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            Checklist de Arquivos Essenciais no Diretório Raiz
          </span>
          <span className="text-slate-500">Bloqueio de pasta vazia ativado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. index.js */}
          <div
            className={`p-3 rounded-md border ${
              indexJsSpec?.present && indexJsSpec.sizeBytes > 0
                ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-sky-400" />
                <span className="font-bold">index.js</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  indexJsSpec?.present && indexJsSpec.sizeBytes > 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {indexJsSpec?.present && indexJsSpec.sizeBytes > 0 ? 'PRESENTE' : 'AUSENTE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ponto de entrada Node.js Core</p>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Bytes no disco:</span>
              <strong className="text-sky-400">{formatBytes(indexJsSpec?.sizeBytes || 0)}</strong>
            </div>
          </div>

          {/* 2. package.json */}
          <div
            className={`p-3 rounded-md border ${
              packageJsonSpec?.present && packageJsonSpec.sizeBytes > 0
                ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400" />
                <span className="font-bold">package.json</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  packageJsonSpec?.present && packageJsonSpec.sizeBytes > 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {packageJsonSpec?.present && packageJsonSpec.sizeBytes > 0 ? 'PRESENTE' : 'AUSENTE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Manifesto de execução e runtime</p>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Bytes no disco:</span>
              <strong className="text-sky-400">{formatBytes(packageJsonSpec?.sizeBytes || 0)}</strong>
            </div>
          </div>

          {/* 3. .env */}
          <div
            className={`p-3 rounded-md border ${
              envSpec?.present && envSpec.sizeBytes > 0
                ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-400" />
                <span className="font-bold">.env</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  envSpec?.present && envSpec.sizeBytes > 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {envSpec?.present && envSpec.sizeBytes > 0 ? 'PRESENTE' : 'AUSENTE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Secret Manager Sync</p>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Bytes no disco:</span>
              <strong className="text-sky-400">{formatBytes(envSpec?.sizeBytes || 0)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas e Detalhes da Execução */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-md">
          <span className="text-[10px] text-slate-500 uppercase block">Total Gravado</span>
          <strong className="text-sm font-bold text-sky-400 block mt-0.5">
            {formatBytes(installation.totalBytes)}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {installation.totalFiles} arquivos
          </span>
        </div>

        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-md">
          <span className="text-[10px] text-slate-500 uppercase block">Diretório Raiz</span>
          <strong className="text-xs font-bold text-slate-200 block mt-0.5 truncate" title={installation.rootDir}>
            {installation.rootDir}
          </strong>
          <span className="text-[10px] text-emerald-400 block mt-0.5">fs.constants.W_OK OK</span>
        </div>

        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-md">
          <span className="text-[10px] text-slate-500 uppercase block">Buffer Temporário</span>
          <strong className="text-xs font-bold text-slate-300 block mt-0.5 truncate">
            {installation.status === 'rolled_back' ? 'Preservado' : 'Limpo após commit'}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            .nexus_tmp_staging
          </span>
        </div>

        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-md">
          <span className="text-[10px] text-slate-500 uppercase block">Firestore Auditoria</span>
          <strong className="text-xs font-bold text-indigo-300 block mt-0.5 truncate flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>installations/{installation.installId.substring(0, 10)}</span>
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {installation.durationMs}ms
          </span>
        </div>
      </div>
    </div>
  );
};
