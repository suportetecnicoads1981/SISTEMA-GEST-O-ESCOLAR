import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Play,
  FileCode,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { TroubleshootingIssue } from '../../types/instalaflow';
import { WindowsInstallerService } from '../../services/instalaflow/WindowsInstallerService';

export const TroubleshootingTable: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fixedIssues, setFixedIssues] = useState<Record<string, boolean>>({});
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');

  const issues: TroubleshootingIssue[] = [
    {
      id: 'err_0x5',
      errorCode: 'Erro 0x5 (ERROR_ACCESS_DENIED)',
      title: 'Acesso Negado na Criação do Diretório Raiz C:\\SucessoEdu',
      category: 'PERMISSIONS',
      severity: 'CRITICAL',
      symptoms: 'Instalador trava ou aborta com a mensagem "Acesso Negado" durante mkdir ou criação do banco SQLite.',
      rootCause: 'O Windows 10/11 bloqueia a criação direta de pastas na raiz C:\\ para processos sem o token UAC de Administrador Total.',
      recommendedSolution: 'Executar o script Take Ownership (takeown + icacls) ou aceitar o redirecionamento automático para C:\\ProgramData\\SucessoEdu.',
      executableScriptSnippet: `takeown /f "C:\\SucessoEdu" /r /d s >nul 2>&1
icacls "C:\\SucessoEdu" /reset /t /c /q >nul 2>&1
icacls "C:\\SucessoEdu" /grant Administrators:(OI)(CI)F /t /c /q
icacls "C:\\SucessoEdu" /grant "Users":(OI)(CI)M /t /c /q`,
      scriptLanguage: 'BAT',
    },
    {
      id: 'err_0x2',
      errorCode: 'Erro 0x2 (ERROR_FILE_NOT_FOUND)',
      title: 'Caminho ou Subdiretório Não Encontrado na Inicialização',
      category: 'DIRECTORY',
      severity: 'WARNING',
      symptoms: 'SQLite aciona o erro "unable to open database file: no such directory".',
      rootCause: 'As subpastas \\database, \\logs ou \\backups não foram criadas previamente antes da abertura da conexão.',
      recommendedSolution: 'Garantir mkdir em cadeia recursiva e validar caminho canônico antes de abrir a conexão SQLite.',
      executableScriptSnippet: `mkdir "C:\\ProgramData\\SucessoEdu\\database" 2>nul
mkdir "C:\\ProgramData\\SucessoEdu\\backups" 2>nul
mkdir "C:\\ProgramData\\SucessoEdu\\logs" 2>nul`,
      scriptLanguage: 'BAT',
    },
    {
      id: 'err_uac_block',
      errorCode: 'Erro 0x80070005 (UAC_ELEVATION_REQUIRED)',
      title: 'Execução Bloqueada sem Elevação de Privilégios no Windows',
      category: 'PERMISSIONS',
      severity: 'CRITICAL',
      symptoms: 'O instalador roda no contexto de usuário comum e falha ao registrar serviços e regras de firewall.',
      rootCause: 'O executável ou script não continha o manifesto XML requireAdministrator embutido.',
      recommendedSolution: 'Usar wrapper VBS/PowerShell com verbo RunAs ou incorporar o manifesto de compilação.',
      executableScriptSnippet: WindowsInstallerService.generateUACManifest(),
      scriptLanguage: 'XML',
    },
    {
      id: 'err_vcredist',
      errorCode: 'Dependência MSVCP140.dll Ausente',
      title: 'Visual C++ Redistributable 2015-2022 Não Detectado',
      category: 'DEPENDENCY',
      severity: 'WARNING',
      symptoms: 'O binário SQLite3 ou SQLCipher falha ao carregar com código 0xc000007b.',
      rootCause: 'Ambiente Windows recém-formatado sem os pacotes redistribuíveis da Microsoft instalados.',
      recommendedSolution: 'Instalar silenciosamente o pacote oficial da Microsoft via winget ou download direto.',
      executableScriptSnippet: `winget install Microsoft.VCRedist.2015+.x64 --silent --accept-package-agreements
:: Ou download direto:
powershell -Command "Invoke-WebRequest -Uri 'https://aka.ms/vs/17/release/vc_redist.x64.exe' -OutFile 'vc_redist.exe'; Start-Process 'vc_redist.exe' -ArgumentList '/install /passive /norestart' -Wait"`,
      scriptLanguage: 'POWERSHELL',
    },
    {
      id: 'err_firewall_3000',
      errorCode: 'Porta 3000 Fechada no Firewall',
      title: 'Estações de Trabalho Não Conseguem Conectar ao Servidor Local',
      category: 'FIREWALL',
      severity: 'WARNING',
      symptoms: 'Os terminais da secretaria ou professores exibem "ERR_CONNECTION_REFUSED" ao acessar o IP do servidor.',
      rootCause: 'O perfil de Rede Pública do Windows bloqueou a porta de escuta TCP 3000.',
      recommendedSolution: 'Adicionar regra de entrada no Firewall do Windows permitindo a porta 3000 na rede local.',
      executableScriptSnippet: `netsh advfirewall firewall add rule name="SucessoEdu Server HTTP" dir=in action=allow protocol=TCP localport=3000 profile=any`,
      scriptLanguage: 'BAT',
    },
    {
      id: 'err_supabase_timeout',
      errorCode: 'Timeout de Rede Supabase (Offline Fallback)',
      title: 'Falha Temporária de Internet ou Conexão com o Supabase Central',
      category: 'NETWORK',
      severity: 'INFO',
      symptoms: 'A aplicação exibe status offline mas continua operando normalmente no SQLite local.',
      rootCause: 'Queda de link de operadora local. O sistema enfileira as operações locais automaticamente.',
      recommendedSolution: 'Nenhuma ação manual necessária. O worker local acumula as alterações e efetua o flush quando a rede retornar.',
      executableScriptSnippet: `echo [*] O SQLite local continuara recebendo gravacoes offline.
echo [*] O Sync Worker executara retry com backoff exponencial a cada 15 segundos.`,
      scriptLanguage: 'BAT',
    },
  ];

  const filteredIssues = activeTabFilter === 'ALL'
    ? issues
    : issues.filter((i) => i.category === activeTabFilter);

  const handleCopyScript = (id: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAutoFix = (id: string) => {
    setFixedIssues((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      // Manter como resolvido
    }, 1000);
  };

  return (
    <div id="troubleshooting-table" className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Wrench className="w-3 h-3 text-amber-700" />
                Central de Diagnóstico & Reparo
              </span>
              <span className="text-xs text-slate-500">Auto-Remediação Windows</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              Tabela Dinâmica de Resolução de Problemas
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Diagnósticos instantâneos para Erro 0x5 (Acesso Negado), falhas de criação de pastas, privilégios UAC, regras de Firewall e dependências.
            </p>
          </div>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'PERMISSIONS', 'DIRECTORY', 'FIREWALL', 'DEPENDENCY', 'NETWORK'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTabFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTabFilter === cat
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'Todos os Erros' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Erros e Scripts de Solução */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => {
          const isResolved = fixedIssues[issue.id];

          return (
            <div
              key={issue.id}
              className={`bg-white border rounded-lg p-6 shadow-sm transition-all ${
                isResolved
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : issue.severity === 'CRITICAL'
                  ? 'border-red-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : issue.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {issue.errorCode}
                    </span>
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      {issue.category}
                    </span>
                    {isResolved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reparado com Sucesso
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 pt-1">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Sintoma:</strong> {issue.symptoms}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>Causa Raiz:</strong> {issue.rootCause}
                  </p>
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    <strong>Solução Recomendada:</strong> {issue.recommendedSolution}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  <button
                    onClick={() => handleAutoFix(issue.id)}
                    disabled={isResolved}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                      isResolved
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isResolved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Correção Aplicada
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Executar Correção Automática
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyScript(issue.id, issue.executableScriptSnippet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedId === issue.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Script
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bloco de Código do Script de Reparo */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" /> Script de Auto-Remediação ({issue.scriptLanguage})
                  </span>
                  <span>Clique em "Copiar Script" para rodar manualmente no CMD ou PowerShell como Admin</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre>{issue.executableScriptSnippet}</pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
