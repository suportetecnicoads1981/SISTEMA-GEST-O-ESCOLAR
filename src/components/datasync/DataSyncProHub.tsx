import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  UploadCloud,
  Terminal,
  Archive,
  HardDrive,
  Key,
  Globe,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Lock,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { SupabaseConnectionService, SUPABASE_CONFIG } from '../../services/datasync/supabaseClient';
import { SmartUploader } from './SmartUploader';
import { SQLArchitect } from './SQLArchitect';
import { SafetyVaultDashboard } from './SafetyVaultDashboard';
import { StorageControllerView } from './StorageControllerView';
import { AuthAutomatorView } from './AuthAutomatorView';
import { SupabaseLiveDatabaseView } from './SupabaseLiveDatabaseView';
import { SchemaManager } from '../../services/datasync/SchemaManager';
import { StorageController } from '../../services/datasync/StorageController';
import { BackupZipRecord, StoredAsset } from '../../types/datasync';
import { RelationalIntegrityDashboard } from '../admin/RelationalIntegrityDashboard';
import { getStoredData, AppStateData } from '../../data/storage';

type DataSyncTab =
  | 'DATABASE_SYNC'
  | 'UPLOADER'
  | 'SQL_ARCHITECT'
  | 'RELATIONAL_INTEGRITY'
  | 'SAFETY_VAULT'
  | 'STORAGE_FILES'
  | 'AUTH_AUTOMATOR';

export const DataSyncProHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DataSyncTab>('DATABASE_SYNC');
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    latencyMs: number;
    statusText: string;
    isChecking: boolean;
  }>({
    isConnected: true,
    latencyMs: 28,
    statusText: 'Supabase Cloud Conectado (TLS 1.3)',
    isChecking: false,
  });

  const [backupList, setBackupList] = useState<BackupZipRecord[]>(() => SchemaManager.getBackupHistory());
  const [storedAssets, setStoredAssets] = useState<StoredAsset[]>(() => StorageController.getAssets());
  const [appData, setAppData] = useState<AppStateData>(() => getStoredData());

  const handleTestConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, isChecking: true }));
    const result = await SupabaseConnectionService.testConnection();
    setConnectionStatus({
      isConnected: result.success,
      latencyMs: result.latencyMs,
      statusText: result.statusText,
      isChecking: false,
    });
  };

  useEffect(() => {
    handleTestConnection();
  }, []);

  const handleBackupGenerated = (newBackup: BackupZipRecord) => {
    setBackupList(SchemaManager.getBackupHistory());
  };

  const handleAssetUploaded = (newAsset: StoredAsset) => {
    setStoredAssets([...StorageController.getAssets()]);
  };

  const handleAssetDeleted = (deletedId: string) => {
    setStoredAssets([...StorageController.getAssets()]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner de Conexão e Identidade DataSync Pro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow decorativo sutil */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Database className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-50">
                    DataSync Pro
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500 text-slate-950">
                    SUPABASE v12.2
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Safe-Mode Híbrido
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Sistema Integrado Supabase: Controle Total de Schema, Backups Consolidados em ZIP (.zip) e Gestão de Storage WebP Universal.
                </p>
              </div>
            </div>
          </div>

          {/* Card de Status de Alta Disponibilidade */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-400 font-medium">Cluster Supabase:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {connectionStatus.latencyMs}ms (Ativo)
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 truncate max-w-[280px]">
                {SUPABASE_CONFIG.restEndpoint}
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={connectionStatus.isChecking}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow"
              title="Testar Conexão com Endpoint Supabase"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-400 ${
                  connectionStatus.isChecking ? 'animate-spin' : ''
                }`}
              />
              Testar Conexão
            </button>
          </div>
        </div>

        {/* Barra de Metadados de Infraestrutura */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px]">Anon Key (Public)</span>
            <div className="text-slate-300 font-bold truncate">
              {SUPABASE_CONFIG.anonKey.substring(0, 16)}...
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px]">Storage Buckets</span>
            <div className="text-emerald-400 font-bold">
              'vault' & 'public-assets' (Máx 10MB)
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px]">Segurança Auto-RLS</span>
            <div className="text-emerald-400 font-bold">
              Ativo (auth.uid() isolado)
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px]">Pipeline WebP</span>
            <div className="text-amber-300 font-bold">
              GIF Animado + Imagens
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de Abas do DataSync Pro */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('DATABASE_SYNC')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'DATABASE_SYNC'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Banco de Dados & Sync Live
        </button>

        <button
          onClick={() => setActiveTab('UPLOADER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'UPLOADER'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          SmartUploader (WebP & GIFs)
        </button>

        <button
          onClick={() => setActiveTab('SQL_ARCHITECT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SQL_ARCHITECT'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          SQLArchitect (Kill Switch & Safe-Mode)
        </button>

        <button
          onClick={() => setActiveTab('RELATIONAL_INTEGRITY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RELATIONAL_INTEGRITY'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Integridade Relacional (FK & Normalização)
        </button>

        <button
          onClick={() => setActiveTab('SAFETY_VAULT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SAFETY_VAULT'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          SafetyVault (RLS & Backups ZIP)
        </button>

        <button
          onClick={() => setActiveTab('STORAGE_FILES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'STORAGE_FILES'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Arquivos no Storage ({storedAssets.length})
        </button>

        <button
          onClick={() => setActiveTab('AUTH_AUTOMATOR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AUTH_AUTOMATOR'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          AuthAutomator (Redirects & Logs)
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      <div className="space-y-6">
        {activeTab === 'DATABASE_SYNC' && (
          <SupabaseLiveDatabaseView />
        )}

        {activeTab === 'UPLOADER' && (
          <div className="space-y-6">
            <SmartUploader onAssetUploaded={handleAssetUploaded} />
            <StorageControllerView
              assets={storedAssets}
              onAssetDeleted={handleAssetDeleted}
            />
          </div>
        )}

        {activeTab === 'SQL_ARCHITECT' && (
          <SQLArchitect onBackupGenerated={handleBackupGenerated} />
        )}

        {activeTab === 'RELATIONAL_INTEGRITY' && (
          <RelationalIntegrityDashboard
            appData={appData}
            onUpdateData={(d) => setAppData(d)}
            onRefresh={() => setAppData(getStoredData())}
          />
        )}

        {activeTab === 'SAFETY_VAULT' && (
          <SafetyVaultDashboard backupList={backupList} />
        )}

        {activeTab === 'STORAGE_FILES' && (
          <StorageControllerView
            assets={storedAssets}
            onAssetDeleted={handleAssetDeleted}
          />
        )}

        {activeTab === 'AUTH_AUTOMATOR' && <AuthAutomatorView />}
      </div>
    </div>
  );
};
