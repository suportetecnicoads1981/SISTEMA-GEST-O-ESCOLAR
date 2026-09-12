import React, { useState } from 'react';
import {
  Shield,
  Key,
  Globe,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Lock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { AuthAutomator } from '../../services/datasync/AuthAutomator';
import { SUPABASE_CONFIG } from '../../services/datasync/supabaseClient';

export const AuthAutomatorView: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const envInfo = AuthAutomator.getEnvironmentInfo();
  const auditLogs = AuthAutomator.getAuditLogs();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div id="auth-automator-view" className="space-y-6">
      {/* Detecção Automática de Ambiente e Redirect URLs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-50">
                AuthAutomator - Detecção Automática de Ambiente & Redirect URLs
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Calcula dinamicamente as URLs de callback para autenticação OAuth e magic-link no Supabase Auth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Ambiente: {envInfo.environmentType}
            </span>
          </div>
        </div>

        {/* Detalhes do Ambiente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Origem do Host (Origin)</span>
            <span className="font-mono font-bold text-slate-200 break-all">{envInfo.origin}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Identificador de Usuário (auth.uid)</span>
            <span className="font-mono font-bold text-emerald-400">{envInfo.currentUserId}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Perfil Ativo</span>
            <span className="font-mono font-bold text-slate-200">
              {envInfo.currentUserEmail} ({envInfo.currentRole})
            </span>
          </div>
        </div>

        {/* Redirect URLs para Configuração no Supabase */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Redirect URLs Geradas para Configuração no Supabase Console:</span>
            <span className="text-slate-500 font-normal">Authentication &gt; URL Configuration</span>
          </label>

          <div className="space-y-2">
            {envInfo.recommendedRedirectUrls.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300"
              >
                <span className="truncate mr-2">{url}</span>
                <button
                  onClick={() => handleCopy(url)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedUrl === url ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar URL
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs de Auditoria de Sessões e Acesso */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-50">
              Auditoria de Sessão e Controle de Autenticação (Auth Logs)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Proteção JWT & PostgREST</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Usuário</th>
                <th className="py-2.5 px-3">Ação</th>
                <th className="py-2.5 px-3">IP & Rede</th>
                <th className="py-2.5 px-3">Ambiente</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-200">{log.userEmail}</div>
                    <div className="font-mono text-[10px] text-slate-500">{log.userId}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-xs">{log.ipAddress}</td>
                  <td className="py-3 px-3 text-slate-300 text-xs">{log.environment}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status}
                    </span>
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
