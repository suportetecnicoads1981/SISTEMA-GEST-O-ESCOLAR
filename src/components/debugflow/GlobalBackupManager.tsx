import React, { useState } from 'react';
import {
  Archive,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  HardDrive,
  FileCode,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  Sparkles,
  Lock,
} from 'lucide-react';
import { FullStackArchiver } from '../../services/debugflow/fullStackArchiver';
import { FullStackBackupMetadata } from '../../types/supabaseSchema';

export const GlobalBackupManager: React.FC = () => {
  const [backups, setBackups] = useState<FullStackBackupMetadata[]>(() =>
    FullStackArchiver.getBackupHistory()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: '',
  });
  const [lastBlob, setLastBlob] = useState<{ blob: Blob; filename: string } | null>(null);

  const handleGenerateBackup = async (uploadToSupabase: boolean) => {
    setIsGenerating(true);
    setProgress({ percent: 5, message: 'Iniciando pipeline de backup Full-Stack...' });

    try {
      const { blob, metadata } = await FullStackArchiver.createFullStackBackupZip({
        author: 'Administrador TI (DebugFlow)',
        uploadToSupabase,
        onProgress: (percent, message) => setProgress({ percent, message }),
      });

      setLastBlob({ blob, filename: metadata.packageFileName });
      setBackups(FullStackArchiver.getBackupHistory());

      // Download automático no navegador
      FullStackArchiver.triggerDownload(blob, metadata.packageFileName);
    } catch (err: any) {
      console.error('Falha na geração do backup:', err);
      alert(`Erro ao gerar backup: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSqlDumpOnly = () => {
    const sql = FullStackArchiver.generatePostgreSqlDump();
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    FullStackArchiver.triggerDownload(blob, `sucessoedu_db_dump_${dateStr}.sql`);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#f8fafc]">Global Full-Stack Backup Manager</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  DB Dump + UI Build
                </span>
              </div>
              <p className="text-sm text-[#94a3b8]">
                Exportação consolidada em arquivo único (.ZIP) contendo dump SQL PostgreSQL e artefatos do frontend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadSqlDumpOnly}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-[#f8fafc] font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 border border-slate-700"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              Apenas Dump SQL (.sql)
            </button>

            <button
              onClick={() => handleGenerateBackup(true)}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <UploadCloud className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
              {isGenerating ? 'Empacotando Snapshot...' : 'Gerar Snapshot Total (DB + Build)'}
            </button>
          </div>
        </div>

        {/* Progress Bar when generating */}
        {isGenerating && (
          <div className="mt-6 p-4 bg-slate-800/80 border border-indigo-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {progress.message}
              </span>
              <span className="text-[#f8fafc] font-mono">{progress.percent}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Package Specs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">PostgreSQL Dump</span>
            <FileCode className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-[#f8fafc]">database_dump/dump_full.sql</p>
          <p className="text-xs text-[#94a3b8]">
            DDL completo de 17 tabelas, chaves primárias, constraints e carga de dados em comandos INSERT nativos.
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Frontend Build Assets</span>
            <FolderArchive className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-[#f8fafc]">frontend_build/*</p>
          <p className="text-xs text-[#94a3b8]">
            Manifestos de build, index.html estático, package.json versionado e metadados de deployment.
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Storage Supabase</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-[#f8fafc]">bucket: system-backups</p>
          <p className="text-xs text-[#94a3b8]">
            Sincronização na nuvem com versionamento temporal e soma de verificação SHA-256 para auditoria.
          </p>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-[#f8fafc]">Histórico de Snapshots Versionados</h3>
          </div>
          <span className="text-xs text-[#94a3b8]">{backups.length} snapshots registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#f8fafc]">
            <thead className="bg-slate-800/80 text-[#94a3b8] border-b border-slate-700">
              <tr>
                <th className="p-3">Data e Hora</th>
                <th className="p-3">Pacote (.ZIP)</th>
                <th className="p-3">Tamanho</th>
                <th className="p-3 text-center">Tabelas / Registros</th>
                <th className="p-3">Destino no Storage</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-[#94a3b8]">
                    {new Date(b.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 font-mono font-bold text-indigo-300">
                    {b.packageFileName}
                  </td>
                  <td className="p-3 text-[#94a3b8] font-mono">
                    {formatBytes(b.sizeBytes)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-[#f8fafc]">{b.tablesCount} tabelas</span>
                    <span className="text-slate-500"> ({b.totalRecordsCount} registros)</span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-400 truncate max-w-[200px]">
                    {b.storageBucket}/{b.storagePath}
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {b.status === 'STORED_SUPABASE' ? 'Supabase Storage' : 'Download Local'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleGenerateBackup(false)}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Baixar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
