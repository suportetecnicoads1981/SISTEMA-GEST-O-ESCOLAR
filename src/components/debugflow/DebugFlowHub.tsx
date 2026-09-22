import React, { useState } from 'react';
import {
  ShieldAlert,
  Cpu,
  Database,
  Archive,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { BuildStatusDashboard } from './BuildStatusDashboard';
import { SchemaSyncTable } from './SchemaSyncTable';
import { GlobalBackupManager } from './GlobalBackupManager';

interface DebugFlowHubProps {
  onBack?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export type DebugFlowTab = 'BUILD_STATUS' | 'SCHEMA_SYNC' | 'GLOBAL_BACKUP';

export const DebugFlowHub: React.FC<DebugFlowHubProps> = ({ onBack, onNavigateToTab }) => {
  const [activeTab, setActiveTab] = useState<DebugFlowTab>('BUILD_STATUS');

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Hub */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-[#f8fafc] rounded-lg transition-colors border border-slate-700 shadow-sm"
                  title="Voltar ao Painel Principal"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#f8fafc] tracking-tight">
                    DebugFlow & Full-Stack Audit
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Supabase Engine
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#94a3b8]">
                  Auditoria técnica de compilação, integridade de schema e rotina de backup full-stack sincronizado (DB Dump + Build Assets).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex flex-wrap items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-inner gap-1">
            <button
              onClick={() => setActiveTab('BUILD_STATUS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                activeTab === 'BUILD_STATUS'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Build Scanner
            </button>

            <button
              onClick={() => setActiveTab('SCHEMA_SYNC')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                activeTab === 'SCHEMA_SYNC'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              Schema & RLS Bridge
            </button>

            <button
              onClick={() => setActiveTab('GLOBAL_BACKUP')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                activeTab === 'GLOBAL_BACKUP'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-slate-800'
              }`}
            >
              <Archive className="w-4 h-4" />
              Full-Stack Backup
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Component */}
      {activeTab === 'BUILD_STATUS' && <BuildStatusDashboard />}
      {activeTab === 'SCHEMA_SYNC' && <SchemaSyncTable />}
      {activeTab === 'GLOBAL_BACKUP' && <GlobalBackupManager />}
    </div>
  );
};
