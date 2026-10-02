import React, { useState } from 'react';
import { ArrowLeft, Download, HardDrive, Info, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { UserAccount, AutoBackupSnapshot } from '../../types';
import { appVersionText } from '../../config/appVersion';
import { getLocalServerInfo } from '../../services/offline/localServerSync';
import { ServerUpdateCard } from '../offline/ServerUpdateCard';
import { downloadBackupJsonFile, getAutoBackupHistory, performAutoBackup } from '../../data/storage';
import { notify } from '../../utils/dialogs';
import { moduleName } from '../../config/moduleNames';

/**
 * Atualizações do Sistema — só informações e ações reais:
 *  - versão em uso (data da publicação);
 *  - atualização do servidor local (Sede/escola), quando houver;
 *  - cópias de segurança feitas neste computador.
 * (O antigo módulo com Google Drive, "pacotes OTA" e logs de instalação era simulado e foi retirado.)
 */
interface SystemUpdateModuleProps {
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
  currentUser?: UserAccount | null;
  isAdmin?: boolean;
}

const fmt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};
const fmtSize = (b?: number) => (!b ? '—' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export const SystemUpdateModule: React.FC<SystemUpdateModuleProps> = ({ onBack, onNavigate, currentUser, isAdmin }) => {
  const server = getLocalServerInfo();
  const [history, setHistory] = useState<AutoBackupSnapshot[]>(() => getAutoBackupHistory());

  const backupNow = () => {
    try {
      const snap = performAutoBackup('Cópia manual (Atualizações do Sistema)', currentUser?.name || 'Usuário');
      setHistory(getAutoBackupHistory());
      downloadBackupJsonFile(snap);
      notify('Cópia de segurança criada neste computador e baixada como arquivo .json.', 'Cópia de segurança');
    } catch (err: any) {
      notify(`Não foi possível criar a cópia: ${err?.message || err}`, 'Cópia de segurança');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold">
            <RefreshCw className="h-3.5 w-3.5" />
            ATUALIZAÇÕES DO SISTEMA
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{appVersionText()}</h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          A versão é a data e a hora em que o sistema foi publicado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-indigo-600" />
            Como o sistema é atualizado
          </h2>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Pelo link publicado:</strong> a versão nova chega sozinha quando o sistema é publicado. Se uma janela
              estiver aberta, aparece o aviso para recarregar.
            </li>
            <li>
              <strong>Pelo servidor da rede (Sede ou escola):</strong> o servidor baixa e confere a versão nova; o
              administrador aplica no quadro abaixo (só aparece quando o sistema é aberto pelo servidor).
            </li>
            <li>
              <strong>Instalação nova:</strong> gere o pacote na{' '}
              <button onClick={() => onNavigate?.('NETWORK_INSTALLER')} className="text-indigo-700 font-bold underline cursor-pointer">
                {moduleName('NETWORK_INSTALLER')}
              </button>
              .
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600" />
            Servidor da rede local
          </h2>
          {server ? (
            <ServerUpdateCard isAdmin={isAdmin !== false} />
          ) : (
            <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">
              Este computador abriu o sistema pelo link publicado (sem servidor da rede local). Nada a atualizar aqui: a
              versão nova chega sozinha.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Cópias de segurança deste computador
            </h2>
            <p className="text-[11px] text-slate-500">
              Para restaurar uma cópia, use a{' '}
              <button onClick={() => onNavigate?.('NETWORK_INSTALLER')} className="text-indigo-700 font-bold underline cursor-pointer">
                {moduleName('NETWORK_INSTALLER')}
              </button>
              .
            </p>
          </div>
          <button
            onClick={backupNow}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <HardDrive className="h-3.5 w-3.5" />
            Fazer cópia agora (baixa o arquivo)
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">Nenhuma cópia feita neste computador ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Motivo</th>
                  <th className="p-2.5">Feita por</th>
                  <th className="p-2.5 text-center">Alunos</th>
                  <th className="p-2.5 text-center">Turmas</th>
                  <th className="p-2.5 text-center">Tamanho</th>
                  <th className="p-2.5 text-right">Arquivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="p-2.5 font-mono text-slate-700">{fmt(h.createdAt)}</td>
                    <td className="p-2.5 text-slate-700">{h.reason}</td>
                    <td className="p-2.5 text-slate-500">{h.operatorName}</td>
                    <td className="p-2.5 text-center">{h.stats?.studentsCount ?? '—'}</td>
                    <td className="p-2.5 text-center">{h.stats?.classesCount ?? '—'}</td>
                    <td className="p-2.5 text-center text-slate-500">{fmtSize(h.fileSizeBytes)}</td>
                    <td className="p-2.5 text-right">
                      {h.data ? (
                        <button
                          onClick={() => downloadBackupJsonFile(h)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          Baixar
                        </button>
                      ) : (
                        <span className="text-slate-400" title="O conteúdo desta cópia não está mais na memória deste navegador">
                          indisponível
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
