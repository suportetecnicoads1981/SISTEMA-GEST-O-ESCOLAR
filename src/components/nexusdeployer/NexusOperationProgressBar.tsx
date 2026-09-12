import React from 'react';
import {
  Archive,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  FileCode,
  HardDrive,
  Check,
  X,
} from 'lucide-react';
import { ZipCompressionProgress, DownloadProgressEvent } from '../../services/nexus/ZipEngine';
import { UploadProgressEvent } from '../../services/nexus/CloudUploader';

export type OperationType = 'COMPRESSION' | 'DOWNLOAD' | 'UPLOAD';

interface NexusOperationProgressBarProps {
  type: OperationType;
  zipProgress?: ZipCompressionProgress | null;
  downloadProgress?: DownloadProgressEvent | null;
  uploadProgress?: UploadProgressEvent | null;
  onDismiss?: () => void;
  className?: string;
}

export const NexusOperationProgressBar: React.FC<NexusOperationProgressBarProps> = ({
  type,
  zipProgress,
  downloadProgress,
  uploadProgress,
  onDismiss,
  className = '',
}) => {
  // Extrair valores unificados de acordo com a operação
  let percent = 0;
  let title = '';
  let currentFileDesc = '';
  let statusBadge = '';
  let speedText = '';
  let sizeText = '';
  let isComplete = false;
  let hasError = false;
  let errorMessage = '';

  if (type === 'COMPRESSION') {
    title = 'Compactação de Pacote (ZipEngine)';
    percent = zipProgress ? Math.min(100, Math.max(0, zipProgress.percent)) : 0;
    currentFileDesc = zipProgress?.currentFile || 'Processando binários canônicos...';
    
    switch (zipProgress?.stage) {
      case 'VERIFYING_INTEGRITY':
        statusBadge = 'VERIFICANDO INTEGRIDADE';
        break;
      case 'COMPRESSING':
        statusBadge = zipProgress.processedFiles && zipProgress.totalFiles
          ? `COMPRIMINDO (${zipProgress.processedFiles}/${zipProgress.totalFiles})`
          : 'COMPRIMINDO (DEFLATE)';
        break;
      case 'GENERATING_SHA256':
        statusBadge = 'CALCULANDO SHA-256';
        break;
      case 'COMPLETED':
        statusBadge = 'CONCLUÍDO';
        isComplete = true;
        break;
      default:
        statusBadge = 'PROCESSANDO';
    }

    if (zipProgress?.totalFiles) {
      sizeText = `${zipProgress.processedFiles || 0} de ${zipProgress.totalFiles} arquivos`;
    }
  } else if (type === 'DOWNLOAD') {
    title = 'Download de Pacote (.ZIP)';
    percent = downloadProgress ? Math.min(100, Math.max(0, downloadProgress.percent)) : 0;
    currentFileDesc = downloadProgress?.currentFile || downloadProgress?.filename || 'Baixando arquivo...';
    
    switch (downloadProgress?.status) {
      case 'STARTING':
        statusBadge = 'INICIANDO HANDSHAKE';
        break;
      case 'DOWNLOADING':
        statusBadge = 'TRANSFERINDO CHUNKS';
        break;
      case 'VERIFYING':
        statusBadge = 'VERIFICANDO BLOB';
        break;
      case 'COMPLETED':
        statusBadge = 'DOWNLOAD CONCLUÍDO';
        isComplete = true;
        break;
      case 'ERROR':
        statusBadge = 'ERRO DE DOWNLOAD';
        hasError = true;
        errorMessage = downloadProgress.error || 'Falha no fluxo de transferência';
        break;
      default:
        statusBadge = 'BAIXANDO';
    }

    if (downloadProgress?.speedKbPerSec) {
      speedText = downloadProgress.speedKbPerSec > 1024
        ? `${(downloadProgress.speedKbPerSec / 1024).toFixed(1)} MB/s`
        : `${downloadProgress.speedKbPerSec} KB/s`;
    }

    if (downloadProgress?.totalBytes) {
      const downloadedMb = (downloadProgress.bytesDownloaded / (1024 * 1024)).toFixed(2);
      const totalMb = (downloadProgress.totalBytes / (1024 * 1024)).toFixed(2);
      sizeText = `${downloadedMb} MB / ${totalMb} MB`;
    }
  } else if (type === 'UPLOAD') {
    title = 'Publicação na Nuvem (Firebase Storage)';
    percent = uploadProgress ? Math.min(100, Math.max(0, uploadProgress.percent)) : 0;
    currentFileDesc = uploadProgress?.status === 'REGISTERING_METADATA'
      ? 'Gravando metadados da release no Firestore (nexus_releases)...'
      : `Enviando pacote para Firebase Storage (${uploadProgress?.bytesTransferred || 0} bytes)...`;
    
    switch (uploadProgress?.status) {
      case 'UPLOADING':
        statusBadge = 'ENVIANDO PARA STORAGE';
        break;
      case 'REGISTERING_METADATA':
        statusBadge = 'REGISTRANDO FIRESTORE';
        break;
      case 'COMPLETED':
        statusBadge = 'PUBLICADO';
        isComplete = true;
        break;
      case 'ERROR':
        statusBadge = 'FALHA DE UPLOAD';
        hasError = true;
        errorMessage = uploadProgress.error || 'Erro na transferência';
        break;
      default:
        statusBadge = 'UPLOADING';
    }

    if (uploadProgress?.totalBytes) {
      const transMb = (uploadProgress.bytesTransferred / (1024 * 1024)).toFixed(2);
      const totalMb = (uploadProgress.totalBytes / (1024 * 1024)).toFixed(2);
      sizeText = `${transMb} MB / ${totalMb} MB`;
    }
  }

  // Estilos temáticos da barra baseados na operação
  const theme = {
    COMPRESSION: {
      gradient: 'from-indigo-500 via-blue-500 to-cyan-400',
      glow: 'shadow-[0_0_14px_rgba(99,102,241,0.45)]',
      borderAccent: 'border-indigo-500/40',
      badgeBg: 'bg-indigo-950/80 border-indigo-700 text-indigo-300',
      icon: Archive,
      iconColor: 'text-indigo-400',
      textColor: 'text-indigo-300',
    },
    DOWNLOAD: {
      gradient: 'from-emerald-500 via-teal-400 to-cyan-400',
      glow: 'shadow-[0_0_14px_rgba(16,185,129,0.45)]',
      borderAccent: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
      icon: Download,
      iconColor: 'text-emerald-400',
      textColor: 'text-emerald-300',
    },
    UPLOAD: {
      gradient: 'from-amber-500 via-orange-500 to-amber-400',
      glow: 'shadow-[0_0_14px_rgba(245,158,11,0.45)]',
      borderAccent: 'border-amber-500/40',
      badgeBg: 'bg-amber-950/80 border-amber-700 text-amber-300',
      icon: UploadCloud,
      iconColor: 'text-amber-400',
      textColor: 'text-amber-300',
    },
  }[type];

  const IconComponent = isComplete ? CheckCircle2 : theme.icon;

  return (
    <div
      className={`bg-slate-900/95 border ${
        isComplete
          ? 'border-emerald-500/60'
          : hasError
          ? 'border-rose-500/60'
          : theme.borderAccent
      } rounded-lg p-4 font-mono text-xs shadow-lg backdrop-blur-xs space-y-3 transition-all duration-300 ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-md ${
              isComplete
                ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                : 'bg-slate-950 border border-slate-800 ' + theme.iconColor
            }`}
          >
            <IconComponent className={`h-4 w-4 ${!isComplete && !hasError ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-slate-100 text-sm font-sans font-bold">{title}</strong>
              <span
                className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border tracking-wider ${
                  isComplete
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : hasError
                    ? 'bg-rose-950 border-rose-700 text-rose-300'
                    : theme.badgeBg
                }`}
              >
                {statusBadge}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
              Operação de infraestrutura em andamento com integridade garantida
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Porcentagem Grande e Fluida */}
          <div className="text-right">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                isComplete ? 'text-emerald-400' : theme.textColor
              }`}
            >
              {percent}%
            </span>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Dispensar barra de status"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Animated Progress Bar Track */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-950 border border-slate-800/90 rounded-full h-4 relative overflow-hidden p-0.5">
          {/* Barra ativa com gradiente e faixas animadas (Tailwind CSS) */}
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden bg-gradient-to-r ${
              isComplete
                ? 'from-emerald-500 via-teal-400 to-emerald-600'
                : hasError
                ? 'from-rose-600 to-red-500'
                : theme.gradient
            } ${!isComplete && !hasError ? theme.glow : ''}`}
            style={{ width: `${Math.max(4, percent)}%` }}
          >
            {/* Faixas diagonais animadas (Stripes) */}
            {!isComplete && !hasError && (
              <div className="absolute inset-0 animate-progress-stripes opacity-70"></div>
            )}

            {/* Feixe de luz / Shimmer refletido */}
            {!isComplete && !hasError && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-progress-shimmer"></div>
            )}
          </div>
        </div>

        {/* Micro Step Markers */}
        {type === 'COMPRESSION' && (
          <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-500 pt-0.5">
            <span className={percent >= 10 ? 'text-indigo-400 font-bold' : ''}>1. Integridade</span>
            <span className={percent >= 30 ? 'text-indigo-400 font-bold' : ''}>2. Empacotar</span>
            <span className={percent >= 85 ? 'text-indigo-400 font-bold' : ''}>3. SHA-256</span>
            <span className={percent === 100 ? 'text-emerald-400 font-bold text-right' : 'text-right'}>
              4. Concluído
            </span>
          </div>
        )}
      </div>

      {/* Operational Details Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 truncate max-w-lg">
          <FileCode className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate text-slate-300 font-mono" title={currentFileDesc}>
            {currentFileDesc}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono">
          {speedText && (
            <span className="flex items-center gap-1 text-slate-300">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>{speedText}</span>
            </span>
          )}

          {sizeText && (
            <span className="flex items-center gap-1 text-slate-400">
              <HardDrive className="h-3 w-3 text-slate-500" />
              <span>{sizeText}</span>
            </span>
          )}

          {isComplete && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>100% OK</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
