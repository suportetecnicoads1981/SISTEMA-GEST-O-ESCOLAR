import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FolderLock,
  Lock,
  Cloud,
  RefreshCw,
  HardDrive,
  Cpu,
  Terminal,
  FileCode,
  DownloadCloud,
  FileText,
  RotateCcw,
  Box,
  Wrench,
  Copy,
  Check,
  Activity,
  ArrowRight,
  ExternalLink,
  Download,
  Layers,
} from 'lucide-react';
import {
  NexusDeployerTelemetry,
  NexusProvisionResult,
  NexusBundleMetadata,
  NexusAuditEntry,
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
  // Enhanced props for 3-column Grid dashboard:
  auditHistory?: NexusAuditEntry[];
  logs?: string[];
  onNavigateTab?: (tab: 'DASHBOARD' | 'NEXUSCORE_PROD' | 'PROVISIONING' | 'CLOUD_BUNDLING' | 'AUDIT' | 'TERMINAL') => void;
  onNavigateExternal?: (tab: string) => void;
  onTestRollback?: () => void;
  onDownloadPackage?: () => void;
  isDownloading?: boolean;
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
  auditHistory = [],
  logs = [],
  onNavigateTab,
  onNavigateExternal,
  onTestRollback,
  onDownloadPackage,
  isDownloading = false,
}) => {
  const totalRequired = telemetry.totalRequired || CANONICAL_ROOT_FILES.length;
  const verifiedCount = lastProvisionResult?.presentFiles ?? 0;
  const isAllVerified = verifiedCount === totalRequired && verifiedCount > 0;

  const [auditFilter, setAuditFilter] = useState<'ALL' | 'INTEGRIDADE' | 'ATUALIZAÇÃO' | 'SEGURANÇA'>('ALL');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);

  const copyHash = (hash: string, id: string) => {
    try {
      navigator.clipboard.writeText(hash);
      setCopiedHashId(id);
      setTimeout(() => setCopiedHashId(null), 2000);
    } catch (e) {
      console.warn('Erro ao copiar hash:', e);
    }
  };

  const filteredAudits = auditHistory.filter((entry) => {
    if (auditFilter === 'ALL') return true;
    return entry.category === auditFilter;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner de Diagnóstico do Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              DASHBOARD CENTRAL DE TI
            </span>
            <span className="text-xs font-mono text-slate-400">
              Diretório Alvo: {telemetry.rootDir || 'C:\\SucessoEdu'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            Cockpit de Deploy, Integridade de Raiz e Auditoria
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            {lastProvisionResult?.message ||
              'Instalação e integridade operacional dos 12 arquivos canônicos validados com sucesso.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('NEXUSCORE_PROD')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-indigo-500/40"
              title="Acessar painel consolidado de Deploy do NexusCore ERP (Auth, CRM, Financeiro, Inventário)"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-200" />
              <span>Deploy NexusCore Produção</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Revalidar diretório raiz e status dos serviços"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
            <span>Health Check</span>
          </button>

          {onOpenAuditReport && (
            <button
              onClick={onOpenAuditReport}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Gerar e exportar laudo técnico de auditoria em PDF"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Exportar Laudo PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* GRID PRINCIPAL EM 3 COLUNAS DO GESTOR DE TI */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ======================================================== */}
        {/* COLUNA 1: STATUS DE SAÚDE (HEALTH & INFRASTRUCTURE) */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Header do Card */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">Status de Saúde</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Diretórios, IAM e Rollback</p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold ${
                  isAllVerified
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}
              >
                {isAllVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    CONFORME ({totalRequired}/{totalRequired})
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-amber-400" />
                    ALERTA ({verifiedCount}/{totalRequired})
                  </>
                )}
              </span>
            </div>

            {/* Sub-Card: Diretório Raiz & Permissões */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5 text-indigo-400" />
                  Diretório Raiz
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">POSIX 0o775 OK</span>
              </div>
              <div className="font-bold text-slate-100 truncate text-xs">
                {telemetry.rootDir || 'C:\\SucessoEdu'}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Ponteiro de escrita W_OK válido • Injeção atômica de arquivos
              </p>
            </div>

            {/* Sub-Card: GCP Secret Manager & IAM */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  GCP Secret Manager
                </span>
                <span className="text-indigo-300 text-[10px] font-bold">8 Chaves Ativas</span>
              </div>
              <div className="text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>IAM Elevado &amp; Protegido</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Zero chaves hardcoded no código • Injeção direta no .env
              </p>
            </div>

            {/* Sub-Card: Rollback Guard Atômico */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                  <FolderLock className="h-3.5 w-3.5 text-amber-400" />
                  Rollback Guard
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">Atômico Ativo</span>
              </div>
              <div className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Buffer: .nexus_tmp_staging</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Limpeza seletiva em caso de falha • Diretório /data blindado
              </p>
            </div>

            {/* Sub-Card: Firebase Storage & Releases */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Cloud className="h-3.5 w-3.5 text-indigo-400" />
                  Firebase Releases
                </span>
                <span className="text-indigo-400 text-[10px] font-bold">Canal STABLE</span>
              </div>
              <div className="text-indigo-300 font-bold text-xs truncate">
                {latestBundle?.version || 'v5.5.0-NEXUS'}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight truncate">
                Firestore: nexus_releases • Bucket operacional
              </p>
            </div>

            {/* Botão de Validação Rápida */}
            <button
              onClick={onRefresh}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
              <span>Executar Diagnóstico Geral</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA 2: FERRAMENTAS DE DEPLOY (DEPLOY TOOLS & PIPELINES) */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Header do Card */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/80">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">Ferramentas de Deploy</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Pipelines, ZipEngine e Atalhos</p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                v5.5.0
              </span>
            </div>

            {/* Ações de Pipeline Principal */}
            <div className="space-y-2.5">
              {/* Botão 1: Executar Instalação Raiz (NexusInstall) */}
              <button
                onClick={onTriggerProvision}
                disabled={isProvisioning}
                className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  {isProvisioning ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Server className="h-4 w-4 text-white" />
                  )}
                  <div className="text-left">
                    <div>Executar Instalação Raiz</div>
                    <div className="text-[10px] text-indigo-200 font-normal">
                      Staging Buffer -&gt; Commit Atômico 12/12
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Botão 2: Testar Rollback Atômico */}
              {onTestRollback && (
                <button
                  onClick={onTestRollback}
                  disabled={isProvisioning}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-300 hover:text-rose-200 font-mono text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                  title="Simula falha de gravação para testar reversão segura"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                    <span>Testar Rollback Atômico</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Reversão Segura</span>
                </button>
              )}

              {/* Botão 3: Preparar Update (Cloud Bundling / ZipEngine) */}
              <button
                onClick={onTriggerPrepareUpdate}
                disabled={isPackaging}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-mono text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {isPackaging ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <DownloadCloud className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  <span>Preparar Pacote (ZipEngine)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Compressão 64MB</span>
              </button>

              {/* Botão 4: Download de Pacote ZIP */}
              {onDownloadPackage && (
                <button
                  onClick={onDownloadPackage}
                  disabled={isDownloading}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-mono text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {isDownloading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                    <span>Baixar Instalador ZIP Completo</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">~1.48 MB</span>
                </button>
              )}
            </div>

            {/* Módulos de Deploy Relacionados */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                Módulos de Instalação Conectados
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() => onNavigateExternal && onNavigateExternal('NEXUS_INSTALL')}
                  className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                    <Box className="h-3.5 w-3.5" />
                    <span>NexusInstall</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Portas UDP &amp; 1-Clique</p>
                </button>

                <button
                  onClick={() => onNavigateExternal && onNavigateExternal('NEXUS_BUILD')}
                  className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>NexusBuild</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Instalador .EXE</p>
                </button>
              </div>
            </div>

            {/* Matriz Compacta dos 12 Arquivos Canônicos */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                  Matriz Canônica ({verifiedCount}/{totalRequired})
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('PROVISIONING')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold"
                  >
                    Ver Tudo →
                  </button>
                )}
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
                {CANONICAL_ROOT_FILES.slice(0, 5).map((file) => {
                  const rec = lastProvisionResult?.files.find((f) => f.name === file.name);
                  const isOk = rec?.status === 'VERIFIED';
                  return (
                    <div
                      key={file.name}
                      className="p-1.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-300 truncate max-w-[140px]">{file.name}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded-sm font-bold ${
                          isOk
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isOk ? 'VALIDADO' : 'PENDENTE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA 3: LOGS DE AUDITORIA (AUDIT TRAIL & TERMINAL) */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Header do Card */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/80">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">Logs de Auditoria</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Rastreabilidade &amp; Telemetria</p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                {auditHistory.length} Registros
              </span>
            </div>

            {/* Filtros Rápidos de Auditoria */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {(['ALL', 'INTEGRIDADE', 'ATUALIZAÇÃO', 'SEGURANÇA'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAuditFilter(cat)}
                  className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                    auditFilter === cat
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'TODOS' : cat}
                </button>
              ))}
            </div>

            {/* Feed de Eventos de Auditoria */}
            <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs pr-1">
              {filteredAudits.slice(0, 4).map((entry) => {
                const isCopied = copiedHashId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded-sm ${
                          entry.status === 'CONFORME' || entry.status === 'SUCESSO'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className="text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-slate-200 text-[11px] leading-tight">
                      {entry.summary}
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {entry.details}
                    </p>

                    {entry.sha256Digest && (
                      <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500">
                        <span>SHA-256:</span>
                        <button
                          onClick={() => copyHash(entry.sha256Digest || '', entry.id)}
                          className="text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                          title="Copiar Digest"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{entry.sha256Digest.substring(0, 10)}...</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Terminal de Telemetria Compacto */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  Terminal Live Stream
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('TERMINAL')}
                    className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold"
                  >
                    Expandir →
                  </button>
                )}
              </div>

              <div className="p-2 bg-black/70 rounded-lg text-[10px] text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.slice(0, 3).map((log, i) => (
                    <div key={i} className="truncate text-slate-400 hover:text-slate-200">
                      {log}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-600">Nenhum log recente registrado.</span>
                )}
              </div>
            </div>

            {/* Botão de Laudo Técnico */}
            {onOpenAuditReport && (
              <button
                onClick={onOpenAuditReport}
                className="w-full py-2 px-3 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800/80 text-purple-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                <span>Emitir Laudo de Auditoria PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
