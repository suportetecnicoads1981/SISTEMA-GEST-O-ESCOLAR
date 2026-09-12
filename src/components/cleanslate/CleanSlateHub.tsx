import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  DownloadCloud,
  Terminal,
  Lock,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Activity,
  Layers,
  FileCheck2,
  Database,
  Radio,
} from 'lucide-react';
import { ZeroDataBuildPanel } from './ZeroDataBuildPanel';
import { GDriveChunkUpdater } from './GDriveChunkUpdater';
import { EphemeralTerminalCLI } from './EphemeralTerminalCLI';
import { LgpdPrivacyDashboard } from './LgpdPrivacyDashboard';
import { LgpdConsentModal } from './LgpdConsentModal';
import { LgpdSecurityService } from '../../services/cleanslate/LgpdSecurityService';
import { LgpdConsentPreferences } from '../../types/cleanslate';

interface CleanSlateHubProps {
  schoolName?: string;
  onNavigate?: (tab: string) => void;
  onBack?: () => void;
}

export const CleanSlateHub: React.FC<CleanSlateHubProps> = ({
  schoolName = 'SucessoEdu Gestão Educacional',
  onNavigate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'ZERO_DATA' | 'GDRIVE_STREAM' | 'EPHEMERAL_CLI' | 'LGPD_PRIVACY'>('ZERO_DATA');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentPrefs, setConsentPrefs] = useState<LgpdConsentPreferences | null>(() =>
    LgpdSecurityService.getStoredConsent()
  );

  // Exibe o modal de consentimento se ainda não foi definido
  useEffect(() => {
    if (!consentPrefs) {
      setIsConsentModalOpen(true);
    }
  }, [consentPrefs]);

  const handleConsentAccepted = (prefs: LgpdConsentPreferences) => {
    LgpdSecurityService.saveConsent(prefs);
    setConsentPrefs(prefs);
    setIsConsentModalOpen(false);
  };

  const handleConsentDeclined = () => {
    const minimal: LgpdConsentPreferences = {
      technicalTelemetry: false,
      performanceDiagnostics: false,
      crashReports: false,
      acceptedAt: new Date().toISOString(),
      consentVersion: 'v2.1-MINIMAL',
    };
    LgpdSecurityService.saveConsent(minimal);
    setConsentPrefs(minimal);
    setIsConsentModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-200">
      {/* Top Banner de Navegação & Identidade Enterprise */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-md transition-colors cursor-pointer"
                title="Voltar ao Painel Geral"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  CLEANSLATE ENTERPRISE HUB • ELECTRON, REACT &amp; SUPABASE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-950 text-slate-400 border border-slate-800">
                  v5.6.0-ENTERPRISE-LTS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                Infraestrutura Desktop Blindada &amp; Gestão Remota LGPD
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Plataforma desktop de alta segurança com foco em <strong>Produção Zero-Data</strong> (purificação de seeds), <strong>Atualizações Fracionadas em Chunks de 64MB via Google Drive</strong> com Self-Healing e <strong>Terminal Efêmero (Ephemeral CLI)</strong> com comandos assinados via Ed25519 e Supabase Realtime (Client-Only Outbound).
              </p>
            </div>
          </div>

          {/* Status Pills e Botão de Consentimento */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Supabase Realtime:</span>
              <span className="text-emerald-400 font-bold">WSS Ativo</span>
            </div>

            <button
              onClick={() => setIsConsentModalOpen(true)}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir configurações de consentimento LGPD"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Consent Mode LGPD</span>
            </button>
          </div>
        </div>

        {/* Abas de Navegação do CleanSlate Hub */}
        <div className="flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('ZERO_DATA')}
            className={`px-3.5 py-2 rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'ZERO_DATA'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>1. Produção Zero-Data (Purificador)</span>
          </button>

          <button
            onClick={() => setActiveTab('GDRIVE_STREAM')}
            className={`px-3.5 py-2 rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'GDRIVE_STREAM'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            <span>2. Updates GDrive (Chunks 64MB &amp; Self-Healing)</span>
          </button>

          <button
            onClick={() => setActiveTab('EPHEMERAL_CLI')}
            className={`px-3.5 py-2 rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'EPHEMERAL_CLI'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>3. Ephemeral CLI (Comandos Ed25519)</span>
          </button>

          <button
            onClick={() => setActiveTab('LGPD_PRIVACY')}
            className={`px-3.5 py-2 rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'LGPD_PRIVACY'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>4. Blindagem LGPD (Hardware Hashing &amp; TTL 90d)</span>
          </button>
        </div>
      </div>

      {/* Renderização da Aba Ativa */}
      {activeTab === 'ZERO_DATA' && <ZeroDataBuildPanel />}

      {activeTab === 'GDRIVE_STREAM' && <GDriveChunkUpdater />}

      {activeTab === 'EPHEMERAL_CLI' && <EphemeralTerminalCLI />}

      {activeTab === 'LGPD_PRIVACY' && <LgpdPrivacyDashboard />}

      {/* Modal de Consentimento LGPD */}
      <LgpdConsentModal
        isOpen={isConsentModalOpen}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />
    </div>
  );
};
