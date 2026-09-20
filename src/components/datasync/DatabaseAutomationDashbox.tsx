import React, { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Download,
  Terminal,
  Settings,
  AlertTriangle,
  Play,
  Database,
  Layers,
  Sparkles,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  DatabaseAutomatorService,
  AutomatedMigrationResult,
  DatabaseAutoUpdateConfig,
  CURRENT_DATABASE_SCHEMA_VERSION,
} from '../../services/databaseAutomatorService';
import { RelationalIntegrityService } from '../../services/relationalIntegrityService';
import { getStoredData } from '../../data/storage';

export const DatabaseAutomationDashbox: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [lastResult, setLastResult] = useState<AutomatedMigrationResult | null>(null);
  const [config, setConfig] = useState<DatabaseAutoUpdateConfig>(() => DatabaseAutomatorService.getConfig());
  const [currentVersion, setCurrentVersion] = useState(() => DatabaseAutomatorService.getCurrentPersistedVersion());
  const [currentScore, setCurrentScore] = useState(() => {
    try {
      return RelationalIntegrityService.audit(getStoredData()).score;
    } catch {
      return 100;
    }
  });

  const isUpToDate = currentVersion === CURRENT_DATABASE_SCHEMA_VERSION && currentScore >= 95;

  const handleRunAutoMigration = async () => {
    setIsRunning(true);
    setProgress(0);
    setStatusText('Iniciando pipeline de atualização automatizada...');

    try {
      const result = await DatabaseAutomatorService.executeAutomatedUpdate((pct, msg) => {
        setProgress(pct);
        setStatusText(msg);
      });

      setLastResult(result);
      setCurrentVersion(result.schemaVersion);
      setCurrentScore(result.healthScoreAfter);
    } catch (err: any) {
      alert('Erro na automação do banco de dados: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleStartup = (enabled: boolean) => {
    const updated = { ...config, autoMigrateOnStartup: enabled };
    setConfig(updated);
    DatabaseAutomatorService.saveConfig(updated);
  };

  const handleToggleAutoHeal = (enabled: boolean) => {
    const updated = { ...config, autoHealOrphanRecords: enabled };
    setConfig(updated);
    DatabaseAutomatorService.saveConfig(updated);
  };

  const handleToggleBackup = (enabled: boolean) => {
    const updated = { ...config, createBackupBeforeMigrate: enabled };
    setConfig(updated);
    DatabaseAutomatorService.saveConfig(updated);
  };

  const handleDownloadPowerShellScript = () => {
    const content = DatabaseAutomatorService.generatePowerShellAutomationScript();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automacao_atualizacao_banco.ps1';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBatchScript = () => {
    const content = DatabaseAutomatorService.generateBatchAutomationScript();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automacao_atualizacao_banco.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header com Status do Banco e Versão */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Zap className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-100">
                Automação Total do Banco de Dados & Schemas
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase font-mono tracking-wider">
                v{CURRENT_DATABASE_SCHEMA_VERSION} Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pipeline autônomo de auto-cura, índices de performance, migração não destrutiva e backup atômico.
            </p>
          </div>
        </div>

        {/* Badges de Status */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Score de Saúde:</span>
            <strong className="text-emerald-400 font-bold">{currentScore}%</strong>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              isUpToDate
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
            }`}
          >
            {isUpToDate ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Banco 100% Atualizado & Saneado</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Atualização Recomendada</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Seção Principal de Disparo da Automação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Botão 1-Click e Barra de Progresso */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Execução da Migração com 1 Clique
            </span>
            {lastResult && (
              <span className="text-[11px] font-mono text-slate-500">
                Última execução: {new Date(lastResult.completedAt).toLocaleTimeString('pt-BR')} ({lastResult.totalDurationMs}ms)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Ao disparar a automação, o sistema cria automaticamente um ponto de restauração seguro, normaliza registros órfãos, alinha chaves estrangeiras e garante as novas estruturas (etapas, séries, turnos, capacidade e relatórios customizados).
          </p>

          {/* Barra de Progresso durante a execução */}
          {isRunning && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  {statusText}
                </span>
                <span className="font-mono font-bold text-indigo-400">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full shadow-lg shadow-indigo-500/50"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleRunAutoMigration}
              disabled={isRunning}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executando Automação...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Executar Atualização Automática Total
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPowerShellScript}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Baixar script PowerShell .ps1 para execução autônoma no Windows"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Script PowerShell (.ps1)</span>
            </button>

            <button
              onClick={handleDownloadBatchScript}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Baixar script Batch .bat para execução com 2 cliques"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Script Batch (.bat)</span>
            </button>
          </div>
        </div>

        {/* Painel Direito: Configurações de Automação */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Settings className="w-4 h-4 text-slate-400" />
            Diretrizes de Automação
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <div className="font-bold text-slate-200">Auto-migrar na Inicialização</div>
                <div className="text-[11px] text-slate-400">Verifica o schema ao abrir o app</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoMigrateOnStartup}
                onChange={(e) => handleToggleStartup(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <div className="font-bold text-slate-200">Auto-Cura de Registros</div>
                <div className="text-[11px] text-slate-400">Normaliza turmas e polos órfãos</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoHealOrphanRecords}
                onChange={(e) => handleToggleAutoHeal(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <div className="font-bold text-slate-200">Backup Preventivo Atômico</div>
                <div className="text-[11px] text-slate-400">Salva snapshot antes da migração</div>
              </div>
              <input
                type="checkbox"
                checked={config.createBackupBeforeMigrate}
                onChange={(e) => handleToggleBackup(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Detalhamento dos Passos Executados (Logs de Telemetria) */}
      {lastResult && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Resultado da Execução: {lastResult.steps.length} Etapas Concluídas com Sucesso
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Integridade: {lastResult.healthScoreBefore}% → {lastResult.healthScoreAfter}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lastResult.steps.map((step) => (
              <div
                key={step.step}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{step.title}</div>
                  <div className="text-[11px] text-slate-400">{step.details}</div>
                  <div className="text-[10px] font-mono text-slate-500">{step.durationMs}ms</div>
                </div>
              </div>
            ))}
          </div>

          {lastResult.fixesApplied.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Correções e Ajustes Aplicados Automaticamente:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-indigo-300">
                {lastResult.fixesApplied.map((fix, idx) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
