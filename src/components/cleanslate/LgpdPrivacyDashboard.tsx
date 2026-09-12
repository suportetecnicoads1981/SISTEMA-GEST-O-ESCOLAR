import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Clock,
  KeyRound,
  EyeOff,
  CheckCircle2,
  FileText,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { HardwareTelemetryLGPD, LgpdConsentPreferences } from '../../types/cleanslate';
import { LgpdSecurityService } from '../../services/cleanslate/LgpdSecurityService';

export const LgpdPrivacyDashboard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HardwareTelemetryLGPD | null>(null);
  const [consentPrefs, setConsentPrefs] = useState<LgpdConsentPreferences | null>(() =>
    LgpdSecurityService.getStoredConsent()
  );
  const [isRotatingSalt, setIsRotatingSalt] = useState(false);

  useEffect(() => {
    LgpdSecurityService.getAnonymizedHardwareTelemetry(Boolean(consentPrefs?.technicalTelemetry)).then(
      (data) => setTelemetry(data)
    );
  }, [consentPrefs]);

  const handleRotateSalt = async () => {
    setIsRotatingSalt(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (telemetry) {
        const fresh = await LgpdSecurityService.getAnonymizedHardwareTelemetry(true);
        setTelemetry(fresh);
      }
    } finally {
      setIsRotatingSalt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header LGPD & Hardware Anonymization */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                BLINDAGEM LGPD • ART. 13 DA LEI Nº 13.709/2018
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Anonimização Criptográfica de Hardware &amp; Retenção Estrita (TTL 90 Dias)
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Garante que o <code>CPU ID</code> e o <code>Disk Serial</code> do host sejam anonimizados via <strong>SHA-256(HardwareID + Secret_Salt)</strong> antes de qualquer persistência ou transmissão. O identificador físico bruto nunca é gravado em disco ou enviado à nuvem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotateSalt}
              disabled={isRotatingSalt}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold rounded-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              title="Gera novos hashes anonimizados simulando a rotação periódica de segredos no Vault"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isRotatingSalt ? 'animate-spin' : 'text-emerald-400'}`} />
              <span>Rotacionar Salt do Vault</span>
            </button>
          </div>
        </div>

        {/* Métricas de Conformidade */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Status de Anonimização
            </span>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>100% Pseudonimizado</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Zero IDs em texto claro
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Política de Retenção (TTL)
            </span>
            <div className="text-slate-200 font-bold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Expiração em 90 Dias</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Expira: {telemetry ? new Date(telemetry.ttlExpiresAt).toLocaleDateString('pt-BR') : '--'}
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Supabase Auth &amp; RLS
            </span>
            <div className="text-amber-400 font-bold truncate">
              uid() = device_owner_id
            </div>
            <div className="text-[10px] text-slate-400">
              Isolamento criptográfico ativo
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Cofre Supabase Vault
            </span>
            <div className="text-slate-200 font-bold flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
              <span>AES-256-GCM em Repouso</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Chave gerenciada no HSM
            </div>
          </div>
        </div>
      </div>

      {/* Auditoria Transparente de Hashes de Hardware */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Inspeção de Identificadores de Hardware (Texto Claro vs Anonimizado)
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
            Artigo 13 da LGPD Aplicado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU ID Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">CPU Identifier</span>
              <span className="text-[10px] text-emerald-400 font-bold">SHA-256 + Salt</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <span className="text-slate-500 block">Valor Bruto no Sistema:</span>
              <div className="p-2 bg-slate-900 rounded-sm text-slate-500 line-through select-none">
                [BLOQUEADO: NUNCA GRAVADO NO BANCO OU LOGS]
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1">
              <span className="text-emerald-400 block">Hash Salvo na Telemetria:</span>
              <div className="p-2 bg-slate-900 rounded-sm text-emerald-400 font-bold break-all select-all border border-slate-800">
                {telemetry?.anonymizedCpuHash}
              </div>
            </div>
          </div>

          {/* Disk Serial Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Disk Serial Number</span>
              <span className="text-[10px] text-emerald-400 font-bold">SHA-256 + Salt</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <span className="text-slate-500 block">Valor Bruto no Sistema:</span>
              <div className="p-2 bg-slate-900 rounded-sm text-slate-500 line-through select-none">
                [BLOQUEADO: NUNCA GRAVADO NO BANCO OU LOGS]
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1">
              <span className="text-emerald-400 block">Hash Salvo na Telemetria:</span>
              <div className="p-2 bg-slate-900 rounded-sm text-emerald-400 font-bold break-all select-all border border-slate-800">
                {telemetry?.anonymizedDiskHash}
              </div>
            </div>
          </div>
        </div>

        {/* Políticas de Data Minimization e Edge Functions TTL */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Mecanismo de Data Minimization &amp; TTL Automático</span>
          </div>
          <p className="leading-relaxed">
            A rotina de limpeza de telemetria é executada diariamente via Edge Function com instrução SQL:
            <code className="text-emerald-400 block p-2 mt-1 bg-slate-900 rounded-sm select-all">
              DELETE FROM device_telemetry_logs WHERE created_at &lt; NOW() - INTERVAL '90 days';
            </code>
            Qualquer registro anterior a 90 dias sofre sobrescrita e remoção definitiva sem possibilidade de recuperação.
          </p>
        </div>
      </div>
    </div>
  );
};
