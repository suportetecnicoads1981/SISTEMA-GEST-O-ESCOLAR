import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  Radio,
  Trash2,
  Copy,
  Lock,
} from 'lucide-react';
import {
  EphemeralCommand,
  ApprovedCommandName,
  SupabaseRealtimeState,
} from '../../types/cleanslate';
import { SupabaseRealtimeService } from '../../services/cleanslate/SupabaseRealtimeService';

export const EphemeralTerminalCLI: React.FC = () => {
  const [commandsHistory, setCommandsHistory] = useState<EphemeralCommand[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<ApprovedCommandName>('rebuild-index');
  const [customInput, setCustomInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulateTamperedSignature, setSimulateTamperedSignature] = useState(false);
  const [realtimeState, setRealtimeState] = useState<SupabaseRealtimeState>(() =>
    SupabaseRealtimeService.getConnectionState()
  );

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll para o final do terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandsHistory, isExecuting]);

  // Executa um comando via Command Dispatcher com validação Ed25519
  const handleDispatchCommand = async (commandToRun?: ApprovedCommandName, isForged: boolean = false) => {
    const cmdName = commandToRun || selectedCommand;
    setIsExecuting(true);

    try {
      // 1. Gera o comando assinado digitalmente pelo Vault com curva Ed25519
      const command = SupabaseRealtimeService.createSignedCommand(
        cmdName,
        'usr-master-001',
        isForged || simulateTamperedSignature
      );

      // 2. Executa a validação e despacho seguro
      const executed = await SupabaseRealtimeService.dispatchAndExecute(command);

      setCommandsHistory((prev) => [...prev, executed]);
      setRealtimeState((prev) => ({
        ...prev,
        eventsReceivedCount: prev.eventsReceivedCount + 1,
      }));
    } finally {
      setIsExecuting(false);
    }
  };

  // Executar comando digitado no prompt
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const trimmed = customInput.trim().toLowerCase() as ApprovedCommandName;
    handleDispatchCommand(trimmed, false);
    setCustomInput('');
  };

  const handleClearTerminal = () => {
    setCommandsHistory([]);
  };

  return (
    <div className="space-y-6">
      {/* Header do Ephemeral CLI */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                EPHEMERAL CLI • ED25519 COMMAND DISPATCHER
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Terminal Efêmero &amp; Comandos Assinados pelo Servidor
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Arquitetura <strong>Client-Only Outbound</strong> (zero portas locais abertas). O terminal rejeita terminantemente acesso direto ao Shell do SO e executa exclusivamente comandos pré-aprovados na whitelist com assinatura criptográfica <strong>Ed25519</strong> em menos de 2 segundos.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">Supabase Realtime:</span>
              <span className="text-emerald-400 font-bold">CONECTADO</span>
            </div>
          </div>
        </div>

        {/* Metadados de Conexão Outbound e RLS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Modo de Conexão
            </span>
            <div className="text-emerald-400 font-bold">
              Client-Only Outbound
            </div>
            <div className="text-[10px] text-slate-400">
              Zero portas de escuta abertas
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Canal Supabase Realtime
            </span>
            <div className="text-sky-400 font-bold truncate">
              {realtimeState.channelName}
            </div>
            <div className="text-[10px] text-slate-400">
              WebSocket Seguro (WSS)
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Política RLS Ativa
            </span>
            <div className="text-amber-400 font-bold truncate">
              uid() = device_owner_id
            </div>
            <div className="text-[10px] text-slate-400">
              Isolamento por dispositivo
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Validação Criptográfica
            </span>
            <div className="text-slate-200 font-bold flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
              <span>Curva Ed25519</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Proteção contra Replay Attack
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Ações Rápidas de Comandos Pré-Aprovados */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Whitelist de Comandos Pré-Aprovados (Ephemeral CLI)
            </h4>
          </div>

          {/* Toggle de Simulação de Assinatura Forjada */}
          <button
            onClick={() => setSimulateTamperedSignature(!simulateTamperedSignature)}
            className={`px-3 py-1.5 rounded-md border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              simulateTamperedSignature
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Simula o envio de um comando com assinatura adulterada para auditar o bloqueio estrito"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>{simulateTamperedSignature ? 'Modo Teste: Assinatura Falsificada Ativa' : 'Testar Assinatura Forjada'}</span>
          </button>
        </div>

        {/* Grade de Comandos Pré-Aprovados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SupabaseRealtimeService.APPROVED_COMMANDS.map((cmd) => (
            <div
              key={cmd.name}
              className="p-3 bg-slate-950 border border-slate-800 rounded-md flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <code className="text-emerald-400 font-bold text-xs">{cmd.name}</code>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded-sm bg-slate-900 border border-slate-800">
                    &lt; 2s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {cmd.description}
                </p>
              </div>

              <button
                onClick={() => handleDispatchCommand(cmd.name, false)}
                disabled={isExecuting}
                className="w-full mt-2 px-3 py-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 rounded-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3 w-3" />
                <span>Despachar Comando Assinado</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Interativo com Cores do Design System (#020617 / #fbbf24) */}
      <div className="bg-slate-950 border border-slate-800 rounded-md overflow-hidden font-mono shadow-2xl">
        {/* Barra de Título do Terminal */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <TerminalIcon className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-white">
              Console Interativo • Ephemeral Remote CLI (SucessoEdu Enterprise)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearTerminal}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-sm text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Limpar Console</span>
            </button>
          </div>
        </div>

        {/* Saída de Logs do Terminal (text-amber-400) */}
        <div className="p-4 bg-[#020617] min-h-64 max-h-96 overflow-y-auto space-y-3 text-xs">
          <div className="text-slate-500 text-[11px] pb-1 border-b border-slate-900">
            [SYS_INIT] SucessoEdu CleanSlate Hub v5.6.0 | Protocolo Ephemeral-CLI-Ed25519 ativo.<br />
            [INFO] Digite um comando da whitelist ou clique nos botões acima para executar via Supabase Realtime.
          </div>

          {commandsHistory.length === 0 && (
            <div className="text-slate-600 italic text-[11px] py-4">
              Nenhum comando executado na sessão atual. O terminal aguarda instruções assinadas...
            </div>
          )}

          {commandsHistory.map((cmd) => {
            const isSuccess = cmd.status === 'SUCCESS';
            const isRejected = cmd.status === 'REJECTED_SIGNATURE';

            return (
              <div
                key={cmd.id}
                className={`p-3 rounded-md border text-[11px] space-y-1.5 ${
                  isSuccess
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-rose-950/30 border-rose-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">$ {cmd.commandName}</span>
                    <span className="text-slate-500">[{new Date(cmd.issuedAt).toLocaleTimeString('pt-BR')}]</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-400 truncate max-w-xs">
                      Assinatura: <code className="text-emerald-300">{cmd.signatureEd25519.substring(0, 24)}...</code>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-xs font-bold ${
                        isSuccess
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {isSuccess ? `EXIT 0 (${cmd.durationMs}ms)` : 'REJEITADO (403)'}
                    </span>
                  </div>
                </div>

                {/* Linhas de Saída do Terminal com a cor solicitada text-amber-400 */}
                <div className="space-y-0.5 pt-1 text-amber-400/90 font-mono text-[11px] leading-relaxed">
                  {cmd.output.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-slate-600 select-none">&gt;</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div ref={terminalEndRef} />
        </div>

        {/* Input do Terminal */}
        <form
          onSubmit={handleFormSubmit}
          className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2 text-xs"
        >
          <span className="text-emerald-400 font-bold select-none">&gt;</span>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={isExecuting}
            placeholder="Digite um comando pré-aprovado (ex: clear-cache, rebuild-index, rotate-logs)..."
            className="flex-1 bg-transparent text-amber-400 focus:outline-none font-mono placeholder:text-slate-600 text-xs"
          />
          <button
            type="submit"
            disabled={isExecuting || !customInput.trim()}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-sm text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Executar
          </button>
        </form>
      </div>
    </div>
  );
};
