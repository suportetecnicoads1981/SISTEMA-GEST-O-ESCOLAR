import React, { useState, useEffect } from 'react';
import {
  Server,
  Download,
  UploadCloud,
  FileSpreadsheet,
  BarChart3,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderLock,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  Database,
  Radio,
  Clock,
  BookOpen,
  Cloud,
  FolderCheck,
  Zap,
  Cpu,
} from 'lucide-react';
import { InstallWizard } from './InstallWizard';
import { SmartDataTable } from './SmartDataTable';
import { PrintCanvas } from './PrintCanvas';
import { ParametricChartEngine } from './ParametricChartEngine';
import { UpdateImprovementPresentationModal } from './UpdateImprovementPresentationModal';
import {
  OmniDeployInstallationRecord,
  OmniDeployChartParametricConfig,
} from '../../types';
import {
  CANONICAL_OMNIDEPLOY_MANIFEST,
  checkFirebaseConnectivity,
  getStoredInstallationRecord,
  OMNI_DEPLOY_CURRENT_VERSION,
} from '../../services/firebaseDeployService';
import {
  generateOmniDeployManualHtml,
  buildOmniDeployZipBundle,
  OmniDeployConfig,
} from '../../utils/omniDeployGenerator';

interface OmniDeployHubProps {
  schoolName: string;
  onNavigate?: (tab: string, payload?: any) => void;
  onBack?: () => void;
}

type OmniDeployTab =
  | 'INSTALL_WIZARD'
  | 'SMART_IMPORT'
  | 'PARAMETRIC_CHARTS'
  | 'PRINT_CANVAS'
  | 'INTEGRITY_FIREBASE'
  | 'DOCUMENTATION';

