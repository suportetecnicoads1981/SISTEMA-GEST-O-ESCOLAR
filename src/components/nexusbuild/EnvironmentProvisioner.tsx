import React from 'react';
import {
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Copy,
  Lock,
  FileKey,
  Database,
  Terminal,
  Bookmark
} from 'lucide-react';

interface EnvironmentProvisionerProps {
  onCopyCommand: (cmd: string) => void;
}

export const EnvironmentProvisioner: React.FC<EnvironmentProvisionerProps> = ({
  onCopyCommand,
}) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const icaclsCommand = `icacls "C:\\SucessoEduSistema" /grant administrators:F /grant "%USERNAME%":F /grant "NT SERVICE\\SucessoEduBackup":F /T /C /Q`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    onCopyCommand(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const folders = [
    { path: 'C:\\SucessoEduSistema\\Bin', desc: 'Executáveis e bibliotecas essenciais', icon: Terminal, persist: false },
    { path: 'C:\\SucessoEduSistema\\Data', desc: 'Dados do PostgreSQL e bases educacionais', icon: Database, persist: true },
    { path: 'C:\\SucessoEduSistema\\Config', desc: 'pg_hba.conf, firewall e configurações', icon: Bookmark, persist: false },
    { path: 'C:\\SucessoEduSistema\\Logs', desc: 'Auditorias SAST e logs de execução', icon: Terminal, persist: false },
    { path: 'C:\\SucessoEduSistema\\Backups', desc: 'Arquivos ZIP do backup diário das 03:00 AM', icon: HardDrive, persist: true },
    { path: 'C:\\SucessoEduSistema\\Scripts', desc: 'Rotinas PowerShell e Batch de automação', icon: Terminal, persist: false },
    { path: 'C:\\SucessoEduSistema\\Keys', desc: 'Chaves de licença criptografadas (.lic, .key)', icon: FileKey, persist: true },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <FolderTree className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Environment Provisioner & Raiz C:\SucessoEduSistema
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                PROVISÃO OBRIGATÓRIA
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Criação estrutural da raiz, permissões de controle total (icacls) e política de preservação de dados.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleCopy(icaclsCommand, 'icacls')}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
        >
          <Copy className="h-3.5 w-3.5 text-cyan-400" />
          <span>{copied === 'icacls' ? 'Copiado!' : 'Copiar Comando Icacls'}</span>
        </button>
      </div>

      {/* Comando Icacls em Destaque */}
      <div className="mt-5 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between text-2xs font-mono text-slate-400 pb-1.5 border-b border-slate-900">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Permissões de Controle Total (Administrators, Usuário Atual & NexusBackup)
          </span>
          <span className="text-slate-500">Auto-aplicável no instalador</span>
        </div>
        <pre className="mt-2 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
          {icaclsCommand}
        </pre>
      </div>

      {/* Árvore de Diretórios e Política de Persistência */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            Diretórios Provisionados e Política de Desinstalação
          </span>
          <span className="text-2xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
            Flags Inno Setup: uninsneveruninstall
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {folders.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    <Icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-200">
                      {f.path}
                    </div>
                    <div className="text-2xs text-slate-400 mt-0.5">
                      {f.desc}
                    </div>
                  </div>
                </div>

                {f.persist ? (
                  <span className="px-2 py-0.5 rounded text-2xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40 shrink-0 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    PRESERVADO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-2xs font-mono bg-slate-900 text-slate-400 shrink-0">
                    PADRÃO
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ShortcutManager Integrado */}
      <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            ShortcutManager: Atalhos Oficiais do Windows
          </span>
          <span className="text-2xs font-mono text-slate-400">
            Ícone: C:\SucessoEduSistema\sucessoedu.ico
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span>Área de Trabalho (Desktop):</span>
            <span className="text-cyan-400 font-bold">SucessoEdu Gestão Educacional.lnk</span>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span>Menu Iniciar:</span>
            <span className="text-indigo-400 font-bold">Programas \ SucessoEdu</span>
          </div>
        </div>
      </div>
    </div>
  );
};
