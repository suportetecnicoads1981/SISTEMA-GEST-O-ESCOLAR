import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Zap,
  Activity
} from 'lucide-react';
import { HardwareValidatorState } from '../../types/nexusbuild';

interface HardwareValidatorProps {
  data: HardwareValidatorState;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const HardwareValidator: React.FC<HardwareValidatorProps> = ({
  data,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <HardDrive className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              HardwareValidator & Pré-requisitos
              {data.status === 'PASSED' ? (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  APROVADO (2GB+ OK)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-rose-950 text-rose-500 border border-rose-800/60">
                  REQUER ATENÇÃO
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Validação física de disco em <code className="text-cyan-400 font-mono">C:\SucessoEduSistema</code>, CPU, RAM e privilégios UAC.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Reavaliar Sistema</span>
        </button>
      </div>

      {/* Grid de Métricas de Hardware */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        {/* Espaço em Disco */}
        <div className={`p-4 rounded-lg border ${
          data.isDiskSpaceOk 
            ? 'bg-slate-950 border-cyan-500/30' 
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Espaço Livre em C:</span>
            {data.isDiskSpaceOk ? (
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{data.freeDiskGb} GB</span>
            <span className="text-xs text-slate-400 font-mono">/ mín. 2.0 GB</span>
          </div>
          <div className="mt-2 text-xs text-cyan-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Partição: {data.targetDisk}
          </div>
        </div>

        {/* Memória RAM */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Memória RAM</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{data.freeMemoryGb} GB</span>
            <span className="text-xs text-slate-400 font-mono">livres de {data.totalMemoryGb} GB</span>
          </div>
          <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Buffer adequado para PostgreSQL
          </div>
        </div>

        {/* Núcleos de CPU */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Processamento</span>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{data.cpuCores}</span>
            <span className="text-xs text-slate-400 font-mono">Cores / Threads</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-cyan-400" />
            Paralelismo habilitado
          </div>
        </div>

        {/* Privilégios UAC / Administrador */}
        <div className={`p-4 rounded-lg border ${
          data.isAdmin 
            ? 'bg-slate-950 border-cyan-500/30' 
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Privilégios UAC</span>
            {data.isAdmin ? (
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-100">
              {data.isAdmin ? 'ADMINISTRADOR' : 'USUÁRIO COMUM'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {data.isAdmin ? (
              <span className="text-cyan-400">Auto-Elevation ativa</span>
            ) : (
              <span className="text-rose-500">Exige elevação via runas</span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Processos Conflitantes */}
      <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            Processos Conflitantes em Monitoramento
            <span className="px-1.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
              {data.conflictingProcesses.length}
            </span>
          </span>
          {data.conflictingProcesses.length === 0 ? (
            <span className="text-xs text-cyan-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Nenhum processo conflitante ativo
            </span>
          ) : (
            <span className="text-xs text-rose-500 font-medium">
              Encerrar antes da extração
            </span>
          )}
        </div>

        {data.conflictingProcesses.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {data.conflictingProcesses.map((proc, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 px-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-200 font-medium">{proc.name}</span>
                  <span className="text-slate-500 font-mono">(PID: {proc.pid})</span>
                  {proc.port && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-2xs">
                      Porta :{proc.port}
                    </span>
                  )}
                </div>
                <span className="text-rose-400 text-2xs font-mono">
                  {proc.canAutoKill ? 'Pode ser finalizado automaticamente' : 'Requer finalização manual'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
