import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  ShieldCheck,
  Box,
  Cpu,
  Layers,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HardDrive,
  Wrench
} from 'lucide-react';
import { NetworkMonitor } from './NetworkMonitor';
import { VisualValidator } from './VisualValidator';
import { PackagerUI } from './PackagerUI';
import { NexusInstallService } from '../../services/nexusinstall/NexusInstallService';
import {
  NetworkDetectionResult,
  VisualAuditReport,
  CompactPackageResult
} from '../../types/nexusinstall';

interface NexusInstallHubProps {
  onNavigate?: (tab: string, payload?: any) => void;
  onBack?: () => void;
}

export const NexusInstallHub: React.FC<NexusInstallHubProps> = ({
  onNavigate,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'NETWORK' | 'VALIDATOR' | 'PACKAGER'>('ALL');

  // Estado da Fase 1 - NetworkMonitor
  const [networkData, setNetworkData] = useState<NetworkDetectionResult | null>(null);
  const [isNetworkLoading, setIsNetworkLoading] = useState(false);

  // Estado da Fase 2 - VisualValidator
  const [auditReport, setAuditReport] = useState<VisualAuditReport | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isSimulatingMismatch, setIsSimulatingMismatch] = useState(false);

  // Estado da Fase 3 - PackagerUI
  const [packageResult, setPackageResult] = useState<CompactPackageResult | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicialização ao carregar
  useEffect(() => {
    loadNetworkDetection();
    runVisualAudit();
  }, []);

  const loadNetworkDetection = async () => {
    setIsNetworkLoading(true);
    try {
      const data = await NexusInstallService.detectNetwork(3000);
      setNetworkData(data);
      // Persiste no Secret Manager simulado
      await NexusInstallService.persistNetworkConfig(data.allocatedPort, data.primaryIp);
    } catch (err: any) {
      console.error('Erro na detecção de rede:', err);
    } finally {
      setIsNetworkLoading(false);
    }
  };

  const runVisualAudit = async () => {
    setIsAuditLoading(true);
    try {
      const report = await NexusInstallService.runVisualAudit();
      setAuditReport(report);
      // Se tiver gerado pacote anterior e o layout divergir, limpa o pacote
      if (!report.isParityVerified) {
        setPackageResult(null);
      }
    } catch (err: any) {
      console.error('Erro na auditoria visual:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleToggleSimulatedMismatch = () => {
    const nextVal = !isSimulatingMismatch;
    setIsSimulatingMismatch(nextVal);
    NexusInstallService.setSimulateMismatch(nextVal);
    runVisualAudit();
  };

  const handleGeneratePackage = async (): Promise<CompactPackageResult> => {
    setErrorMessage(null);
    setIsPackaging(true);
    try {
      const port = networkData?.allocatedPort || 3001;
      const ip = networkData?.primaryIp || '192.168.1.105';
      const isParity = auditReport?.isParityVerified ?? true;

      const result = await NexusInstallService.buildCompactInstaller(port, ip, isParity);
      setPackageResult(result);
      return result;
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao empacotar instalador');
      throw err;
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Barra de Topo / Header do Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-md hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-slate-50 shadow">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-50 tracking-tight">
                  NexusInstall
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono font-bold">
                  v2026.2 PRO
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Gerenciador de Módulos, Portas Dinâmicas & Empacotador de Instalador Único
              </span>
            </div>
          </div>
        </div>

        {/* Badges de Status do Hub */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status de Porta */}
          <div className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Porta Ativa:</span>
            <span className="font-mono font-bold text-slate-100">
              :{networkData?.allocatedPort || '3001'}
            </span>
          </div>

          {/* Status de Paridade */}
          <div className={`px-3 py-1.5 rounded-md border flex items-center gap-2 text-xs font-semibold ${
            auditReport?.isParityVerified
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {auditReport?.isParityVerified ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {auditReport?.isParityVerified ? 'Paridade 100%' : 'Mismatch Detectado'}
            </span>
          </div>

          {/* Navegação rápida para NexusBuild */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('NEXUS_BUILD')}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Ir para o Instalador Total (C:\SucessoEduSistema)"
            >
              <Wrench className="w-3.5 h-3.5" />
              SucessoEduSistema Total .EXE
            </button>
          )}

          {/* Navegação rápida para NexusDeployer */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('NEXUS_DEPLOYER')}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              NexusDeployer Root
            </button>
          )}
        </div>
      </div>

      {/* Tabs de Filtro de Visualização */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-slate-50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Visão Completa (Fases 1, 2 e 3)
        </button>
        <button
          onClick={() => setActiveTab('NETWORK')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'NETWORK'
              ? 'bg-blue-600 text-slate-50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Fase 1: Redes & Portas
        </button>
        <button
          onClick={() => setActiveTab('VALIDATOR')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'VALIDATOR'
              ? 'bg-blue-600 text-slate-50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Fase 2: Paridade Visual & Hashes
        </button>
        <button
          onClick={() => setActiveTab('PACKAGER')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PACKAGER'
              ? 'bg-blue-600 text-slate-50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          Fase 3: Empacotador 1-Clique
        </button>
      </div>

      {/* Alerta Global de Erro se houver */}
      {errorMessage && (
        <div className="bg-amber-950/50 border border-amber-500/50 rounded-md p-4 text-xs text-amber-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 font-mono">
            <strong>Bloqueio de Segurança:</strong> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-amber-200 text-xs underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* COMPONENTES DAS 3 FASES */}
      <div className="space-y-6">
        {/* FASE 1: NETWORK MONITOR */}
        {(activeTab === 'ALL' || activeTab === 'NETWORK') && (
          <NetworkMonitor
            data={networkData}
            isLoading={isNetworkLoading}
            onRefresh={loadNetworkDetection}
          />
        )}

        {/* FASE 2: VISUAL VALIDATOR */}
        {(activeTab === 'ALL' || activeTab === 'VALIDATOR') && (
          <VisualValidator
            report={auditReport}
            isLoading={isAuditLoading}
            onRunAudit={runVisualAudit}
            onToggleSimulatedMismatch={handleToggleSimulatedMismatch}
            isSimulatingMismatch={isSimulatingMismatch}
          />
        )}

        {/* FASE 3: PACKAGER UI */}
        {(activeTab === 'ALL' || activeTab === 'PACKAGER') && (
          <PackagerUI
            allocatedPort={networkData?.allocatedPort || 3001}
            allocatedIp={networkData?.primaryIp || '192.168.1.105'}
            isParityVerified={auditReport?.isParityVerified ?? true}
            onGeneratePackage={handleGeneratePackage}
            packageResult={packageResult}
            isPackaging={isPackaging}
          />
        )}
      </div>

      {/* Rodapé Informativo do NexusInstall */}
      <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
        <div className="flex items-center gap-2">
          <span>NexusInstall Enterprise Specification</span>
          <span>•</span>
          <span>Google AI Studio / Antigravity Compliant</span>
        </div>
        <div>
          <span>Secret Vault: Google Cloud Secret Manager & Volatile .env Sync</span>
        </div>
      </div>
    </div>
  );
};
