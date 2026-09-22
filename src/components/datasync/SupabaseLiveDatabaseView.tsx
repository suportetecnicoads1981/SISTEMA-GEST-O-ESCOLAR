import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  HardDrive,
  Users,
  Layers,
  FileCode,
  ShieldCheck,
  Activity,
  Send,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Award,
  Settings,
  Bell,
  MessageSquare,
  Server,
  CloudUpload,
  Info,
  Clock,
  Terminal,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Download
} from 'lucide-react';
import { RelationalIntegrityService } from '../../services/relationalIntegrityService';
import {
  SupabaseDatabaseService,
  SupabaseSyncResult,
  SupabaseTableHealth,
  ECOSYSTEM_TABLES,
  TableDefinitionMeta,
  RlsAuditReport,
} from '../../services/datasync/SupabaseDatabaseService';
import { SUPABASE_CONFIG } from '../../services/datasync/supabaseClient';
import { getStoredData } from '../../data/storage';

type CategoryFilter = 'ALL' | 'CORE' | 'PEDAGOGICAL' | 'ADMINISTRATIVE' | 'COMMUNICATION' | 'INFRASTRUCTURE';

export const SupabaseLiveDatabaseView: React.FC = () => {
  const [tableHealthList, setTableHealthList] = useState<SupabaseTableHealth[]>([]);
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');

  // Sincronização
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; tableName: string }>({
    current: 0,
    total: 0,
    tableName: '',
  });
  const [syncHistory, setSyncHistory] = useState<SupabaseSyncResult[]>([]);
  const [isSyncingStudents, setIsSyncingStudents] = useState(false);
  const [isSyncingClasses, setIsSyncingClasses] = useState(false);
  const [quickSyncFeedback, setQuickSyncFeedback] = useState<SupabaseSyncResult | null>(null);

  // Script DDL
  const [copiedSql, setCopiedSql] = useState(false);
  const ddlScript = useMemo(() => SupabaseDatabaseService.getComprehensiveProvisioningScript(), []);

  // Script Integridade & Auto-Cura
  const [copiedHealingSql, setCopiedHealingSql] = useState(false);
  const integrityHealingSql = useMemo(() => SupabaseDatabaseService.getIntegrityVerificationAndHealingScript(), []);

  const handleCopyHealingSql = () => {
    navigator.clipboard.writeText(integrityHealingSql);
    setCopiedHealingSql(true);
    setTimeout(() => setCopiedHealingSql(false), 2500);
  };

  // RLS Security Audit & Hardening
  const [rlsReport, setRlsReport] = useState<RlsAuditReport | null>(null);
  const [isAuditingRls, setIsAuditingRls] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const rlsHardeningSql = useMemo(() => SupabaseDatabaseService.getHardenedSecurityPoliciesScript(), []);

  const handleRunRlsAudit = async () => {
    setIsAuditingRls(true);
    try {
      const report = await SupabaseDatabaseService.auditRlsVulnerabilities();
      setRlsReport(report);
    } catch (err) {
      console.error('Erro na auditoria de segurança RLS:', err);
    } finally {
      setIsAuditingRls(false);
    }
  };

  const handleCopyRlsSql = () => {
    navigator.clipboard.writeText(rlsHardeningSql);
    setCopiedRlsSql(true);
    setTimeout(() => setCopiedRlsSql(false), 2500);
  };

  // Live Query
  const [selectedTableForQuery, setSelectedTableForQuery] = useState('students');
  const [queryResult, setQueryResult] = useState<{
    data: any[];
    error: string | null;
    latencyMs: number;
    hasQueried: boolean;
  }>({
    data: [],
    error: null,
    latencyMs: 0,
    hasQueried: false,
  });
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  // Executar checagem de todas as tabelas
  const handleCheckAllTables = async () => {
    setIsCheckingTables(true);
    try {
      const results = await SupabaseDatabaseService.testAllTablesHealth();
      setTableHealthList(results);
    } catch (err) {
      console.error('Erro na checagem de tabelas:', err);
    } finally {
      setIsCheckingTables(false);
    }
  };

  useEffect(() => {
    handleCheckAllTables();
    handleRunRlsAudit();
  }, []);

  // Sincronizar Alunos
  const handleSyncStudents = async () => {
    setIsSyncingStudents(true);
    setQuickSyncFeedback(null);
    const localData = getStoredData();
    const res = await SupabaseDatabaseService.syncStudentsToSupabase(localData.students || []);
    setQuickSyncFeedback(res);
    setIsSyncingStudents(false);
    handleCheckAllTables();
  };

  // Sincronizar Turmas
  const handleSyncClasses = async () => {
    setIsSyncingClasses(true);
    setQuickSyncFeedback(null);
    const localData = getStoredData();
    const res = await SupabaseDatabaseService.syncClassesToSupabase(localData.classes || []);
    setQuickSyncFeedback(res);
    setIsSyncingClasses(false);
    handleCheckAllTables();
  };

  // Sincronizar Todo o Ecossistema
  const handleSyncAllEntities = async () => {
    setIsSyncingAll(true);
    setSyncHistory([]);
    setQuickSyncFeedback(null);

    try {
      const results = await SupabaseDatabaseService.syncAllEntitiesToSupabase((current, total, tableName) => {
        setSyncProgress({ current, total, tableName });
      });
      setSyncHistory(results);
    } catch (err) {
      console.error('Erro no sync completo:', err);
    } finally {
      setIsSyncingAll(false);
      handleCheckAllTables();
    }
  };

  // Consulta remota
  const handleQueryTable = async () => {
    setIsExecutingQuery(true);
    const res = await SupabaseDatabaseService.fetchTableRecords(selectedTableForQuery, 15);
    setQueryResult({
      data: res.data,
      error: res.error,
      latencyMs: res.latencyMs,
      hasQueried: true,
    });
    setIsExecutingQuery(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(ddlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Métricas calculadas
  const onlineCount = tableHealthList.filter((t) => t.status === 'ONLINE').length;
  const pendingCount = tableHealthList.filter((t) => t.status === 'TABLE_NOT_FOUND').length;
  const totalCount = ECOSYSTEM_TABLES.length;
  const healthPercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;
  const avgLatency =
    tableHealthList.length > 0
      ? Math.round(tableHealthList.reduce((acc, curr) => acc + curr.latencyMs, 0) / tableHealthList.length)
      : 0;

  const filteredTables = tableHealthList.filter((tbl) => {
    if (activeCategory === 'ALL') return true;
    return tbl.category === activeCategory;
  });

  return (
    <div id="supabase-live-database-view" className="space-y-6">
      {/* 1. Header do Painel com Status Geral da Integração */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                  Auditoria de Integração Supabase Database
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    PostgreSQL 15+
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cluster: <span className="font-mono text-slate-300">{SUPABASE_CONFIG.projectUrl}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCheckAllTables}
              disabled={isCheckingTables}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isCheckingTables ? 'animate-spin' : ''}`} />
              {isCheckingTables ? 'Verificando...' : 'Atualizar Diagnóstico'}
            </button>

            <button
              onClick={handleSyncAllEntities}
              disabled={isSyncingAll}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncingAll ? 'animate-bounce' : ''}`} />
              {isSyncingAll ? 'Sincronizando Ecossistema...' : 'Sincronizar Todas as Tabelas'}
            </button>
          </div>
        </div>

        {/* 2. Métricas e Status de Cobertura do Banco */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Tabelas Ativas (Online)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-400">{onlineCount}</span>
              <span className="text-slate-500 text-[11px]">de {totalCount} mapeadas</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Tabelas Pendentes DDL</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-extrabold ${pendingCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {pendingCount}
              </span>
              <span className="text-slate-500 text-[11px]">precisam ser criadas</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
              {pendingCount === 0 ? '✓ 100% Provisionado' : 'Script DDL disponível abaixo'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Latência Média REST</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-200">{avgLatency}</span>
              <span className="text-slate-500 text-[11px]">ms</span>
            </div>
            <span className="text-[10px] text-emerald-400/90 block mt-1 font-mono">
              PostgREST v12.2 Ativo
            </span>
          </div>

          <div className={`p-4 rounded-xl bg-slate-950 border space-y-1 ${
            rlsReport?.overallStatus === 'VULNERABLE'
              ? 'border-amber-500/50 bg-amber-950/20'
              : 'border-slate-800/80'
          }`}>
            <span className="text-slate-400 text-[11px] block">Segurança & RLS</span>
            <div className="flex items-baseline gap-2">
              {rlsReport ? (
                rlsReport.overallStatus === 'VULNERABLE' ? (
                  <span className="text-xl font-extrabold text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                    Vulnerável
                  </span>
                ) : (
                  <span className="text-xl font-extrabold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    Blindado
                  </span>
                )
              ) : (
                <span className="text-xl font-extrabold text-slate-400 flex items-center gap-1">
                  <Shield className="w-5 h-5 text-slate-400 shrink-0 animate-pulse" />
                  Auditando...
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              {rlsReport
                ? rlsReport.overallStatus === 'VULNERABLE'
                  ? `${rlsReport.criticalCount} crítica(s) detectada(s)`
                  : 'Zero vulnerabilidades ativas'
                : 'Testando políticas...'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Sync Completo (quando em execução) */}
        {isSyncingAll && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-mono">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Sincronizando tabela: <strong>{syncProgress.tableName}</strong>
              </span>
              <span>
                {syncProgress.current} de {syncProgress.total} ({Math.round((syncProgress.current / syncProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Feedback de Sincronização Rápida */}
        {quickSyncFeedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
              quickSyncFeedback.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {quickSyncFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{quickSyncFeedback.message}</span>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">{quickSyncFeedback.latencyMs}ms</span>
          </div>
        )}

        {/* Ações Rápidas por Módulo */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              O script inicial criou <strong>students</strong>, <strong>school_classes</strong> e <strong>media_assets</strong>. As demais tabelas do ecossistema podem ser criadas com o script DDL abaixo.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncStudents}
              disabled={isSyncingStudents}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              {isSyncingStudents ? 'Sincronizando...' : 'Sincronizar Alunos'}
            </button>

            <button
              onClick={handleSyncClasses}
              disabled={isSyncingClasses}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              {isSyncingClasses ? 'Sincronizando...' : 'Sincronizar Turmas'}
            </button>
          </div>
        </div>
      </div>

      {/* 2.5. PAINEL DE AUDITORIA & BLINDAGEM DE SEGURANÇA RLS */}
      <div className={`border rounded-xl p-6 shadow-xl space-y-5 transition-all ${
        rlsReport?.overallStatus === 'VULNERABLE'
          ? 'bg-slate-900 border-amber-500/50 shadow-amber-950/20'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner ${
                rlsReport?.overallStatus === 'VULNERABLE'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}>
                {rlsReport?.overallStatus === 'VULNERABLE' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                  Auditoria de Políticas RLS & Blindagem de Segurança
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    rlsReport?.overallStatus === 'VULNERABLE'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}>
                    {rlsReport?.overallStatus === 'VULNERABLE' ? 'Vulnerabilidade Detectada' : '100% Protegido'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Inspeção em tempo real de permissões da anon key, imutabilidade de auditoria e proteção do vault
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRunRlsAudit}
              disabled={isAuditingRls}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isAuditingRls ? 'animate-spin' : ''}`} />
              {isAuditingRls ? 'Testando Políticas...' : 'Reexecutar Pen-Test RLS'}
            </button>

            <button
              onClick={handleCopyRlsSql}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              {copiedRlsSql ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  Script de Blindagem Copiado!
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Copiar Script SQL de Blindagem RLS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resumo da Auditoria */}
        {rlsReport && (
          <div className={`p-4 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border ${
            rlsReport.overallStatus === 'VULNERABLE'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              {rlsReport.overallStatus === 'VULNERABLE' ? (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <strong className="font-bold block text-sm">
                  {rlsReport.overallStatus === 'VULNERABLE'
                    ? `Atenção: ${rlsReport.criticalCount} vulnerabilidade(s) crítica(s) de controle de acesso detectada(s)`
                    : 'Todas as políticas RLS estão blindadas e seguras!'}
                </strong>
                <p className="text-[11px] opacity-90 mt-0.5">{rlsReport.summary}</p>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              Auditado em: {new Date(rlsReport.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Lista de Checagens Detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {rlsReport?.checks.map((check) => (
            <div
              key={check.id}
              className={`p-4 rounded-xl border bg-slate-950 space-y-2 transition-all ${
                check.vulnerable
                  ? 'border-amber-500/40 hover:border-amber-500/70'
                  : 'border-slate-800/80 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {check.vulnerable ? (
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <h4 className="font-bold text-slate-200 text-xs">{check.name}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                  check.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {check.severity}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Risco:</strong> {check.impact}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500">{check.category}</span>
                <span className={`font-semibold ${check.vulnerable ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {check.statusText}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Instruções de Aplicação do Script */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Key className="w-4 h-4" />
            Como aplicar a blindagem no Supabase SQL Editor:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
            <li>Copie o script clicando em <strong>"Copiar Script SQL de Blindagem RLS"</strong> acima.</li>
            <li>Abra o <strong>SQL Editor</strong> no painel Supabase (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com/dashboard</a>).</li>
            <li>Cole o script e clique em <strong>Run</strong> (ele revoga as políticas permissivas antigas e aplica o modelo Least-Privilege de forma idempotente).</li>
            <li>Volte aqui e clique em <strong>"Reexecutar Pen-Test RLS"</strong> para confirmar que a exclusão anônima foi neutralizada!</li>
          </ol>
        </div>
      </div>

      {/* 3. Diagnóstico Detalhado de Todas as Tabelas do Ecossistema */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-50">
              Mapeamento Completo de Tabelas do Sistema ({onlineCount}/{totalCount} Online)
            </h3>
          </div>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {(
              [
                { key: 'ALL', label: 'Todas' },
                { key: 'CORE', label: 'Cadastros (Core)' },
                { key: 'PEDAGOGICAL', label: 'Pedagógico' },
                { key: 'ADMINISTRATIVE', label: 'Administrativo' },
                { key: 'COMMUNICATION', label: 'Comunicação' },
                { key: 'INFRASTRUCTURE', label: 'Infra/Storage' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeCategory === cat.key
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Tabelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTables.map((tbl) => {
            const isOnline = tbl.status === 'ONLINE';
            const isPending = tbl.status === 'TABLE_NOT_FOUND';

            return (
              <div
                key={tbl.tableName}
                className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                  isOnline
                    ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40'
                    : isPending
                    ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-rose-950/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      {tbl.displayName}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      public.{tbl.tableName}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 flex items-center gap-1 ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    {tbl.status === 'ONLINE'
                      ? 'ONLINE'
                      : tbl.status === 'TABLE_NOT_FOUND'
                      ? 'PENDENTE'
                      : 'ERRO'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{tbl.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>
                    {isOnline ? (
                      <span className="text-slate-300">Registros: {tbl.recordCount}</span>
                    ) : (
                      <span className="text-amber-400/80">Criar via DDL</span>
                    )}
                  </span>
                  <span>{tbl.latencyMs > 0 ? `${tbl.latencyMs}ms` : '--'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Visualizador de Dados Remotos (Live Query Supabase) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-50 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Inspecionar Dados Remotos no Supabase (Live Query)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulta registros em tempo real diretamente do cluster PostgreSQL via PostgREST.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTableForQuery}
              onChange={(e) => setSelectedTableForQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {ECOSYSTEM_TABLES.map((t) => (
                <option key={t.tableName} value={t.tableName}>
                  {t.tableName} ({t.displayName})
                </option>
              ))}
            </select>

            <button
              onClick={handleQueryTable}
              disabled={isExecutingQuery}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExecutingQuery ? 'animate-spin' : ''}`} />
              Consultar
            </button>
          </div>
        </div>

        {queryResult.hasQueried && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Resultados em <strong className="text-slate-200">{selectedTableForQuery}</strong>: {queryResult.data.length}
              </span>
              <span className="font-mono text-[11px] text-slate-500">{queryResult.latencyMs}ms</span>
            </div>

            {queryResult.error ? (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {queryResult.error}
              </div>
            ) : queryResult.data.length === 0 ? (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Nenhum registro encontrado na tabela remota '{selectedTableForQuery}'.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      {Object.keys(queryResult.data[0] || {}).slice(0, 6).map((col) => (
                        <th key={col} className="p-2.5">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {queryResult.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        {Object.keys(row).slice(0, 6).map((col) => (
                          <td key={col} className="p-2.5 text-slate-300 truncate max-w-xs">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Script SQL DDL Complementar Definitivo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-50">
                Script SQL DDL Complementar (Idempotente & Seguro)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cria todas as 15 tabelas complementares do sistema e atualiza colunas de alunos/turmas sem apagar nada.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow transition-all cursor-pointer"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Script SQL Completo
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Como aplicar no seu projeto Supabase:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
            <li>Clique no botão <strong>"Copiar Script SQL Completo"</strong> acima.</li>
            <li>Acesse seu painel do Supabase: <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com/dashboard</a></li>
            <li>Abra o menu <strong>SQL Editor</strong> no painel esquerdo.</li>
            <li>Cole o script e clique em <strong>Run</strong>.</li>
            <li>Volte aqui e clique em <strong>"Atualizar Diagnóstico"</strong> para ver todas as 17 tabelas marcadas como <strong className="text-emerald-400">ONLINE</strong>!</li>
          </ol>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-60 leading-relaxed">
          {ddlScript}
        </pre>
      </div>

      {/* 6. Script de Verificação de Integridade, Relacionamentos e Auto-Cura */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-50">
                Auditoria de Integridade Referencial, Relacionamentos & Auto-Cura
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Script transacional seguro que detecta dados órfãos, corrige chaves estrangeiras (students, turmas, polos, diários, notas, provas) e aplica Foreign Keys com ON DELETE/CASCADE.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                RelationalIntegrityService.downloadSqlScript(
                  integrityHealingSql,
                  'auditoria_integridade_auto_cura_supabase.sql'
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Baixar .SQL
            </button>

            <button
              onClick={handleCopyHealingSql}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              {copiedHealingSql ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Script de Auto-Cura
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1. Normalização de Órfãos
            </span>
            <p className="text-[11px] text-slate-400">
              Associa automaticamente alunos, notas e chamadas sem turma ou polo para unidades válidas.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2. Aplicação de Foreign Keys
            </span>
            <p className="text-[11px] text-slate-400">
              Cria constraints de integridade referencial com ON UPDATE CASCADE e ON DELETE CASCADE/SET NULL.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 3. Relatório de Saúde
            </span>
            <p className="text-[11px] text-slate-400">
              Emite um SELECT consolidado ao final mostrando se todas as tabelas estão com 0 órfãos ('PERFEITO').
            </p>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-60 leading-relaxed">
          {integrityHealingSql}
        </pre>
      </div>
    </div>
  );
};
