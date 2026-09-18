import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Terminal,
  FileText,
  ShieldCheck,
  Server
} from 'lucide-react';
import { PostgresSmartAdapterState } from '../../types/nexusbuild';

interface PostgresSmartAdapterProps {
  state: PostgresSmartAdapterState;
  onTestConnection: () => void;
  onTriggerSelfHealing: () => void;
  onApplyPgHba: (content: string) => void;
  isLoading?: boolean;
}

export const PostgresSmartAdapter: React.FC<PostgresSmartAdapterProps> = ({
  state,
  onTestConnection,
  onTriggerSelfHealing,
  onApplyPgHba,
  isLoading = false,
}) => {
  const [showPgHbaEditor, setShowPgHbaEditor] = useState(false);
  const [pgHbaText, setPgHbaText] = useState(state.pgHbaContent);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Database className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              PostgresSmartAdapter & Auto-Deploy
              {state.status === 'CONNECTED_5432' && (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  CONECTADO EM :5432 (EXISTENTE)
                </span>
              )}
              {state.status === 'RUNNING_5433' && (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  POSTGRESQL 16 SILENCIOSO EM :5433
                </span>
              )}
              {state.status === 'TESTING_5432' && (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-amber-950 text-amber-400 border border-amber-800/60 animate-pulse">
                  TESTANDO PORTA 5432 ({state.connectionAttempts}/{state.maxAttempts})
                </span>
              )}
              {state.status === 'SELF_HEALING' && (
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-indigo-950 text-indigo-400 border border-indigo-800/60 animate-pulse">
                  AUTO-CURA (REINICIANDO SERVIÇO)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Detecção inteligente em 5432 (5 tentativas). Instalação silenciosa do PostgreSQL 16 na porta 5433 se indisponível.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTestConnection}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
            <span>Testar Portas</span>
          </button>
          <button
            onClick={onTriggerSelfHealing}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            title="Tentar reiniciar o serviço de banco de dados automaticamente"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Auto-Cura (Self-Healing)</span>
          </button>
        </div>
      </div>

      {/* Grid de Estado do Banco de Dados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Porta Ativa</span>
            <Server className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100 flex items-baseline gap-2">
            <span>:{state.activePort}</span>
            <span className="text-xs text-cyan-400 font-normal">
              {state.activePort === 5432 ? 'Padrão' : 'Instalador Silencioso'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Fallback automático para 5433
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tentativas de Conexão</span>
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {state.connectionAttempts} / {state.maxAttempts}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {state.connectionAttempts >= state.maxAttempts
              ? 'Chaveamento para 5433 ativado'
              : 'Tentando conexão socket TCP'}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Configuração pg_hba.conf</span>
            {state.pgHbaConfigured ? (
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {state.pgHbaConfigured ? 'LOCAL AUTORIZADO' : 'PENDENTE'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            SCRAM-SHA-256 local 127.0.0.1/32
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Serviço Windows</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-sm font-bold font-mono text-slate-100 truncate">
            {state.serviceName}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {state.selfHealingTriggered ? (
              <span className="text-cyan-400">Recuperado via Self-Healing</span>
            ) : (
              <span>Monitoramento ativo de queda</span>
            )}
          </div>
        </div>
      </div>

      {/* Seção pg_hba.conf com Alternador */}
      <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">
              Arquivo C:\SucessoEduSistema\Config\pg_hba.conf
            </span>
            <span className="px-2 py-0.5 rounded text-2xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              Auto-Configurado
            </span>
          </div>
          <button
            onClick={() => setShowPgHbaEditor(!showPgHbaEditor)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
          >
            {showPgHbaEditor ? 'Recolher Editor' : 'Visualizar / Editar'}
          </button>
        </div>

        {showPgHbaEditor ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={pgHbaText}
              onChange={(e) => setPgHbaText(e.target.value)}
              rows={6}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onApplyPgHba(pgHbaText)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        ) : (
          <pre className="mt-3 p-2 bg-slate-900/80 rounded font-mono text-2xs text-slate-400 overflow-x-auto">
            {state.pgHbaContent}
          </pre>
        )}
      </div>

      {/* Terminal de Logs de Conexão e Auto-Cura */}
      <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2 pb-2 text-xs font-mono text-slate-400 border-b border-slate-900">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>Console de Detecção de Porta & Auto-Cura</span>
        </div>
        <div className="mt-2 font-mono text-xs space-y-1 max-h-36 overflow-y-auto pr-1">
          {state.connectionLogs.map((log, index) => (
            <div
              key={index}
              className={`leading-relaxed ${
                log.includes('[ERRO]') || log.includes('Falha')
                  ? 'text-rose-400'
                  : log.includes('[SUCESSO]') || log.includes('Conectado') || log.includes('OK')
                  ? 'text-cyan-400'
                  : log.includes('[ALERTA]')
                  ? 'text-amber-300'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
