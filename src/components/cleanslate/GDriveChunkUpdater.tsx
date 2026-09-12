import React, { useState, useEffect } from 'react';
import {
  DownloadCloud,
  Layers,
  FileCheck2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { UpdatePackageSpec, UpdateChunk } from '../../types/cleanslate';
import { GDriveChunkStreamService } from '../../services/cleanslate/GDriveChunkStreamService';

export const GDriveChunkUpdater: React.FC = () => {
  const [packageSpec, setPackageSpec] = useState<UpdatePackageSpec>(() =>
    GDriveChunkStreamService.createDefaultPackageSpec('v5.6.0-ENTERPRISE-LTS')
  );
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSimulatingCorruption, setIsSimulatingCorruption] = useState(false);
  const [activeHealingIndex, setActiveHealingIndex] = useState<number | null>(null);

  // Calcula estatísticas gerais
  const totalChunks = packageSpec.chunks.length;
  const verifiedChunks = packageSpec.chunks.filter((c) => c.status === 'VERIFIED').length;
  const hasCorruptedChunk = packageSpec.chunks.some((c) => c.status === 'CORRUPTED');
  const totalDownloadedBytes = packageSpec.chunks.reduce((acc, c) => acc + c.downloadedBytes, 0);
  const overallPercentage = Math.round((totalDownloadedBytes / packageSpec.compressedSizeBytes) * 100);

  // Iniciar download de todos os chunks de 64MB em paralelo / streaming com buffer de 8MB
  const handleStartDownload = async () => {
    setIsPaused(false);
    setPackageSpec((prev) => ({ ...prev, overallStatus: 'DOWNLOADING' }));

    for (let i = 0; i < packageSpec.chunks.length; i++) {
      const chunk = packageSpec.chunks[i];
      if (chunk.status === 'VERIFIED') continue;

      setActiveChunkIndex(i);
      setPackageSpec((prev) => {
        const updated = [...prev.chunks];
        updated[i] = { ...updated[i], status: 'DOWNLOADING' };
        return { ...prev, chunks: updated };
      });

      // Simula se forçado corromper o Chunk #1 para demonstrar Self-Healing
      const shouldCorruptThis = isSimulatingCorruption && i === 1;

      const result = await GDriveChunkStreamService.simulateChunkStream(
        chunk,
        (bytes) => {
          setPackageSpec((prev) => {
            const updated = [...prev.chunks];
            updated[i] = {
              ...updated[i],
              downloadedBytes: bytes,
              status: bytes === chunk.sizeBytes ? 'VALIDATING' : 'DOWNLOADING',
            };
            return { ...prev, chunks: updated };
          });
        },
        shouldCorruptThis
      );

      setPackageSpec((prev) => {
        const updated = [...prev.chunks];
        updated[i] = {
          ...updated[i],
          status: result.status,
          adler32Actual: result.actualAdler32,
          lastError:
            result.status === 'CORRUPTED'
              ? `Checksum Adler-32 divergente: esperado ${chunk.adler32Expected}, obtido ${result.actualAdler32}`
              : undefined,
        };
        return { ...prev, chunks: updated };
      });

      if (result.status === 'CORRUPTED') {
        break; // Interrompe para disparar o fluxo de Self-Healing
      }
    }

    setActiveChunkIndex(null);
  };

  // Disparo do Self-Healing para reparar pontualmente apenas o bloco corrompido
  const handleTriggerSelfHealing = async (chunkIndex: number) => {
    setActiveHealingIndex(chunkIndex);
    const chunk = packageSpec.chunks[chunkIndex];

    setPackageSpec((prev) => {
      const updated = [...prev.chunks];
      updated[chunkIndex] = {
        ...updated[chunkIndex],
        status: 'HEALING',
        retryCount: updated[chunkIndex].retryCount + 1,
      };
      return { ...prev, chunks: updated, overallStatus: 'DOWNLOADING' };
    });

    const result = await GDriveChunkStreamService.healCorruptedChunk(chunk, (bytes) => {
      setPackageSpec((prev) => {
        const updated = [...prev.chunks];
        updated[chunkIndex] = {
          ...updated[chunkIndex],
          downloadedBytes: bytes,
        };
        return { ...prev, chunks: updated };
      });
    });

    setPackageSpec((prev) => {
      const updated = [...prev.chunks];
      updated[chunkIndex] = {
        ...updated[chunkIndex],
        status: 'VERIFIED',
        adler32Actual: result.actualAdler32,
        lastError: undefined,
      };
      return { ...prev, chunks: updated };
    });

    setActiveHealingIndex(null);
  };

  // Pausar download (garantindo retomada futura via Range headers)
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    setPackageSpec((prev) => ({
      ...prev,
      overallStatus: isPaused ? 'DOWNLOADING' : 'PAUSED',
    }));
  };

  // Resetar simulação
  const handleReset = () => {
    setPackageSpec(GDriveChunkStreamService.createDefaultPackageSpec('v5.6.0-ENTERPRISE-LTS'));
    setActiveChunkIndex(null);
    setIsPaused(false);
    setIsSimulatingCorruption(false);
  };

  return (
    <div className="space-y-6">
      {/* Header do Motor Google Drive & Chunks 64MB */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                GOOGLE DRIVE STREAM • CHUNKS DE 64MB &amp; SELF-HEALING
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Motor de Atualização Resiliente via Chunks &amp; Range Headers
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Fracionamento de pacotes binários em blocos exatos de <strong>64MB</strong> com compressão <strong>Brotli/LZMA</strong> (redução de 44.5% de tráfego). Utiliza streaming direto com <code>Range: bytes=X-Y</code> via <code>drive.files.get</code>, buffer I/O de <strong>8MB</strong>, validação de integridade por bloco via <strong>Adler-32</strong> e assinatura <strong>SHA-512</strong>.
            </p>
          </div>

          {/* Controles de Execução */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={handleStartDownload}
              disabled={activeChunkIndex !== null || hasCorruptedChunk}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              <DownloadCloud className="h-4 w-4" />
              <span>Iniciar Stream Google Drive</span>
            </button>

            <button
              onClick={handleTogglePause}
              disabled={activeChunkIndex === null}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
              <span>{isPaused ? 'Retomar (Resume)' : 'Pausar'}</span>
            </button>

            <button
              onClick={() => setIsSimulatingCorruption(!isSimulatingCorruption)}
              className={`px-3 py-2 border rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSimulatingCorruption
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Força a corrupção do chunk #1 para demonstrar o auto-reparo pontual (Self-Healing)"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Simular Corrupção</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              title="Reiniciar Simulação"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metadados do Pacote e Algoritmo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Tamanho do Pacote &amp; Compressão
            </span>
            <div className="text-emerald-400 font-bold">
              142 MB <span className="text-slate-500 font-normal line-through">256 MB</span>
            </div>
            <div className="text-[10px] text-emerald-300">
              {packageSpec.compressionRatio}
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Fracionamento de Binários
            </span>
            <div className="text-slate-200 font-bold">
              Chunks de 64MB ({totalChunks} blocos)
            </div>
            <div className="text-[10px] text-slate-400">
              Buffer de I/O em disco: 8MB
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Google Drive Stream Mode
            </span>
            <div className="text-sky-400 font-bold flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>Range: bytes=X-Y (Parallel)</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Resumable Download: Ativo
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Integridade Consolidada
            </span>
            <div className="text-slate-200 font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Adler-32 &amp; SHA-512</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {verifiedChunks}/{totalChunks} chunks verificados
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Progresso Geral Consolidada */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span className="text-white font-bold">
              Progresso Geral de Download e Validação
            </span>
          </div>
          <span className="text-emerald-400 font-bold text-sm">
            {overallPercentage}% ({Math.round(totalDownloadedBytes / (1024 * 1024))} MB / {Math.round(packageSpec.compressedSizeBytes / (1024 * 1024))} MB)
          </span>
        </div>

        {/* Barra contínua */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              hasCorruptedChunk ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Progress Bars Segmentadas para Cada Bloco de 64MB */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Visão Segmentada de Chunks de 64MB (Download &amp; Adler-32 Checksum)
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
            Algoritmo: Adler-32 por bloco + SHA-512 final
          </span>
        </div>

        <div className="space-y-4">
          {packageSpec.chunks.map((chunk) => {
            const chunkPct = Math.round((chunk.downloadedBytes / chunk.sizeBytes) * 100);
            const isCorrupted = chunk.status === 'CORRUPTED';
            const isHealing = chunk.status === 'HEALING';
            const isVerified = chunk.status === 'VERIFIED';
            const isDownloading = chunk.status === 'DOWNLOADING';

            return (
              <div
                key={chunk.index}
                className={`p-4 rounded-md border text-xs space-y-2 transition-all ${
                  isCorrupted
                    ? 'bg-rose-950/40 border-rose-800/80'
                    : isHealing
                    ? 'bg-amber-950/40 border-amber-800/80'
                    : isVerified
                    ? 'bg-slate-950/60 border-emerald-900/60'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 font-bold text-[11px]">
                      Chunk #{chunk.index + 1}
                    </span>
                    <span className="text-slate-200 font-bold">
                      Range: bytes={chunk.byteStart}-{chunk.byteEnd} ({chunk.sizeMb} MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Adler-32 Esperado: <code className="text-emerald-400">{chunk.adler32Expected}</code>
                    </span>

                    {/* Status Badge */}
                    {isVerified && (
                      <span className="px-2 py-0.5 rounded-xs bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        VERIFICADO
                      </span>
                    )}

                    {isDownloading && (
                      <span className="px-2 py-0.5 rounded-xs bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-bold flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        STREAMING
                      </span>
                    )}

                    {isCorrupted && (
                      <span className="px-2 py-0.5 rounded-xs bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        HASH DIVERGENTE
                      </span>
                    )}

                    {isHealing && (
                      <span className="px-2 py-0.5 rounded-xs bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <RotateCcw className="h-3 w-3 animate-spin" />
                        SELF-HEALING
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra Segmentada de Progresso do Chunk */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isCorrupted
                        ? 'bg-rose-500'
                        : isHealing
                        ? 'bg-amber-400'
                        : isVerified
                        ? 'bg-emerald-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${chunkPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>
                    Baixado: {Math.round(chunk.downloadedBytes / (1024 * 1024))} MB / {chunk.sizeMb} MB ({chunkPct}%)
                  </span>

                  {/* Ação de Self-Healing em caso de erro */}
                  {isCorrupted && (
                    <button
                      onClick={() => handleTriggerSelfHealing(chunk.index)}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Ativar Self-Healing (Baixar apenas Chunk #{chunk.index + 1})</span>
                    </button>
                  )}
                </div>

                {chunk.lastError && (
                  <div className="p-2 bg-rose-950/60 border border-rose-800/60 rounded-sm text-rose-300 text-[10px]">
                    <strong>Erro de Validação:</strong> {chunk.lastError}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assinatura Final SHA-512 do Pacote */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Assinatura Criptográfica Consolidada do Pacote (SHA-512)
            </h4>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            Padrão Enterprise High-Security
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-sm text-emerald-400/90 text-[11px] break-all select-all leading-relaxed">
          {packageSpec.finalSha512}
        </div>
      </div>
    </div>
  );
};
