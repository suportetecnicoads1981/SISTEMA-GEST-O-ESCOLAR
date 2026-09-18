import React from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Copy,
  ExternalLink
} from 'lucide-react';
import { FirewallRule } from '../../types/nexusbuild';

interface NetworkGuardProps {
  rules: FirewallRule[];
  activePort: number;
  onReconfigureRules: () => void;
  isLoading?: boolean;
}

export const NetworkGuard: React.FC<NetworkGuardProps> = ({
  rules,
  activePort,
  onReconfigureRules,
  isLoading = false,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              NetworkGuard & Firewall do Windows
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                REGRAS NETSH ADVFIREWALL
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Liberação automática no Firewall para o executável <code className="text-cyan-400 font-mono">NexusBuild_App.exe</code> e porta do PostgreSQL ({activePort}).
            </p>
          </div>
        </div>

        <button
          onClick={onReconfigureRules}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          <span>Reaplicar Regras Netsh</span>
        </button>
      </div>

      {/* Lista de Regras Configuradas */}
      <div className="mt-5 space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {rule.name}
                  </span>
                  <div className="flex items-center gap-2 text-2xs text-slate-400 font-mono mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 text-indigo-300">
                      DIR: {rule.direction.toUpperCase()}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400">
                      AÇÃO: {rule.action.toUpperCase()}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">
                      PROTOCOLO: {rule.protocol}
                    </span>
                    {rule.localPort && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-cyan-300 border border-indigo-800/40">
                        PORTA :{rule.localPort}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                  {rule.status}
                </span>
                <button
                  onClick={() => handleCopy(rule.command, rule.id)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copiar comando netsh"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedId === rule.id ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Comando Shell Formatado */}
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-2xs text-slate-400 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-cyan-300 truncate">{rule.command}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Nota de Segurança Windows */}
      <div className="mt-4 p-3 rounded-lg bg-indigo-950/20 border border-indigo-800/30 flex items-start gap-2.5 text-xs text-indigo-300">
        <AlertTriangle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Garantia de Isolamento Local:</span> As regras de firewall liberam exclusivamente o tráfego da rede local (LAN) e loopback, bloqueando quaisquer conexões externas não autenticadas ou tráfego WAN desnecessário.
        </div>
      </div>
    </div>
  );
};