export const OmniDeployHub: React.FC<OmniDeployHubProps> = ({
  schoolName,
  onNavigate,
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<OmniDeployTab>('INSTALL_WIZARD');
  const [installationRecord, setInstallationRecord] = useState<OmniDeployInstallationRecord | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<{
    authOnline: boolean;
    firestoreOnline: boolean;
    storageOnline: boolean;
    bucket: string;
  } | null>(null);
  const [isCheckingFirebase, setIsCheckingFirebase] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);

  // Carrega status salvo de instalação e verifica conectividade Firebase
  useEffect(() => {
    const record = getStoredInstallationRecord();
    if (record) {
      setInstallationRecord(record);
    }
    handleCheckFirebase();
  }, []);

  const handleCheckFirebase = async () => {
    setIsCheckingFirebase(true);
    try {
      const status = await checkFirebaseConnectivity();
      setFirebaseStatus(status);
    } catch (err) {
      console.error('Erro ao verificar Firebase:', err);
    } finally {
      setIsCheckingFirebase(false);
    }
  };

  const handleDownloadManual = () => {
    const cfg: OmniDeployConfig = {
      schoolName,
      serverPort: installationRecord?.activePort || 3000,
      serverIp: '192.168.1.100',
      targetPath: installationRecord?.rootDir || 'C:\\SucessoEdu',
      targetType: installationRecord?.targetType || 'HYBRID_SERVER',
    };
    const html = generateOmniDeployManualHtml(cfg);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Manual_Instalacao_OmniDeploy_${OMNI_DEPLOY_CURRENT_VERSION}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCompleteBundle = async () => {
    setIsGeneratingZip(true);
    try {
      const cfg: OmniDeployConfig = {
        schoolName,
        serverPort: installationRecord?.activePort || 3000,
        serverIp: '192.168.1.100',
        targetPath: installationRecord?.rootDir || 'C:\\SucessoEdu',
        targetType: installationRecord?.targetType || 'HYBRID_SERVER',
      };
      const blob = await buildOmniDeployZipBundle(cfg);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SucessoEdu_OmniDeploy_${OMNI_DEPLOY_CURRENT_VERSION}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar pacote:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="space-y-6 text-[#202124] animate-in fade-in overflow-y-auto max-h-[calc(100vh-4.5rem)] pr-1 sm:pr-2 text-xs sm:text-sm">
      {/* Banner Principal com Design System Material 3 */}
      <div className="bg-[#1a73e8] rounded-2xl p-4 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
            <Server className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                GOOGLE MATERIAL 3 • HÍBRIDO
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold bg-black/20 px-2 py-0.5 rounded-md">
                {OMNI_DEPLOY_CURRENT_VERSION}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              OmniDeploy • Sistema de Gestão e Instalação Híbrida
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Instalação modular desacoplada com preservação estrita de <code>/data</code>,
              validação de hash SHA-256, gráficos parametrizáveis e integração nativa com o Firebase.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPresentationModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Ver Melhorias da Versão</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('NEXUS_DEPLOYER')}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-mono font-bold transition-all border border-indigo-400/40 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Acessar NexusDeployer: Provisionamento Raiz 12/12 e Bundling Firebase"
          >
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>NexusDeployer (12/12)</span>
          </button>
          <button
            onClick={handleDownloadCompleteBundle}
            disabled={isGeneratingZip}
            className="px-3.5 py-2 rounded-xl bg-white text-[#1a73e8] hover:bg-blue-50 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingZip ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>Baixar Pacote Híbrido ZIP</span>
          </button>
        </div>
      </div>

      {/* Barra de Status Rápido Híbrido & Firebase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block">Diretório Raiz</span>
            <strong className="text-xs font-mono text-slate-800">
              {installationRecord?.rootDir || 'C:\\SucessoEdu'}
            </strong>
          </div>
          <FolderLock className="h-5 w-5 text-[#1a73e8]" />
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block">Preservação /data</span>
            <strong className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Protegido 100%</span>
            </strong>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Zero Data Loss
          </span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block">Firebase Cloud</span>
            <strong className="text-xs text-slate-800">
              {firebaseStatus?.firestoreOnline ? 'Firestore & Storage Ativos' : 'Conectando / Standby'}
            </strong>
          </div>
          <Cloud className="h-5 w-5 text-indigo-600" />
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block">Porta de Rede</span>
            <strong className="text-xs font-mono text-slate-800">
              TCP {installationRecord?.activePort || 8088} (Liberada)
            </strong>
          </div>
          <Radio className="h-5 w-5 text-amber-500" />
        </div>
      </div>

      {/* Abas Principais de Navegação do OmniDeploy */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-px overflow-x-auto scrollbar-none text-xs font-bold">
        {[
          { id: 'INSTALL_WIZARD' as OmniDeployTab, label: 'Assistente de Instalação (Wizard)', icon: Server },
          { id: 'SMART_IMPORT' as OmniDeployTab, label: 'Importador Inteligente', icon: FileSpreadsheet },
          { id: 'PARAMETRIC_CHARTS' as OmniDeployTab, label: 'Gráficos Parametrizáveis', icon: BarChart3 },
          { id: 'PRINT_CANVAS' as OmniDeployTab, label: 'PrintCanvas & Dispositivos', icon: Printer },
          { id: 'DOCUMENTATION' as OmniDeployTab, label: 'Manuais & Changelog', icon: FileText },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#1a73e8] border-t-2 border-x border-[#1a73e8] border-b-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-t-2 border-transparent'
              }`}
            >
              <tab.icon className={`h-4 w-4 ${isActive ? 'text-[#1a73e8]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Dinâmico da Aba Ativa */}
      <div>
        {activeSubTab === 'INSTALL_WIZARD' && (
          <InstallWizard
            schoolName={schoolName}
            defaultPort={8088}
            onFinished={(record) => {
              setInstallationRecord(record);
            }}
          />
        )}

        {activeSubTab === 'SMART_IMPORT' && (
          <SmartDataTable
            onCommitImport={(entity, records) => {
              console.log(`[SmartDataTable] Ingestão concluída para ${entity}:`, records.length);
            }}
          />
        )}

        {activeSubTab === 'PARAMETRIC_CHARTS' && (
          <ParametricChartEngine
            onSendToPrintCanvas={() => {
              setActiveSubTab('PRINT_CANVAS');
            }}
          />
        )}

        {activeSubTab === 'PRINT_CANVAS' && (
          <PrintCanvas schoolName={schoolName} />
        )}

        {activeSubTab === 'DOCUMENTATION' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manuais Automatizados e Notas de Versão</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documentação compilada em tempo real para equipes de TI e secretaria escolar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadManual}
                  className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Manual em HTML/PDF</span>
                </button>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Changelog Oficial ({CANONICAL_OMNIDEPLOY_MANIFEST.version})
              </h4>
              <div className="space-y-2">
                {CANONICAL_OMNIDEPLOY_MANIFEST.releaseNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guia Rápido de Comandos */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2 font-mono text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Comando Rápido de Instalação Silenciosa (PowerShell Admin)
              </div>
              <pre className="overflow-x-auto text-emerald-400">
                powershell -ExecutionPolicy Bypass -File "C:\SucessoEdu\bin\instalar_omnideploy.ps1"
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Modal Obrigatório de Apresentação de Melhorias */}
      <UpdateImprovementPresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
        systemVersion={OMNI_DEPLOY_CURRENT_VERSION}
      />
    </div>
  );
};
