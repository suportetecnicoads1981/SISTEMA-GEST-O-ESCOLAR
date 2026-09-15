import React, { useState } from 'react';
import {
  Wifi,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode,
  HardDrive
} from 'lucide-react';
import { NetworkDetectionResult } from '../../types/nexusinstall';

interface NetworkMonitorProps {
  data: NetworkDetectionResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onPortChange?: (newPort: number) => void;
}

export const NetworkMonitor: React.FC<NetworkMonitorProps> = ({
  data,
  isLoading,
  onRefresh
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-md p-6 space-y-6">
      {/* Header do NetworkMonitor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-50">
                NetworkMonitor • Resolução Dinâmica de Portas e IP
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                Fase 1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Detecção contínua de placa de rede física (Ethernet/Wi-Fi) e failover automático de portas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Escaneando...' : 'Re-escanear Redes'}
          </button>
        </div>
      </div>

      {/* Log Discreto de Resolução de Conflito de Portas */}
      {data && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Log de Auditoria de Conflito de Portas (Netstat Kernel Probe)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Padrão inicial: {data.defaultPort}
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {data.migrationLogs.map((log, idx) => {
              const isMigration = log.includes('ocupada, migrando');
              return (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${
                    isMigration
                      ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-300'
                  }`}
                >
                  {isMigration ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span>{log}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Métricas Principais: Porta Alocada, IP Físico e Secret Manager */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Porta Dinâmica */}
        <div className="p-4 rounded-md bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block font-medium">Porta Dinâmica Alocada</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-50 font-mono">
              :{data ? data.allocatedPort : '...'}
            </span>
            {data?.isPortOccupied && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Migrado de {data.defaultPort}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Socket TCP livre e testado para conexões locais e remotas
          </span>
        </div>

        {/* IP da Interface Ativa */}
        <div className="p-4 rounded-md bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block font-medium">IP da Placa Ativa (Ethernet/Wi-Fi)</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-blue-400 font-mono">
              {data ? data.primaryIp : '127.0.0.1'}
            </span>
            {data && (
              <button
                onClick={() => handleCopy(`http://${data.primaryIp}:${data.allocatedPort}`)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Copiar URL Completa"
              >
                {copiedUrl === `http://${data.primaryIp}:${data.allocatedPort}` ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Priorizado adaptador físico sobre 127.0.0.1 / localhost
          </span>
        </div>

        {/* Persistência no Secret Manager */}
        <div className="p-4 rounded-md bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block font-medium">Persistência & Secret Manager</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-slate-100">
              {data?.secretManagerSynced ? 'Sincronizado' : 'Gravando...'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate block" title={data?.secretKeyName}>
            {data?.envFilePath} • Secret Manager OK
          </span>
        </div>
      </div>

      {/* Tabela de Adaptadores de Rede Identificados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-bold flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-400" />
            Adaptadores de Rede Físicos e Lógicos Detectados (os.networkInterfaces)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Host: {data?.hostname || 'DESKTOP'}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Interface</th>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Endereço IP</th>
                <th className="px-4 py-2.5">Máscara de Sub-rede</th>
                <th className="px-4 py-2.5">Endereço MAC</th>
                <th className="px-4 py-2.5 text-right">Prioridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950 font-mono">
              {data?.allInterfaces.map((iface, idx) => {
                const isSelected = iface.address === data.primaryIp;
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-950/20 text-slate-100 font-semibold' : 'hover:bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <td className="px-4 py-2.5 flex items-center gap-2">
                      {iface.type === 'Wi-Fi' ? (
                        <Wifi className="w-3.5 h-3.5 text-blue-400" />
                      ) : iface.type === 'Ethernet' ? (
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{iface.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        iface.isPhysical
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {iface.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-200">{iface.address}</td>
                    <td className="px-4 py-2.5 text-slate-400">{iface.netmask || '255.255.255.0'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{iface.mac}</td>
                    <td className="px-4 py-2.5 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ativa Principal
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Secundária</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloco de Persistência Volátil e Secret Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-200 block">
              Arquivo Volátil de Ambiente Gerado: <code className="text-blue-400 font-mono">{data?.envFilePath}</code>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              PORT={data?.allocatedPort} | HOST={data?.primaryIp} | SECRET_REF={data?.secretKeyName}
            </span>
          </div>
        </div>

        <button
          onClick={() => handleCopy(`PORT=${data?.allocatedPort}\nHOST_IP=${data?.primaryIp}\nHOSTNAME=${data?.hostname}`)}
          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {copiedUrl?.startsWith('PORT=') ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Copiado!
            </>
          ) : (
            <>
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              Copiar .env de Runtime
            </>
          )}
        </button>
      </div>
    </div>
  );
};
