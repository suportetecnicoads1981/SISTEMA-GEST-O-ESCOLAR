import React from 'react';
import { AlertTriangle, RefreshCw, Database, Home, Sparkles } from 'lucide-react';
import { resetToCleanDatabase, resetToDemoDatabase, sanitizeLegacyLocalStorage } from '../../data/storage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isRestoring: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRestoring: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SucessoEdu ErrorBoundary] Erro capturado na renderização:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSanitizeAndReload = () => {
    this.setState({ isRestoring: true });
    try {
      sanitizeLegacyLocalStorage();
      localStorage.removeItem('sucessoedu_db_schema_version');
      localStorage.removeItem('sucessoedu_auth_session');
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      window.location.reload();
    }
  };

  private handleRestoreClean = () => {
    this.setState({ isRestoring: true });
    try {
      resetToCleanDatabase();
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      window.location.reload();
    }
  };

  private handleRestoreDemo = () => {
    this.setState({ isRestoring: true });
    try {
      resetToDemoDatabase();
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                  Recuperação Automática do Sistema
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  O SucessoEdu detectou uma inconsistência temporária de renderização e ativou o modo de segurança.
                </p>
              </div>
            </div>

            {/* Detalhes Técnicos do Erro */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Diagnóstico da Exceção:
              </div>
              <div className="font-mono text-xs text-rose-400 break-all">
                {this.state.error?.name}: {this.state.error?.message || 'Erro inesperado'}
              </div>
            </div>

            {/* Opções de Recuperação */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Ações de Recuperação com 1 Clique:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={this.handleSanitizeAndReload}
                  disabled={this.state.isRestoring}
                  className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-3 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <RefreshCw className={`w-5 h-5 shrink-0 ${this.state.isRestoring ? 'animate-spin' : ''}`} />
                  <div className="text-left">
                    <div>Saneamento & Recarregamento</div>
                    <div className="text-[10px] font-normal opacity-80">Preserva todos os dados do banco</div>
                  </div>
                </button>

                <button
                  onClick={this.handleRestoreDemo}
                  disabled={this.state.isRestoring}
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer"
                >
                  <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <div>Restaurar Base Demonstrativa</div>
                    <div className="text-[10px] font-normal opacity-80">Carrega escola com dados de teste</div>
                  </div>
                </button>

                <button
                  onClick={this.handleRestoreClean}
                  disabled={this.state.isRestoring}
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                  <div className="text-left">
                    <div>Restaurar Base Limpa (Produção)</div>
                    <div className="text-[10px] font-normal opacity-80">Estruturas ativas sem dados de teste</div>
                  </div>
                </button>

                <button
                  onClick={this.handleReload}
                  disabled={this.state.isRestoring}
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer"
                >
                  <Home className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <div>Recarregar Página</div>
                    <div className="text-[10px] font-normal opacity-80">Reinicializa a sessão atual</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
