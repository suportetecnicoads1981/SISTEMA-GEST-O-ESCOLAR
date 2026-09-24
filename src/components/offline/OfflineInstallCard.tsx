import React, { useState } from 'react';
import { Building2, Download, Monitor, RefreshCw, School, WifiOff } from 'lucide-react';
import { buildSchoolSeed, buildServerPackage, buildStationPackage, generateAccessKey, saveBlob } from '../../services/offline/offlinePackageBuilder';
import { getStoredData } from '../../data/storage';
import { getLocalServerInfo } from '../../services/offline/localServerSync';

/**
 * Instalação sem internet: Servidor Remoto (escola), Servidor da Sede e estações.
 */
export const OfflineInstallCard: React.FC<{ schoolName?: string }> = ({ schoolName }) => {
  const [remoteName, setRemoteName] = useState(`Servidor Remoto - ${schoolName || 'Escola'}`);
  const [sedeName, setSedeName] = useState('Servidor da Sede - Secretaria de Educação');
  const [port, setPort] = useState(8088);
  const [serverIp, setServerIp] = useState('');
  const [stationKey, setStationKey] = useState('');
  const [lastKey, setLastKey] = useState<{ role: string; key: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const current = getLocalServerInfo();
  // Escolas cadastradas na Sede/nuvem: o Servidor Remoto já sai com a escola escolhida
  const schoolOptions: Array<{ id: string; name: string; inepCode?: string }> = (() => {
    try {
      return ((getStoredData() as any).schoolUnits || [])
        .filter((u: any) => u && u.id && u.name)
        .map((u: any) => ({ id: u.id, name: u.name, inepCode: u.inepCode }));
    } catch {
      return [];
    }
  })();
  const [remoteSchoolId, setRemoteSchoolId] = useState<string>(schoolOptions[0]?.id || '');

  const run = async (key: string, task: () => Promise<{ blob: Blob; fileName: string }>) => {
    setBusy(key);
    setMessage(null);
    setProgress('');
    try {
      const { blob, fileName } = await task();
      saveBlob(blob, fileName);
      setMessage({ ok: true, text: `Pacote ${fileName} gerado (${(blob.size / 1024 / 1024).toFixed(1)} MB). Leve-o ao computador de destino e siga o LEIA-ME.txt.` });
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || String(err) });
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  const validPort = Number.isInteger(port) && port >= 1024 && port <= 65535;
  const input = 'w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';
  const btn =
    'w-full mt-2 px-3 py-2 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50';

  return (
    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-4" data-testid="offline-install-card">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
          <WifiOff className="h-3 w-3" /> Escolas sem internet
        </span>
        <h2 className="text-lg font-black text-slate-900 mt-1">Instalação na rede local: Servidor Remoto, Sede e Estações</h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl">
          O <strong>Servidor Remoto</strong> fica na escola e guarda um banco único: todas as estações da escola gravam nele pela rede, sem internet.
          A escola gera um <strong>lote (.edusync)</strong> que é importado no <strong>Servidor da Sede</strong>, que centraliza as escolas e envia à nuvem quando houver internet.
          O pacote leva o mesmo sistema publicado na nuvem e só precisa do Windows 10/11.
        </p>
        {current && (
          <p className="text-[11px] mt-1 font-semibold text-indigo-700">
            Este computador está usando: {current.serverName} ({current.role === 'SEDE' ? 'Sede' : 'Servidor Remoto'}).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <School className="h-4 w-4 text-emerald-600" /> Servidor Remoto (escola)
          </h3>
          <label className="block text-[11px] font-semibold text-slate-600 mt-2">
            Nome do servidor
            <input className={input} value={remoteName} onChange={(e) => setRemoteName(e.target.value)} />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600 mt-2">
            Escola atendida por este servidor
            <select className={input} value={remoteSchoolId} onChange={(e) => setRemoteSchoolId(e.target.value)}>
              <option value="">Nenhuma (cadastrar a escola no servidor depois)</option>
              {schoolOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.inepCode && /^\d{8,}$/.test(String(u.inepCode)) ? ` (INEP ${u.inepCode})` : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[10px] text-slate-500 mt-1">
            O servidor já sai com a escola, as turmas e os alunos dela, e depois recebe da Sede o que mudar.
          </p>
          <button
            type="button"
            className={`${btn} bg-emerald-600 hover:bg-emerald-700`}
            disabled={!!busy || !validPort}
            onClick={() => {
              const key = generateAccessKey();
              run('REMOTO', async () => {
                const school = schoolOptions.find((u) => u.id === remoteSchoolId);
                const seedData = school ? buildSchoolSeed(getStoredData() as any, school.id) : null;
                const out = await buildServerPackage({
                  role: 'REMOTO',
                  serverName: remoteName,
                  port,
                  accessKey: key,
                  school,
                  seedData,
                  onProgress: (d, t) => setProgress(`${d}/${t}`),
                });
                setLastKey({ role: 'Servidor Remoto', key });
                setStationKey(key);
                return out;
              });
            }}
          >
            {busy === 'REMOTO' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar pacote do Servidor Remoto (.ZIP)
          </button>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-indigo-600" /> Servidor da Sede (Secretaria)
          </h3>
          <label className="block text-[11px] font-semibold text-slate-600 mt-2">
            Nome do servidor
            <input className={input} value={sedeName} onChange={(e) => setSedeName(e.target.value)} />
          </label>
          <button
            type="button"
            className={`${btn} bg-indigo-600 hover:bg-indigo-700`}
            disabled={!!busy || !validPort}
            onClick={() => {
              const key = generateAccessKey();
              run('SEDE', async () => {
                const out = await buildServerPackage({ role: 'SEDE', serverName: sedeName, port, accessKey: key, onProgress: (d, t) => setProgress(`${d}/${t}`) });
                setLastKey({ role: 'Servidor da Sede', key });
                return out;
              });
            }}
          >
            {busy === 'SEDE' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar pacote do Servidor da Sede (.ZIP)
          </button>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Monitor className="h-4 w-4 text-slate-600" /> Estação de trabalho
          </h3>
          <label className="block text-[11px] font-semibold text-slate-600 mt-2">
            IP do servidor (opcional: em branco, procura na rede)
            <input className={input} value={serverIp} placeholder="Ex.: 192.168.0.10" onChange={(e) => setServerIp(e.target.value)} />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600 mt-2">
            Chave de acesso do servidor (opcional: em branco, a estação pergunta)
            <input className={input} value={stationKey} placeholder="Ex.: K7P4-QX9M" onChange={(e) => setStationKey(e.target.value.toUpperCase())} />
          </label>
          <button
            type="button"
            className={`${btn} bg-slate-700 hover:bg-slate-800`}
            disabled={!!busy || !validPort || (serverIp.trim() !== '' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(serverIp.trim()))}
            onClick={() => run('ESTACAO', () => buildStationPackage(serverIp, port, stationKey))}
          >
            {busy === 'ESTACAO' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar pacote da Estação (.ZIP)
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        <label className="flex items-center gap-2 font-semibold">
          Porta de rede
          <input
            type="number"
            min={1024}
            max={65535}
            className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-200"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
          />
        </label>
        <span>Padrão 8088. Use a mesma porta no servidor e nas estações.</span>
        {busy && progress && <span className="font-semibold text-indigo-700">Preparando arquivos: {progress}</span>}
      </div>

      {lastKey && (
        <p className="text-sm font-bold text-slate-900 bg-amber-50 border border-amber-300 rounded-xl p-3" data-testid="offline-access-key">
          Chave de acesso do {lastKey.role}: <span className="font-mono text-indigo-700">{lastKey.key}</span>
          <span className="block text-[11px] font-normal text-slate-600">
            Anote esta chave: cada estação pede a chave no primeiro acesso. Ela também está no LEIA-ME.txt do pacote. Cada pacote gerado tem uma chave nova.
          </span>
        </p>
      )}

      {message && (
        <p role="status" className={`text-xs font-semibold ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};
