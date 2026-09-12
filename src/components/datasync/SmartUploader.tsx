import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
  Globe,
  Film,
  Zap,
  HardDrive,
  Eye,
  Check,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { UniversalMediaEngine } from '../../services/datasync/UniversalMediaEngine';
import { StorageController } from '../../services/datasync/StorageController';
import { MediaConversionResult, StoredAsset } from '../../types/datasync';
import { FormatBadge } from './FormatBadge';
import { SUPABASE_CONFIG } from '../../services/datasync/supabaseClient';

interface SmartUploaderProps {
  onAssetUploaded?: (asset: StoredAsset) => void;
}

export const SmartUploader: React.FC<SmartUploaderProps> = ({ onAssetUploaded }) => {
  const [targetBucket, setTargetBucket] = useState<'vault' | 'public-assets'>('public-assets');
  const [isDragging, setIsDragging] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [transcodePercent, setTranscodePercent] = useState(0);
  const [transcodeStatus, setTranscodeStatus] = useState('');
  const [conversionResult, setConversionResult] = useState<MediaConversionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<StoredAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setUploadSuccess(null);
    setIsTranscoding(true);
    setTranscodePercent(0);
    setTranscodeStatus('Preparando pipeline de transcodificação...');

    try {
      const result = await UniversalMediaEngine.processMedia(
        file,
        targetBucket,
        (percent, statusText) => {
          setTranscodePercent(percent);
          setTranscodeStatus(statusText);
        }
      );

      setConversionResult(result);

      if (result.isOverLimit) {
        setErrorMessage(
          `Alerta de Teto Máximo: O arquivo pós-processamento possui ${(result.convertedSize / (1024 * 1024)).toFixed(2)}MB, excedendo o limite estrito de 10MB (10485760 bytes). Reduza a resolução ou duração.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao transcodificar a mídia para WebP.');
    } finally {
      setIsTranscoding(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUploadToSupabase = async () => {
    if (!conversionResult) return;
    if (conversionResult.isOverLimit) {
      setErrorMessage('Não é permitido fazer upload de arquivos que excedam 10MB.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const response = await StorageController.uploadAsset(conversionResult);
      if (!response.success) {
        setErrorMessage(response.error || 'Erro ao realizar upload no Supabase Storage.');
      } else if (response.asset) {
        setUploadSuccess(response.asset);
        onAssetUploaded?.(response.asset);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na comunicação com o Supabase Storage.');
    } finally {
      setIsUploading(false);
    }
  };

  // Simular teste rápido com GIF de 5.2MB (Requisito Explícito do Prompt)
  const handleTestDemoGif = async () => {
    // Cria um arquivo sintético simulando um GIF animado de 5.2MB
    const sizeInBytes = 5.2 * 1024 * 1024;
    const fakeGifBuffer = new Uint8Array(sizeInBytes);
    // Assinatura GIF89a
    fakeGifBuffer[0] = 0x47; // G
    fakeGifBuffer[1] = 0x49; // I
    fakeGifBuffer[2] = 0x46; // F
    fakeGifBuffer[3] = 0x38; // 8
    fakeGifBuffer[4] = 0x39; // 9
    fakeGifBuffer[5] = 0x61; // a

    const demoFile = new File([fakeGifBuffer], 'banner_animado_institucional_5mb.gif', {
      type: 'image/gif',
    });

    await handleFile(demoFile);
  };

  // Simular teste de arquivo excedente (>10MB pós-conversão) para validar rejeição
  const handleTestOverLimit = async () => {
    const sizeInBytes = 32 * 1024 * 1024; // 32MB que resultará em ~11.5MB WebP
    const fakeBuffer = new Uint8Array(sizeInBytes);
    const demoFile = new File([fakeBuffer], 'video_render_excessivo_32mb.gif', {
      type: 'image/gif',
    });

    await handleFile(demoFile);
  };

  return (
    <div id="smart-uploader" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Cabeçalho do Uploader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-50">
              SmartUploader - Pipeline de Otimização WebP Universal
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Converte automaticamente imagens estáticas e <strong>GIFs animados</strong> para WebP com preservação de loop antes do upload ao Supabase.
          </p>
        </div>

        {/* Seletor de Bucket com regras de permissão */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setTargetBucket('public-assets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              targetBucket === 'public-assets'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            public-assets (Público)
          </button>
          <button
            onClick={() => setTargetBucket('vault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              targetBucket === 'vault'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            vault (Privado RLS)
          </button>
        </div>
      </div>

      {/* Botões de Ação Rápida e Testes de Homologação */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Testes Guiados:</span>
        <button
          onClick={handleTestDemoGif}
          disabled={isTranscoding}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Film className="w-3.5 h-3.5 text-amber-400" />
          Testar GIF Animado de 5.2MB (Requisito)
        </button>
        <button
          onClick={handleTestOverLimit}
          disabled={isTranscoding}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          Testar Rejeição &gt; 10MB
        </button>
      </div>

      {/* Zona de Drag-and-Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
            : 'border-slate-700 hover:border-emerald-500/50 bg-slate-950/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept="image/*,.gif,.png,.jpg,.jpeg,.webp"
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">
              Arraste seu arquivo de imagem ou clique para selecionar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Suporte a <strong>GIF (animado)</strong>, PNG, JPG, JPEG e WEBP • Limite pós-conversão: <strong>10MB</strong>
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full">
            <HardDrive className="w-3 h-3" />
            Supabase Storage • Bucket: {targetBucket}
          </div>
        </div>
      </div>

      {/* Barra de Progresso de Transcodificação (Ativa durante o processamento) */}
      {isTranscoding && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              {transcodeStatus}
            </span>
            <span className="font-mono font-extrabold text-emerald-400 text-sm">
              {transcodePercent}%
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-200"
              style={{ width: `${transcodePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Alerta de Erro ou Limite Excedido */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-100">Falha no Processamento ou Limite Excedido</div>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Painel de Prévia e Economia de KB (Resultado da Conversão) */}
      {conversionResult && !isTranscoding && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Transcodificação Concluída com Sucesso
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {conversionResult.convertedFileName}
              </p>
            </div>

            {/* Badge de Formato e Compressão */}
            <FormatBadge
              originalFormat={conversionResult.originalFormat}
              isAnimated={conversionResult.isAnimated}
              savingsRatio={conversionResult.compressionRatio}
              savingsKb={conversionResult.savingsKb}
              finalFormat="WEBP"
            />
          </div>

          {/* Comparativo de Tamanhos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Tamanho Original</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {(conversionResult.originalSize / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="text-[10px] text-slate-500 block">
                {conversionResult.originalSize.toLocaleString()} bytes
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-emerald-400 text-[11px] font-semibold block">Tamanho WebP Otimizado</span>
              <span className="font-mono font-extrabold text-emerald-300 text-sm">
                {(conversionResult.convertedSize / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="text-[10px] text-emerald-400 block">
                {conversionResult.convertedSize.toLocaleString()} bytes
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Economia de Rede</span>
              <span className="font-mono font-bold text-slate-100 text-sm flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                {conversionResult.savingsKb > 1024
                  ? `${(conversionResult.savingsKb / 1024).toFixed(2)} MB poupados`
                  : `${conversionResult.savingsKb} KB poupados`}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Redução de {conversionResult.compressionRatio}%
              </span>
            </div>
          </div>

          {/* Botão de Envio ao Supabase Storage */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              Destino no Supabase: <strong className="text-slate-200">{targetBucket}</strong> (limite 10MB)
            </div>

            <button
              onClick={handleUploadToSupabase}
              disabled={isUploading || conversionResult.isOverLimit}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando para o Supabase Storage...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Efetivar Upload no Bucket '{targetBucket}'
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de Upload com Sucesso */}
      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="font-bold text-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Arquivo Persistido no Supabase Storage!
            </div>
            <span className="font-mono text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
              Bucket: {uploadSuccess.bucket}
            </span>
          </div>
          <p className="text-slate-300 font-mono text-[11px] break-all">
            Caminho: {uploadSuccess.path}
          </p>
          {uploadSuccess.publicUrl && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-400">URL Pública:</span>
              <a
                href={uploadSuccess.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline font-mono text-[11px] truncate"
              >
                {uploadSuccess.publicUrl}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
