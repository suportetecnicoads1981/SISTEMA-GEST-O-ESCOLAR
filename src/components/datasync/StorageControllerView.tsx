import React, { useState } from 'react';
import {
  HardDrive,
  Trash2,
  ExternalLink,
  Eye,
  Lock,
  Globe,
  Film,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { StorageController } from '../../services/datasync/StorageController';
import { StoredAsset } from '../../types/datasync';
import { FormatBadge } from './FormatBadge';
import { AuthAutomator } from '../../services/datasync/AuthAutomator';
import { confirmDialog, notify } from '../../utils/dialogs';

interface StorageControllerViewProps {
  assets: StoredAsset[];
  onAssetDeleted?: (deletedAssetId: string) => void;
}

export const StorageControllerView: React.FC<StorageControllerViewProps> = ({
  assets,
  onAssetDeleted,
}) => {
  const [selectedBucket, setSelectedBucket] = useState<'ALL' | 'vault' | 'public-assets'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deletionLog, setDeletionLog] = useState<{ fileName: string; path: string } | null>(null);
  const [previewAsset, setPreviewAsset] = useState<StoredAsset | null>(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesBucket = selectedBucket === 'ALL' || asset.bucket === selectedBucket;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBucket && matchesSearch;
  });

  const handleDelete = async (asset: StoredAsset) => {
    if (!await confirmDialog(`Confirmar exclusão de '${asset.name}'? O arquivo físico no Supabase Storage será expurgado automaticamente via Edge Function.`)) {
      return;
    }

    setIsDeletingId(asset.id);
    try {
      const res = await StorageController.deleteAsset(asset.id);
      AuthAutomator.recordAuditLog('STORAGE_CLEANUP', 'SUCCESS');
      setDeletionLog({ fileName: asset.name, path: res.deletedFile });
      onAssetDeleted?.(asset.id);
    } catch (err: any) {
      notify('Erro ao excluir: ' + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const totalVaultSize = assets
    .filter((a) => a.bucket === 'vault')
    .reduce((sum, a) => sum + a.sizeBytes, 0);

  const totalPublicSize = assets
    .filter((a) => a.bucket === 'public-assets')
    .reduce((sum, a) => sum + a.sizeBytes, 0);

  return (
    <div id="storage-controller-view" className="space-y-6">
      {/* Resumo de Capacidade dos Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bucket: public-assets</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Público CDN
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-50 flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            {(totalPublicSize / (1024 * 1024)).toFixed(2)} MB
          </div>
          <p className="text-xs text-slate-400">
            Teto máximo: 10MB por arquivo (10485760 bytes). Arquivos WebP estáticos e animados.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bucket: vault</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Privado RLS
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-50 flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-400" />
            {(totalVaultSize / (1024 * 1024)).toFixed(2)} MB
          </div>
          <p className="text-xs text-slate-400">
            Acesso autenticado estrito. Isolado por <code>auth.uid()</code> no Supabase Storage.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Limpeza Automática</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Edge Function
            </span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-indigo-400" />
            Sync Físico
          </div>
          <p className="text-xs text-slate-400">
            Excluir metadado remove fisicamente o binário dos buckets Supabase sem deixar órfãos.
          </p>
        </div>
      </div>

      {/* Alerta de Remoção Concluída */}
      {deletionLog && (
        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/40 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Arquivo físico removido do Supabase Storage com sucesso:{' '}
              <strong className="text-slate-100 font-mono">{deletionLog.path}</strong>
            </span>
          </div>
          <button
            onClick={() => setDeletionLog(null)}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Lista de Ativos com Filtro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Gestão de Ativos Armazenados no Supabase
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Todos os arquivos passaram pelo pipeline de conversão WebP e estão sob conformidade de RLS e limite de 10MB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-40"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedBucket('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedBucket === 'ALL'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedBucket('public-assets')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedBucket === 'public-assets'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                public-assets
              </button>
              <button
                onClick={() => setSelectedBucket('vault')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedBucket === 'vault'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                vault
              </button>
            </div>
          </div>
        </div>

        {/* Grade de Arquivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 text-xs">
              Nenhum ativo encontrado nos filtros selecionados.
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {asset.isAnimated ? (
                        <Film className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-mono font-bold text-slate-200 text-xs truncate" title={asset.name}>
                        {asset.name}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        asset.bucket === 'vault'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {asset.bucket}
                    </span>
                  </div>

                  {/* Badge de Formato e Economia */}
                  <FormatBadge
                    originalFormat={asset.originalFormat}
                    isAnimated={asset.isAnimated}
                    savingsRatio={asset.savingsRatio}
                    finalFormat="WEBP"
                  />

                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <div className="flex items-center justify-between font-mono">
                      <span>Tamanho WebP:</span>
                      <strong className="text-slate-200 font-extrabold">
                        {(asset.sizeBytes / 1024).toFixed(1)} KB
                      </strong>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span>Criado em:</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  {asset.publicUrl ? (
                    <a
                      href={asset.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Abrir Link
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500">Privado (Vault)</span>
                  )}

                  <button
                    onClick={() => handleDelete(asset)}
                    disabled={isDeletingId === asset.id}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                    title="Excluir metadado e arquivo físico do Supabase Storage"
                  >
                    {isDeletingId === asset.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
