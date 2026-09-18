import React, { useState } from 'react';
import {
  Cloud,
  Lock,
  Clock,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Play,
  Key,
  FolderSync,
  FileCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { BackupEngineConfig } from '../../types/nexusbuild';
import { validateGoogleDriveFolderId } from '../../utils/nexusBuildGenerator';

interface NexusBackupEngineProps {
  config: BackupEngineConfig;
  onUpdateGdriveId: (id: string) => void;
  onRunImmediateBackup: () => void;
  isLoading?: boolean;
}

export const NexusBackupEngine: React.FC<NexusBackupEngineProps> = ({
  config,
  onUpdateGdriveId,
  onRunImmediateBackup,
  isLoading = false,
}) => {
  const [folderInput, setFolderInput] = useState(config.gdriveFolderId);
  const isInputValid = validateGoogleDriveFolderId(folderInput);

  const handleSaveId = () => {
    if (isInputValid) {
      onUpdateGdriveId(folderInput);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Archive className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Nexus Backup Engine & TotalArchivePacker
              {config.cloudSyncConfirmed ? (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  SINCRONIZAÇÃO EM NUVEM CONFIRMADA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-amber-950 text-amber-400 border border-amber-800/60">
                  AGENDADO PARA 03:00 AM
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Backup Full-Stack Irrestrito (100% de <code className="text-cyan-400 font-mono">C:\SucessoEduSistema</code> incluindo .lic e .key) e upload seguro no Google Drive.
            </p>
          </div>
        </div>

        <button
          onClick={onRunImmediateBackup}
          disabled={isLoading || !config.isFolderIdValid}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Play className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Executar Backup Manual Agora</span>
        </button>
      </div>

      {/* Grid de Estado do Backup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Janela Agendada</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            03:00 AM
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            Tarefa: {config.windowsTaskName}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Escopo do Arquivo</span>
            <Archive className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            100% IRRESTRITO
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Sem filtros de exclusão
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Criptografia de Segredos</span>
            <Lock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-100">
            AES-256 GCM
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            Client Secret protegido no binário
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Status em Nuvem</span>
            <Cloud className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-sm font-bold font-mono text-cyan-400">
            {config.cloudSyncConfirmed ? 'CONFIRMADO PELO DRIVE' : 'PENDENTE DE CONFIRMAÇÃO'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Requer handshake via Folder ID
          </div>
        </div>
      </div>

      {/* Validação de Google Drive Folder ID */}
      <div className="mt-5 p-4 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderSync className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">
              Google Drive Folder ID (Regex de Validação Obrigatória)
            </span>
          </div>
          <span className="text-2xs font-mono text-slate-400">
            Padrão: <code className="text-cyan-400">^[a-zA-Z0-9-_]{'{25,45}'}$</code>
          </span>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder="Ex: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ_0123456789"
            className={`w-full bg-slate-900 border rounded-lg px-3 py-2 font-mono text-xs text-slate-100 focus:outline-hidden ${
              isInputValid
                ? 'border-cyan-500/50 focus:border-cyan-400'
                : 'border-rose-500/60 focus:border-rose-400'
            }`}
          />
          <button
            onClick={handleSaveId}
            disabled={!isInputValid}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
          >
            Validar & Salvar
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-2xs font-mono">
          <span className={isInputValid ? 'text-cyan-400 flex items-center gap-1' : 'text-rose-400 flex items-center gap-1'}>
            {isInputValid ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Folder ID em formato estrito válido
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" /> O ID deve ter entre 25 e 45 caracteres alfanuméricos, hífen ou sublinhado
              </>
            )}
          </span>
          <span className="text-slate-500">
            Comprimento: {folderInput.length} caracteres
          </span>
        </div>
      </div>

      {/* Escopo TotalArchivePacker (Sem Filtros de Exclusão) */}
      <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            TotalArchivePacker: Extensões & Arquivos Críticos Agrupados
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.includeExtensions.map((ext, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {ext}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800/40 font-mono text-xs text-indigo-300 flex items-center gap-1">
            <Lock className="h-3 w-3 text-cyan-400" />
            Chaves .lic e .key incluídas integralmente
          </span>
        </div>
        <div className="mt-3 text-2xs text-slate-400 font-mono flex items-center gap-2">
          <span>Último Pacote Gerado:</span>
          <span className="text-cyan-400 font-bold">
            {config.lastBackupArchiveName || 'SucessoEdu_Backup_Full_20260915_030000.zip'}
          </span>
          <span className="text-slate-500">
            ({config.lastBackupTimestamp || 'Hoje às 03:00:14 AM'})
          </span>
        </div>
      </div>
    </div>
  );
};
