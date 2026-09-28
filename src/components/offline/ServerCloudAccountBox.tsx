import React, { useState } from 'react';
import { KeyRound, RefreshCw, Copy, Ban } from 'lucide-react';
import { getSupabaseClient } from '../../services/datasync/supabaseClient';
import { confirmDialog } from '../../utils/dialogs';

/**
 * Conta de nuvem do Servidor Remoto de uma escola (papel SERVIDOR, presa à escola).
 * Criada pela função criar-conta-servidor (somente administrador). O e-mail e a senha
 * aparecem uma única vez: digite-os em "Entrar na nuvem" no selo do servidor da escola.
 */
export const ServerCloudAccountBox: React.FC<{ schoolUnitId: string; schoolName?: string }> = ({ schoolUnitId, schoolName }) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ email: string; password?: string; renewed?: boolean; disabled?: boolean } | null>(null);
  const [error, setError] = useState('');

  const call = async (action: 'create' | 'disable') => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { data, error: err } = await getSupabaseClient().functions.invoke('criar-conta-servidor', { body: { schoolUnitId, action } });
      if (err) {
        let msg = err.message;
        try {
          const body = await (err as any).context?.json?.();
          if (body?.error) msg = body.error;
        } catch {
          /* mensagem padrão */
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 p-2.5 rounded-lg border border-emerald-200 bg-white space-y-2">
      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5 text-emerald-600" /> Conta do servidor na nuvem
      </div>
      <p className="text-[10px] text-slate-500">
        Conta própria da escola: envia só o lote dela e recebe só os dados dela. Não use a conta de uma pessoa no servidor.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={busy || !schoolUnitId}
          onClick={async () => {
            const ok = await confirmDialog(
              `Criar (ou renovar) a conta do servidor de ${schoolName || 'esta escola'}? Se já existir, a senha antiga deixa de valer e o servidor precisa entrar de novo com a nova.`,
              { title: 'Conta do servidor', confirmLabel: 'Criar / renovar' }
            );
            if (ok) call('create');
          }}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          {busy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />} Criar / renovar conta
        </button>
        <button
          type="button"
          disabled={busy || !schoolUnitId}
          onClick={async () => {
            const ok = await confirmDialog(`Desligar a conta do servidor de ${schoolName || 'esta escola'}? O servidor deixa de enviar e receber pela nuvem até a conta ser renovada.`, {
              title: 'Desligar conta do servidor',
              confirmLabel: 'Desligar',
              tone: 'danger',
            });
            if (ok) call('disable');
          }}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          <Ban className="h-3 w-3" /> Desligar
        </button>
      </div>
      {!schoolUnitId && <p className="text-[10px] text-amber-700">Escolha a escola acima.</p>}
      {error && <p className="text-[10px] text-rose-700 font-semibold">{error}</p>}
      {result?.disabled && <p className="text-[10px] text-slate-700">Conta {result.email} desligada.</p>}
      {result?.password && (
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] space-y-1">
          <p className="font-bold text-emerald-900">{result.renewed ? 'Conta renovada' : 'Conta criada'}. Anote agora (a senha não aparece de novo):</p>
          <p>
            E-mail: <code className="font-mono select-all">{result.email}</code>
          </p>
          <p>
            Senha: <code className="font-mono select-all">{result.password}</code>
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(`E-mail: ${result.email}\nSenha: ${result.password}`)}
            className="px-2 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Copy className="h-3 w-3" /> Copiar
          </button>
          <p className="text-[10px] text-slate-600">
            No servidor da escola: clique no selo do servidor, em "Entrar na nuvem", e use este e-mail e senha.
          </p>
        </div>
      )}
    </div>
  );
};

export default ServerCloudAccountBox;
