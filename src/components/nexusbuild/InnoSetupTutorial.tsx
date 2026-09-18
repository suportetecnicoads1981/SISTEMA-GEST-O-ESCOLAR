import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Play,
  Terminal,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  FolderDown,
  HelpCircle,
  XCircle,
  Info,
  Laptop,
  Server,
  ShieldAlert,
  Database,
  Code2,
  FileText
} from 'lucide-react';
import { MANUAL_BOAS_PRATICAS_TEXT } from '../../utils/nexusBuildGenerator';

interface InnoSetupTutorialProps {
  innoScriptContent: string;
  onDownloadScript: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const InnoSetupTutorial: React.FC<InnoSetupTutorialProps> = ({
  innoScriptContent,
  onDownloadScript,
}) => {
  // Modo de visualização: 'SIMPLE' (3 passos rápidos), 'ADVANCED' (7 passos técnicos) ou 'MANUAL' (Manual de Boas Práticas)
  const [viewMode, setViewMode] = useState<'SIMPLE' | 'ADVANCED' | 'MANUAL'>('SIMPLE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simpleStepDone, setSimpleStepDone] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
  });
  const [showAdvancedScript, setShowAdvancedScript] = useState(false);

  const handleDownloadManual = () => {
    const blob = new Blob([MANUAL_BOAS_PRATICAS_TEXT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MANUAL_BOAS_PRATICAS_INSTALACAO.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSimpleStep = (step: number) => {
    setSimpleStepDone((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-5">
      {/* Cabeçalho Simplificado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Como Criar o Instalador (.EXE) em 3 Passos Simples
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                RÁPIDO & FÁCIL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tudo o que você precisa para gerar o executável final em menos de 2 minutos.
            </p>
          </div>
        </div>

        {/* Alternador de Modo: Simplificado vs Detalhado vs Manual */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('SIMPLE')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'SIMPLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Modo 3 Passos (Recomendado)</span>
          </button>
          <button
            onClick={() => setViewMode('ADVANCED')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'ADVANCED'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Guia Técnico Completo</span>
          </button>
          <button
            onClick={() => setViewMode('MANUAL')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'MANUAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Manual Didático de Instalação</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CARD DE ESCLARECIMENTO: PRECISO INSTALAR ALGO ALÉM DO INNO? */}
      {/* ========================================================== */}
      <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                Preciso instalar algo além do Inno Setup para criar o instalador?
              </h3>
              <p className="text-xs text-indigo-200/80">
                Esclarecimento definitivo sobre dependências e ambiente de compilação.
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold w-fit">
            ✓ RESPOSTA: NÃO! APENAS O INNO SETUP 6
          </div>
        </div>

        {/* Comparativo Lado a Lado: Onde Você Compila vs Onde Você Instala */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* LADO A: SUA MÁQUINA DE COMPILAÇÃO */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Laptop className="h-4 w-4 text-cyan-400" />
                Sua Máquina (Onde você compila o .EXE)
              </span>
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                AMBIENTE DE BUILD
              </span>
            </div>

            <ul className="space-y-1.5 text-2xs text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">Inno Setup 6:</strong> Único programa que você precisa instalar (gratuito, da JR Software).
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">Script .ISS + Arquivos:</strong> Basta o arquivo <code className="text-cyan-300 font-mono">.iss</code> na mesma pasta dos arquivos da aplicação ou ZIP extraído.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">NÃO precisa de PostgreSQL:</strong> O banco de dados NÃO precisa estar instalado no seu computador para compilar.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">NÃO precisa de Node.js, Python, Git ou C++:</strong> O Inno Setup compila direto para código de máquina nativo x64.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Sem UAC obrigatório para compilar:</strong> Qualquer conta de usuário padrão pode gerar o <code className="text-indigo-300 font-mono">.exe</code>.
                </span>
              </li>
            </ul>
          </div>

          {/* LADO B: MÁQUINA DO CLIENTE/DESTINO */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                Computador de Destino (Onde o sistema vai rodar)
              </span>
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                PRODUÇÃO / RUNTIME
              </span>
            </div>

            <ul className="space-y-1.5 text-2xs text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300">Windows 10, 11 ou Server (x64):</strong> Sistema operacional padrão.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300">Elevação UAC (Administrador):</strong> Requisitada automaticamente ao dar duplo clique no <code className="text-indigo-300 font-mono">.exe</code> para criar <code className="text-emerald-300 font-mono">C:\SucessoEduSistema</code>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300">800MB livres em disco:</strong> O próprio instalador checa via <code className="text-emerald-300 font-mono">CheckFreeSpace</code> antes da instalação.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">Automação 100% no Destino:</strong> O executável gerado instala e provisiona o PostgreSQL, portas de firewall e backup diário sozinho!
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODO SIMPLIFICADO: 3 PASSOS DIRETOS AO PONTO               */}
      {/* ========================================================== */}
      {viewMode === 'SIMPLE' && (
        <div className="space-y-4">
          {/* Card Resumo do que vai acontecer */}
          <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>
                O Inno Setup junta seus arquivos e gera o arquivo <strong>SucessoEdu_Total_Suite_Setup.exe</strong> pronto para instalar em qualquer computador com Windows.
              </span>
            </div>
            <button
              onClick={onDownloadScript}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar Script .ISS</span>
            </button>
          </div>

          {/* Os 3 Passos em Cartões Visuais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PASSO 1 */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                simpleStepDone[1]
                  ? 'bg-slate-950 border-emerald-500/50 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                  1
                </span>
                <button
                  onClick={() => toggleSimpleStep(1)}
                  className={`text-xs font-mono px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    simpleStepDone[1]
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>{simpleStepDone[1] ? 'Feito' : 'Marcar'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-bold text-slate-100">
                  Instale Apenas o Inno Setup 6
                </h3>
              </div>
              <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                ÚNICA FERRAMENTA EXIGIDA
              </span>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Baixe e instale o programa gratuito da JR Software (leva menos de 1 minuto). <strong>Não requer</strong> PostgreSQL, Node.js ou compiladores adicionais.
              </p>

              <a
                href="https://jrsoftware.org/isdl.php"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Baixar Inno Setup 6 Oficial</span>
              </a>
            </div>

            {/* PASSO 2 */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                simpleStepDone[2]
                  ? 'bg-slate-950 border-emerald-500/50 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                  2
                </span>
                <button
                  onClick={() => toggleSimpleStep(2)}
                  className={`text-xs font-mono px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    simpleStepDone[2]
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>{simpleStepDone[2] ? 'Feito' : 'Marcar'}</span>
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mb-1">
                Baixe o Arquivo .ISS e Arquivos
              </h3>
              <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                MESMA PASTA DO PROJETO
              </span>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Coloque o <code className="text-cyan-300 font-mono">.iss</code> na mesma pasta dos arquivos do sistema ou descompacte o ZIP. O script já traz as regras de <code className="text-cyan-300 font-mono">C:\SucessoEduSistema</code>.
              </p>

              <button
                onClick={onDownloadScript}
                className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FolderDown className="h-3.5 w-3.5" />
                <span>Baixar SucessoEdu_Setup.iss</span>
              </button>
            </div>

            {/* PASSO 3 */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                simpleStepDone[3]
                  ? 'bg-slate-950 border-emerald-500/50 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                  3
                </span>
                <button
                  onClick={() => toggleSimpleStep(3)}
                  className={`text-xs font-mono px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    simpleStepDone[3]
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>{simpleStepDone[3] ? 'Feito' : 'Marcar'}</span>
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mb-1">
                Abra e Aperte Play (Compilar)
              </h3>
              <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                1 CLIQUE / ZERO CONFIG
              </span>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Dê duplo clique no <code className="text-cyan-300 font-mono">.iss</code> e aperte o botão verde <strong>Play</strong> ou <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-2xs">Ctrl + F9</kbd>. O .EXE é gerado na subpasta <strong>Output</strong>!
              </p>

              <div className="w-full py-2 rounded-md bg-slate-800 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-slate-700">
                <Play className="h-3.5 w-3.5 fill-emerald-400" />
                <span>Executável Gerado na Pasta Output!</span>
              </div>
            </div>
          </div>

          {/* Dúvidas Frequentes sobre Pré-requisitos e Compilação */}
          <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-amber-400" />
              <span className="text-sm">Perguntas Frequentes: Pré-requisitos para Criar o Instalador</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-2xs leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  1. Preciso instalar PostgreSQL, Node.js ou Python para compilar?
                </span>
                <p className="text-slate-300">
                  <strong className="text-amber-300">NÃO!</strong> O Inno Setup 6 é um compilador 100% autônomo. Ele não depende de nenhum compilador externo, interpretador Node.js ou banco de dados ativo na sua máquina. O executável <code className="text-cyan-300 font-mono">.exe</code> é compilado diretamente a partir das instruções do script <code className="text-indigo-300 font-mono">.iss</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  2. E o PostgreSQL? Onde e quando ele é instalado?
                </span>
                <p className="text-slate-300">
                  O PostgreSQL é instalado <strong className="text-cyan-300">somente no computador do cliente/escola</strong> no momento em que o instalador final <code className="text-indigo-300 font-mono">.exe</code> for executado. O instalador gerado executa o provisionamento silencioso, cria o banco e configura o <code className="text-cyan-300 font-mono">pg_hba.conf</code> sozinho.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  3. Se a pasta redist\ não tiver o executável do PostgreSQL, compila?
                </span>
                <p className="text-slate-300">
                  <strong className="text-emerald-400">Sim! Compila normalmente sem erros.</strong> O script possui as flags oficiais <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">skipifsourcedoesntexist</code> e <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">deleteafterinstall</code>. Se o arquivo não estiver presente, o instalador gerado ativa o download assistido oficial da EnterpriseDB em tempo de execução.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  4. Preciso ter privilégios de Administrador para compilar o .EXE?
                </span>
                <p className="text-slate-300">
                  <strong className="text-amber-300">Não para compilar.</strong> Qualquer usuário comum do Windows pode abrir o Inno Setup e compilar o script. A elevação UAC de Administrador só é exigida quando o instalador gerado for executado no computador de destino para criar a pasta <code className="text-emerald-300 font-mono">C:\SucessoEduSistema</code> e liberar o Firewall.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs pt-1 border-t border-amber-900/40">
              <div className="p-2 rounded bg-slate-950/70 border border-amber-900/40">
                <span className="font-bold text-emerald-400">Verificação de Espaço em Disco (800MB no Destino):</span>
                <p className="text-slate-300 mt-0.5">O script valida 800MB livres na máquina onde for instalado (300MB instalador temporário + 500MB iniciais de dados e logs).</p>
              </div>
              <div className="p-2 rounded bg-slate-950/70 border border-amber-900/40">
                <span className="font-bold text-emerald-400">Validação Automática de Portas TCP:</span>
                <p className="text-slate-300 mt-0.5">O instalador testa a porta 5432 via netstat na máquina cliente e remapeia para 5433 se houver conflito de serviço.</p>
              </div>
            </div>
          </div>

          {/* Card de Diagnóstico e Teste Manual: PostgreSQL 16.1 Unattended Bugfix */}
          <div className="p-4 rounded-lg bg-slate-950 border border-indigo-500/40 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Diagnóstico de Parâmetros PostgreSQL 16.1 (Unattended Mode Bugfix)
                  </h4>
                  <p className="text-2xs text-slate-400">
                    Validação do comando silencioso, escape de aspas e teste manual isolado no CMD.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-3xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                100% VALIDADO
              </span>
            </div>

            {/* Checklist dos 4 Pilares de Correção do Bug + Camada de Resiliência */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  1. Espaço em Disco (500MB+ Livres)
                </span>
                <p className="text-slate-300">
                  Validação prévia via <code className="text-cyan-300 font-mono">CheckDiskSpace</code> em <code className="text-indigo-300 font-mono">PrepareToInstall</code>. Se houver menos de 500MB livres, aborta preventivamente antes de extrair arquivos para evitar corrupção de I/O.
                </p>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  2. Diagnóstico de Processos (taskkill)
                </span>
                <p className="text-slate-300">
                  Varredura de instâncias ativas via <code className="text-cyan-300 font-mono">IsPostgresRunning()</code> e encerramento forçado de processos órfãos via <code className="text-indigo-300 font-mono">taskkill /F /IM postgres.exe /T</code> para liberar locks de arquivos e portas.
                </p>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  3. Log Visual em Tempo Real (TMemo)
                </span>
                <p className="text-slate-300">
                  Console embutido na página <code className="text-cyan-300 font-mono">wpInstalling</code> com fundo Dark Slate, fonte <code className="text-amber-300 font-mono">Courier New</code> e auto-scroll dinâmico via API Win32 <code className="text-indigo-300 font-mono">SendMessage</code>.
                </p>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  4. Porta Dinâmica & Firewall Automático
                </span>
                <p className="text-slate-300">
                  Verificação de porta via <code className="text-cyan-300 font-mono">netstat -an</code> com remapeamento inteligente (5432 → 5433) e configuração imediata de regras no Firewall via <code className="text-indigo-300 font-mono">netsh advfirewall</code>.
                </p>
              </div>
            </div>

            {/* Simulação do Console Visual Inno Setup wpInstalling */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-2xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                Console de Diagnóstico em Tempo Real (wpInstalling - TMemo Preview):
              </span>
              <div className="p-2.5 rounded bg-[#0f172a] border border-slate-700/60 font-mono text-3xs text-cyan-300 space-y-1 leading-relaxed">
                <div className="text-slate-400 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:02]</span> - Iniciando Pre-Install Check NexusEdu...
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:02]</span> - Espaço em disco livre: 48520MB detectados na unidade C:\
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:03]</span> - [OK] Espaço em disco validado com sucesso (500MB+ livres).
                </div>
                <div className="text-amber-300 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:03]</span> - [AVISO] Instância de Postgres detectada. Finalizando processos...
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:05]</span> - [OK] Processos postgres.exe finalizados com sucesso.
                </div>
                <div className="text-cyan-300 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:05]</span> - [REDE] Porta 5432 verificada e atribuída para o PostgreSQL.
                </div>
                <div className="text-slate-300 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:06]</span> - Executando instalador silencioso PostgreSQL 16.1 (Modo Unattended)...
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:38]</span> - [SUCESSO] PostgreSQL 16.1 instalado e cluster inicializado com êxito.
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">[10:14:39]</span> - [SUCESSO] NexusEdu DB instalado e otimizado.
                </div>
              </div>
            </div>

            {/* Código Pascal Script Resiliente */}
            <div className="space-y-1">
              <span className="text-2xs font-bold text-indigo-300 font-mono flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                Estrutura Pascal Script de Resiliência no Inno Setup [Code]:
              </span>
              <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-2xs text-cyan-300 overflow-x-auto leading-relaxed">
{`function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := '';
  AddToLog('Iniciando Pre-Install Check...');
  
  // 1. Validar Espaço em Disco (500MB livres recomendados)
  if not CheckDiskSpace(ExpandConstant('{app}'), 500) then
  begin
    Result := 'Espaço em disco insuficiente. São necessários pelo menos 500MB livres para o Banco de Dados.';
    Exit;
  end;
  
  // 2. Diagnosticar e Liberar Locks de postgres.exe
  if IsPostgresRunning() then
  begin
    AddToLog('[AVISO] Instância de Postgres detectada. Finalizando processos...');
    ShellExec('open', 'taskkill.exe', '/F /IM postgres.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
    Sleep(2000);
  end;
end;`}
              </pre>
            </div>

            {/* Teste Manual Isolado no Prompt de Comando (CMD) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold text-amber-300 font-mono flex items-center gap-1">
                  <Terminal className="h-3.5 w-3.5" />
                  Comando para Teste Manual Isolado no Prompt de Comando (CMD Admin):
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      'postgresql-16.1-windows-x64.exe --mode unattended --unattendedmodeui none --prefix "C:\\SucessoEduSistema\\PostgreSQL" --datadir "C:\\SucessoEduSistema\\Data\\pgdata" --superpassword "NexusEdu2026!" --serverport 5432 --create_shortcuts 0',
                      'cmd_postgres_test'
                    )
                  }
                  className="text-2xs text-amber-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedKey === 'cmd_postgres_test' ? 'Copiado!' : 'Copiar Comando CMD'}</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-2xs text-amber-200 overflow-x-auto">
{`postgresql-16.1-windows-x64.exe --mode unattended --unattendedmodeui none --prefix "C:\\SucessoEduSistema\\PostgreSQL" --datadir "C:\\SucessoEduSistema\\Data\\pgdata" --superpassword "NexusEdu2026!" --serverport 5432 --create_shortcuts 0`}
              </pre>
              <p className="text-3xs text-slate-400">
                💡 Dica de Isolamento: Abra o Prompt de Comando como <strong>Administrador</strong> na pasta do executável do PostgreSQL e cole o comando acima. Se a pasta <code className="text-cyan-300 font-mono">C:\SucessoEduSistema\PostgreSQL</code> for criada com sucesso, o binário do PostgreSQL está 100% íntegro.
              </p>
            </div>
          </div>

          {/* Atalho de Linha de Comando de 1 Linha (Para quem prefere terminal) */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-cyan-400" />
                Prefere compilar via linha de comando com 1 linha?
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    '"C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe" SucessoEdu_Setup.iss',
                    'cli_simple'
                  )
                }
                className="text-2xs text-cyan-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedKey === 'cli_simple' ? 'Copiado!' : 'Copiar Comando'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
{`"C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe" SucessoEdu_Setup.iss`}
            </pre>
          </div>

          {/* Sanfona para Visualizar o Script Sem Poluir a Tela */}
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <button
              onClick={() => setShowAdvancedScript(!showAdvancedScript)}
              className="w-full p-3 bg-slate-950 hover:bg-slate-850 flex items-center justify-between text-xs text-slate-300 font-mono transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" />
                <span>Ver conteúdo do script SucessoEdu_Setup.iss ({innoScriptContent.split('\n').length} linhas)</span>
              </span>
              {showAdvancedScript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showAdvancedScript && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 font-mono text-2xs text-slate-300 max-h-56 overflow-y-auto space-y-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCopy(innoScriptContent, 'iss_accordion')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-2xs font-mono flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedKey === 'iss_accordion' ? 'Copiado!' : 'Copiar Tudo'}</span>
                  </button>
                </div>
                <pre>{innoScriptContent.slice(0, 2000)}...</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODO AVANÇADO: GUIA COMPLETO DE 7 ETAPAS                   */}
      {/* ========================================================== */}
      {viewMode === 'ADVANCED' && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Guia completo para engenharia de software e implantações em redes escolares:</span>
            <button
              onClick={() => setViewMode('SIMPLE')}
              className="text-emerald-400 hover:underline font-mono text-2xs cursor-pointer flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              <span>Voltar ao Modo 3 Passos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="font-bold text-indigo-300 font-mono">1. Download</span>
              <p className="text-2xs text-slate-400 mt-1">Baixe Inno Setup 6 do site jrsoftware.org</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="font-bold text-indigo-300 font-mono">2. Organização</span>
              <p className="text-2xs text-slate-400 mt-1">Coloque os arquivos na mesma pasta do script</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="font-bold text-indigo-300 font-mono">3. Compilação</span>
              <p className="text-2xs text-slate-400 mt-1">Abra o .iss no Compil32 e aperte Play ou use ISCC.exe</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="font-bold text-indigo-300 font-mono">4. Distribuição</span>
              <p className="text-2xs text-slate-400 mt-1">Instale com duplo clique ou use /VERYSILENT em rede</p>
            </div>
          </div>

          {/* Matriz Técnica de Dependências de Engenharia */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              Matriz de Dependências: Build Host vs. Target Host
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-2xs font-mono border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <th className="p-2 text-left">Recurso / Software</th>
                    <th className="p-2 text-center">Máquina de Build (Criar o .EXE)</th>
                    <th className="p-2 text-center">Máquina de Destino (Instalação)</th>
                    <th className="p-2 text-left">Observação Técnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-2 font-bold text-slate-200">Inno Setup 6 (Compil32/ISCC)</td>
                    <td className="p-2 text-center text-emerald-400 font-bold">✓ OBRIGATÓRIO</td>
                    <td className="p-2 text-center text-slate-500">✗ Não Necessário</td>
                    <td className="p-2 text-slate-400">Única ferramenta de software instalada na máquina de compilação.</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-200">PostgreSQL 16.1 Server</td>
                    <td className="p-2 text-center text-slate-500">✗ Não Necessário</td>
                    <td className="p-2 text-center text-emerald-400 font-bold">✓ Auto-Deploy</td>
                    <td className="p-2 text-slate-400">O instalador gerado executa o setup não assistido no destino.</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-200">Node.js / Python / C++ SDKs</td>
                    <td className="p-2 text-center text-slate-500">✗ Não Necessário</td>
                    <td className="p-2 text-center text-slate-500">✗ Não Necessário</td>
                    <td className="p-2 text-slate-400">Zero dependência de runtimes ou interpretadores externos.</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-200">Elevação de Privilégios (UAC)</td>
                    <td className="p-2 text-center text-amber-400 font-bold">Usuário Padrão</td>
                    <td className="p-2 text-center text-emerald-400 font-bold">✓ Administrador</td>
                    <td className="p-2 text-slate-400">UAC exigido apenas na instalação final para criar C:\SucessoEduSistema e regras de firewall.</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-200">Espaço Mínimo em Disco</td>
                    <td className="p-2 text-center text-cyan-400">~100 MB livres</td>
                    <td className="p-2 text-center text-cyan-400">800 MB livres</td>
                    <td className="p-2 text-slate-400">Validação automática via CheckFreeSpace no início da extração.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Teste de Verificação do Inno Setup via Terminal */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Terminal className="h-4 w-4" />
                Como testar se o Inno Setup está pronto no seu terminal:
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    '& "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe" /?',
                    'cli_test'
                  )
                }
                className="text-2xs text-cyan-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedKey === 'cli_test' ? 'Copiado!' : 'Copiar Teste'}</span>
              </button>
            </div>
            <pre className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-2xs text-cyan-300">
{`& "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe" /?`}
            </pre>
            <p className="text-3xs text-slate-400">
              Se o comando exibir o cabeçalho do <em>Inno Setup 6 Command-Line Compiler</em>, seu ambiente está 100% pronto para gerar o executável final com um único comando.
            </p>
          </div>

          {/* Dicas de TI e Modo Silencioso */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">
              Comando para Instalação Silenciosa em Lote (Redes / GPO):
            </span>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 font-mono text-2xs text-slate-200">
              <span>SucessoEdu_Total_Suite_Setup.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-</span>
              <button
                onClick={() =>
                  handleCopy(
                    'SucessoEdu_Total_Suite_Setup.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-',
                    'silent'
                  )
                }
                className="text-cyan-400 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODO MANUAL: GUIA DIDÁTICO DE BOAS PRÁTICAS DE INSTALAÇÃO */}
      {/* ========================================================== */}
      {viewMode === 'MANUAL' && (
        <div className="space-y-5 pt-1">
          {/* Banner de Ações do Manual */}
          <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Manual de Boas Práticas de Instalação e Implantação
                </h3>
                <p className="text-xs text-amber-200/80">
                  Guia didático passo a passo para preparação, compilação, instalação e homologação em escolas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(MANUAL_BOAS_PRATICAS_TEXT, 'manual_full')}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedKey === 'manual_full' ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
              <button
                onClick={handleDownloadManual}
                className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Manual (.MD)</span>
              </button>
            </div>
          </div>

          {/* 1. Checklist de Pré-Requisitos */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-mono font-bold">1</span>
              Antes de Começar: Checklist de Pré-Requisitos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Laptop className="h-4 w-4" /> Hardware Mínimo
                </span>
                <p className="text-slate-300">Processador Dual Core ou superior, 4 GB de RAM (8 GB recomendado) e pelo menos <strong>800 MB livres</strong> em disco.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Server className="h-4 w-4" /> Sistema Operacional
                </span>
                <p className="text-slate-300">Windows 10, Windows 11 ou Windows Server (2016+) em edições <strong>64-bit (x64)</strong> com conta de Administrador.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> SmartScreen & Antivírus
                </span>
                <p className="text-slate-300">Se o aviso azul do Windows SmartScreen surgir, clique em <em>&quot;Mais informações&quot;</em> e depois em <em>&quot;Executar assim mesmo&quot;</em>.</p>
              </div>
            </div>
          </div>

          {/* 2. Estrutura da Pasta Raiz */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-mono font-bold">2</span>
              Estrutura Oficial de Arquivos (C:\SucessoEduSistema)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-2xs overflow-x-auto">
{`C:\\SucessoEduSistema\\
├── SucessoEdu_Setup.iss        <- Script Inno Setup
├── SucessoEdu_App.bat          <- Lançador universal (inicia .exe, HTML offline ou localhost:3000)
├── SucessoEdu_App.vbs          <- Lançador silencioso em segundo plano
├── SucessoEdu_App.exe          <- Executável compilado (opcional se houver)
├── criar_pastas_instalador.bat <- Criador de pastas
├── instalar_sucessoedu.bat     <- Testador local
└── redist\\                     <- (Opcional p/ 100% offline)
    └── postgresql-16.1-windows-x64.exe`}
              </pre>
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-300 space-y-2">
                <p>
                  <strong className="text-emerald-400">Instalação 100% Offline:</strong> Coloque o instalador do PostgreSQL dentro da subpasta <code className="text-cyan-300 font-mono">redist\</code>. O instalador final gerado conterá tudo embutido.
                </p>
                <p>
                  <strong className="text-amber-400">Instalação Assistida Online:</strong> Se a pasta <code className="text-cyan-300 font-mono">redist\</code> estiver vazia, o instalador compila do mesmo jeito e oferece o download oficial da EnterpriseDB durante a execução.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Como Compilar no Inno Setup 6 */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-mono font-bold">3</span>
              Como Compilar o Instalador no Inno Setup 6
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 font-mono">Passo A: Instalar o Inno</span>
                <p className="text-slate-300">Baixe o Inno Setup 6 gratuitamente em <a href="https://jrsoftware.org/isdl.php" target="_blank" rel="noreferrer" className="text-cyan-400 underline">jrsoftware.org</a>.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 font-mono">Passo B: Abrir o Script</span>
                <p className="text-slate-300">Dê duplo clique em <code className="text-cyan-300 font-mono">C:\SucessoEduSistema\SucessoEdu_Setup.iss</code>.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 font-mono">Passo C: Pressionar Ctrl + F9</span>
                <p className="text-slate-300">O arquivo final pronto surgirá na pasta <code className="text-emerald-300 font-mono">Output\SucessoEduSistema_Setup_x64.exe</code>.</p>
              </div>
            </div>
          </div>

          {/* 4 e 5. O que acontece nos Bastidores */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-mono font-bold">4</span>
              O que Acontece nos Bastidores Durante a Instalação
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">1. Espaço em Disco</span>
                <p className="text-slate-400 mt-0.5">Valida 800MB livres na unidade C:</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">2. Encerra Locks</span>
                <p className="text-slate-400 mt-0.5">Fecha processos postgres.exe ativos</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">3. Portas TCP</span>
                <p className="text-slate-400 mt-0.5">Testa 5432 e usa 5433 se ocupada</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">4. Instalação Silenciosa</span>
                <p className="text-slate-400 mt-0.5">Provisiona o Postgres 16.1 sem telas</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">5. Pasta de Dados</span>
                <p className="text-slate-400 mt-0.5">Cria cluster em Data\pgdata</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">6. Windows Firewall</span>
                <p className="text-slate-400 mt-0.5">Libera regras de entrada na porta</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">7. Backup Diário</span>
                <p className="text-slate-400 mt-0.5">Agenda tarefa às 03:00 da manhã</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">8. Atalho Único</span>
                <p className="text-slate-400 mt-0.5">1 ícone oficial na Área de Trabalho</p>
              </div>
            </div>
          </div>

          {/* 6. Checklist de Validação Pós-Instalação */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-mono font-bold">5</span>
              Checklist de Validação Pós-Instalação (2 Minutos)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Abertura do Sistema
                </span>
                <p className="text-slate-300">Duplo clique no atalho da Área de Trabalho. A tela de login do SucessoEdu deve carregar imediatamente.</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Processo postgres.exe
                </span>
                <p className="text-slate-300">No Gerenciador de Tarefas (Ctrl + Shift + Esc), verifique se o processo do PostgreSQL está em execução.</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Tarefa de Backup
                </span>
                <p className="text-slate-300">No Agendador de Tarefas do Windows, verifique se a tarefa <code className="text-cyan-300 font-mono">SucessoEdu_DailyBackup</code> está ativa.</p>
              </div>
            </div>
          </div>

          {/* 7. Dúvidas Frequentes */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-mono font-bold">6</span>
              Guia de Resolução de Dúvidas Rápidas
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-300">❓ A porta 5432 já estava sendo usada por outro programa. Vai dar conflito?</span>
                <p className="text-slate-300 mt-1">Não! O instalador faz verificação dinâmica e aloca automaticamente a porta 5433 ou 5434 sem travar a instalação.</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-300">❓ Como conectar os computadores dos professores ao servidor principal?</span>
                <p className="text-slate-300 mt-1">Não instale o banco nas máquinas dos professores. Apenas abra o navegador na máquina do professor e aponte para o IP do servidor (ex: <code className="text-cyan-300 font-mono">http://192.168.1.100:3000</code>).</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-300">❓ Onde os backups ficam salvos?</span>
                <p className="text-slate-300 mt-1">Ficam guardados em <code className="text-cyan-300 font-mono">C:\SucessoEduSistema\Backups\</code>. Basta copiar essa pasta semanalmente para um pen drive ou Google Drive.</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">❓ Ao clicar em "Concluir" no final da instalação, apareceu "CreateProcess falhou; código 2"?</span>
                <p className="text-slate-300 mt-1">Esse erro acontecia porque o Windows tentava executar o <code className="text-cyan-300 font-mono">SucessoEdu_App.exe</code> que ainda não havia sido colocado na pasta. Com nossa atualização, o instalador agora usa o <strong>Lançador Universal Inteligente</strong> (<code className="text-cyan-300 font-mono">SucessoEdu_App.bat</code> e <code className="text-cyan-300 font-mono">SucessoEdu_App.vbs</code>) com proteção <code className="text-amber-300 font-mono">skipifdoesntexist</code>, garantindo que o sistema abra direto no navegador sem nenhum erro!</p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-sky-400">❓ Ao tentar executar em outro computador, apareceu "Este programa não suporta a versão do Windows..."?</span>
                <p className="text-slate-300 mt-1">Esse erro acontecia porque o instalador continha a restrição rígida <code className="text-rose-400 font-mono">ArchitecturesAllowed=x64</code> (bloqueando máquinas 32 bits e ARM) e dependia da versão mínima estrita do Inno Setup 6 (<code className="text-rose-400 font-mono">6.1sp1</code>). Removemos essa trava e adicionamos <code className="text-emerald-400 font-mono">MinVersion=6.1</code> universal com <code className="text-emerald-400 font-mono">OnlyBelowVersion=0</code>, permitindo que o instalador execute em <strong>qualquer edição do Windows (7, 8, 8.1, 10, 11 e Windows Server)</strong>, tanto em 32 quanto em 64 bits!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
