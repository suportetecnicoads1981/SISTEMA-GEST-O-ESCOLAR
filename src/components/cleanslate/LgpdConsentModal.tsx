import React, { useState } from 'react';
import { ShieldCheck, Lock, Check, AlertCircle } from 'lucide-react';
import { LgpdConsentPreferences } from '../../types/cleanslate';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onAccept: (prefs: LgpdConsentPreferences) => void;
  onDecline: () => void;
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  const [technicalTelemetry, setTechnicalTelemetry] = useState(true);
  const [performanceDiagnostics, setPerformanceDiagnostics] = useState(true);
  const [crashReports, setCrashReports] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onAccept({
      technicalTelemetry,
      performanceDiagnostics,
      crashReports,
      acceptedAt: new Date().toISOString(),
      consentVersion: 'v2.1-LGPD-ENTERPRISE',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-md shadow-2xl p-6 space-y-5 text-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 rounded-md shrink-0">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                CONFORMIDADE LGPD (LEI Nº 13.709/2018)
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Privacidade &amp; Telemetria Técnica Anonimizada
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              O <strong>SucessoEdu CleanSlate Hub</strong> respeita integralmente a privacidade dos dados de infraestrutura. Nenhum dado pessoal ou número de série em texto claro é armazenado.
            </p>
          </div>
        </div>

        {/* Garantias Técnicas de Privacidade */}
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-md space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
            <Lock className="h-3.5 w-3.5" />
            <span>Garantias Criptográficas do Sistema:</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
            <li>
              <strong>Anonimização de Hardware:</strong> <code>CPU ID</code> e <code>Disk Serial</code> passam por <code>SHA-256(HardwareID + Secret_Salt)</code> antes de qualquer processamento.
            </li>
            <li>
              <strong>Retenção Estrita (TTL 90 dias):</strong> Logs e telemetrias técnicas expiram e são purgados automaticamente após 90 dias.
            </li>
            <li>
              <strong>Cofre Supabase Vault &amp; RLS:</strong> Acesso estritamente restrito via <code>uid() = device_owner_id</code> e criptografia em repouso.
            </li>
          </ul>
        </div>

        {/* Seleção Granular de Consentimento */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Preferências Granulares de Consentimento
          </h4>

          <label className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-850 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={technicalTelemetry}
              onChange={(e) => setTechnicalTelemetry(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-100 block">
                Telemetria Técnica de Hardware Anonimizada
              </span>
              <span className="text-slate-400 text-[11px] block">
                Permite verificar compatibilidade de SO, memória RAM e arquitetura para entrega otimizada de updates.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-850 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={performanceDiagnostics}
              onChange={(e) => setPerformanceDiagnostics(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-100 block">
                Diagnóstico de Desempenho e Latência Realtime
              </span>
              <span className="text-slate-400 text-[11px] block">
                Mede a latência de WebSocket para comandos do suporte técnico remoto e buffer de streaming do Google Drive.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-850 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={crashReports}
              onChange={(e) => setCrashReports(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-100 block">
                Relatórios de Integridade e Falhas de Execução
              </span>
              <span className="text-slate-400 text-[11px] block">
                Coleta pilha de erros despersonalizada para autocorreção e acionamento do Self-Healing de chunks.
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={onDecline}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs rounded-md transition-colors cursor-pointer"
          >
            Modo Mínimo (Sem Telemetria)
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold rounded-md flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Check className="h-4 w-4" />
            <span>Confirmar e Ativar Modo Blindado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
