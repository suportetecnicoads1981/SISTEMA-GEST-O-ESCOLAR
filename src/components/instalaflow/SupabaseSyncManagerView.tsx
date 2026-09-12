import React, { useState } from 'react';
import {
  Cloud,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Activity,
  Server,
  FileCode,
  Radio
} from 'lucide-react';
import { SupabaseSyncManager } from '../../services/instalaflow/SupabaseSyncManager';
import { ConflictResolver } from '../../services/instalaflow/ConflictResolver';
import { SyncConflictRecord } from '../../types/instalaflow';

export const SupabaseSyncManagerView: React.FC = () => {
  const [config, setConfig] = useState(SupabaseSyncManager.getConfig());
  const [syncHistory, setSyncHistory] = useState(SupabaseSyncManager.getSyncHistory());
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulatedConflict, setSimulatedConflict] = useState<any | null>(null);
  const [isCopiedRLS, setIsCopiedRLS] = useState(false);
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CONFLICT_LWW' | 'RLS_SCRIPTS'>('MONITOR');

  const rlsScript = SupabaseSyncManager.generateSupabaseRLSScript();

  const handleSimulateSync = async () => {
    setIsSyncing(true);
    await SupabaseSyncManager.executeUpsert(
      'students',
      [{ id: 'std_test_' + Date.now(), name: 'Aluno Sincronizado', updated_at: new Date().toISOString() }],
      'station-sec-01'
    );
    setIsSyncing(false);
    setSyncHistory([...SupabaseSyncManager.getSyncHistory()]);
  };

  const handleTriggerConflictSimulation = () => {
    const conflictResult = ConflictResolver.generateSimulatedConflict();
    setSimulatedConflict(conflictResult);
    setActiveTab('CONFLICT_LWW');
  };

  const handleCopyRLS = () => {
    navigator.clipboard.writeText(rlsScript);
    setIsCopiedRLS(true);
    setTimeout(() => setIsCopiedRLS(false), 2000);
  };

  return (
    <div id="supabase-sync-manager-view" className="space-y-6">
      {/* Cabeçalho do Gerenciador de Sincronização */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Conexão Supabase Ativa
              </span>
              <span className="text-xs text-slate-500 font-mono">Ping: {config.lastPingMs}ms</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-600" />
              Sincronização Híbrida Supabase (PostgreSQL Central)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ponte bidirecional com resolução automática de conflitos <strong>Last Write Wins (LWW)</strong> e isolamento seguro via Row Level Security (RLS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerConflictSimulation}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Simular Colisão LWW
            </button>
            <button
              onClick={handleSimulateSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Executando Upsert...' : 'Disparar Sync Manual'}
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Abas do Módulo de Sincronização */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('MONITOR')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'MONITOR'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Monitor de Sincronização & Auditoria (sync_history)
        </button>

        <button
          onClick={() => setActiveTab('CONFLICT_LWW')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'CONFLICT_LWW'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Resolução de Conflitos: Last Write Wins (LWW)
        </button>

        <button
          onClick={() => setActiveTab('RLS_SCRIPTS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'RLS_SCRIPTS'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Políticas RLS & PostgreSQL DDL
        </button>
      </div>

      {/* Aba 1: Monitor de Sincronização e Auditoria */}
      {activeTab === 'MONITOR' && (
        <div className="space-y-6">
          {/* Métricas do Cluster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Instância Central</span>
              <div className="mt-1 text-sm font-mono font-semibold text-slate-900 truncate" title={config.url}>
                {config.url}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <Radio className="w-3 h-3 animate-ping" /> Realtime Channel Ativo
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Canal de Escuta (WebSockets)</span>
              <div className="mt-1 text-base font-bold text-slate-900">
                supabase.channel('sync')
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                postgres_changes habilitado
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Regra de Unificação</span>
              <div className="mt-1 text-base font-bold text-blue-600">
                upsert(onConflict: 'id')
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Sem duplicação de chaves
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Segurança de Dados</span>
              <div className="mt-1 text-base font-bold text-emerald-600">
                RLS Ativo (16 Policies)
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Isolamento por station_id
              </div>
            </div>
          </div>

          {/* Tabela de Histórico de Sincronização (sync_history) */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Tabela de Auditoria de Sincronizações (sync_history)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro de cada evento de unificação entre SQLite local e Supabase, incluindo tempo de resposta e resoluções.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {syncHistory.length} eventos registrados
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Timestamp (ISO 8601)</th>
                    <th className="py-2.5 px-3">Estação (ID)</th>
                    <th className="py-2.5 px-3">Tabela</th>
                    <th className="py-2.5 px-3">Operação</th>
                    <th className="py-2.5 px-3 text-right">Afetados</th>
                    <th className="py-2.5 px-3 text-right">Latência</th>
                    <th className="py-2.5 px-3">Detalhes</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {syncHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {item.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {item.stationId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-medium">
                        {item.tableName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                          {item.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {item.recordsAffected}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {item.durationMs}ms
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.details}>
                        {item.details}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> LWW Resolvido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aba 2: Resolução de Conflitos Last Write Wins (LWW) */}
      {activeTab === 'CONFLICT_LWW' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Lógica de Resolução de Conflitos: Last Write Wins (LWW)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Quando uma estação de trabalho passa por instabilidade de rede ou opera offline e sincroniza posteriormente, colisões de dados podem ocorrer.
              A regra <strong>Last Write Wins</strong> compara os timestamps <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">updated_at</code> (TIMESTAMPTZ UTC).
              O registro com carimbo temporal mais recente é aceito como versão canônica, disparando upsert no Supabase ou atualização no SQLite local, e o evento é totalmente auditado em <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">sync_history</code>.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleTriggerConflictSimulation}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Gerar Novo Conflito Simulado
              </button>
              <span className="text-xs text-slate-500">
                Simula colisão de dados entre Secretaria Local e Servidor Central
              </span>
            </div>
          </div>

          {/* Card de Demonstração do Conflito Simulado */}
          {simulatedConflict && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Análise da Colisão em Tempo Real
                  </span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Tabela: {simulatedConflict.tableName} | ID: {simulatedConflict.local.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Vencedor LWW:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {simulatedConflict.resolution.winner === 'LOCAL' ? 'Estação Local (Mais Recente)' : 'Nuvem Central (Mais Recente)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lado Local */}
                <div className={`p-4 rounded-lg border ${simulatedConflict.resolution.winner === 'LOCAL' ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-slate-600" /> Estação Local (SQLite)
                    </span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {simulatedConflict.local.updated_at}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div><strong>Nome:</strong> {simulatedConflict.local.name}</div>
                    <div className="text-blue-700 font-medium"><strong>E-mail:</strong> {simulatedConflict.local.email} (Alterado localmente)</div>
                    <div><strong>Telefone:</strong> {simulatedConflict.local.phone}</div>
                    <div><strong>Status:</strong> {simulatedConflict.local.status}</div>
                  </div>
                  {simulatedConflict.resolution.winner === 'LOCAL' && (
                    <div className="mt-3 pt-2 border-t border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disparou upsert para o Supabase
                    </div>
                  )}
                </div>

                {/* Lado Remoto */}
                <div className={`p-4 rounded-lg border ${simulatedConflict.resolution.winner === 'REMOTE' ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-blue-600" /> Servidor Central (Supabase)
                    </span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {simulatedConflict.remote.updated_at}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div><strong>Nome:</strong> {simulatedConflict.remote.name}</div>
                    <div className="text-slate-600"><strong>E-mail:</strong> {simulatedConflict.remote.email}</div>
                    <div><strong>Telefone:</strong> {simulatedConflict.remote.phone}</div>
                    <div><strong>Status:</strong> {simulatedConflict.remote.status}</div>
                  </div>
                  {simulatedConflict.resolution.winner === 'REMOTE' && (
                    <div className="mt-3 pt-2 border-t border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Atualizou o SQLite local
                    </div>
                  )}
                </div>
              </div>

              {/* Registro no sync_history */}
              <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-200">
                <div className="text-slate-400 text-[11px] mb-1">// Snapshot gravado na tabela pública sync_history:</div>
                <pre className="overflow-x-auto">{JSON.stringify(simulatedConflict.resolution.conflictLog, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba 3: Políticas RLS e Script DDL PostgreSQL */}
      {activeTab === 'RLS_SCRIPTS' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Políticas de Segurança Row Level Security (RLS) & DDL PostgreSQL
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Copie e cole este script no <strong>Supabase SQL Editor</strong> para provisionar o banco central com isolamento por <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">station_id</code> e permissão de bypass para o servidor central.
              </p>
            </div>
            <button
              onClick={handleCopyRLS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {isCopiedRLS ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopiedRLS ? 'Copiado!' : 'Copiar Script SQL'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-80">
            <pre>{rlsScript}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
