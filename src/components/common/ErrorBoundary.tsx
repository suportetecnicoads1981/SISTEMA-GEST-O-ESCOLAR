import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Database,
  Home,
  Sparkles,
  Wrench,
  CheckCircle2,
  Copy,
  Check,
  Code,
  Terminal,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Zap,
  Play,
  CheckCheck,
} from 'lucide-react';
import { resetToCleanDatabase, resetToDemoDatabase, sanitizeLegacyLocalStorage } from '../../data/storage';
import { DatabaseAutomatorService } from '../../services/databaseAutomatorService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export type RepairActionType =
  | 'REPAIR_ROLE_PREFERENCES'
  | 'REPAIR_UNDEFINED_PROPERTIES'
  | 'REPAIR_LOCALSTORAGE'
  | 'RUN_RELATIONAL_AUTOHEAL'
  | 'RUN_FULL_MIGRATION';

export interface ExecutableFixItem {
  text: string;
  actionType?: RepairActionType;
  actionLabel?: string;
}

export interface DetailedErrorDiagnosis {
  category: string;
  affectedComponent: string;
  diagnosisText: string;
  recommendedFixes: ExecutableFixItem[];
  codeSnippetHint?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isRestoring: boolean;
  showTechStack: boolean;
  copiedToClipboard: boolean;
  isExecutingRepair: boolean;
  repairStatusMessage: string | null;
}

/**
 * Utilitário de diagnóstico que analisa o erro e gera o plano exato de correção
 * transformando cada sugestão em ações executáveis diretamente no DatabaseAutomatorService.
 */
export function analyzeErrorAndBuildFixPlan(
  error: Error | null,
  errorInfo: React.ErrorInfo | null
): DetailedErrorDiagnosis {
  if (!error) {
    return {
      category: 'Exceção Desconhecida',
      affectedComponent: '<Componente Desconhecido>',
      diagnosisText: 'Nenhuma informação detalhada de exceção foi capturada pelo manipulador.',
      recommendedFixes: [
        {
          text: 'Executar a Auto-Cura de Estrutura e Schemas no DatabaseAutomatorService.',
          actionType: 'RUN_RELATIONAL_AUTOHEAL',
          actionLabel: '✨ Executar Auto-Cura Relacional de Registros',
        },
        {
          text: 'Sanear o estado local e recarregar a sessão.',
          actionType: 'REPAIR_LOCALSTORAGE',
          actionLabel: '🧹 Purgar e Sanear Armazenamento Local',
        },
      ],
      severity: 'WARNING',
    };
  }

  const message = error.message || '';
  const componentStack = errorInfo?.componentStack || '';

  // Tenta extrair o nome do componente primário do componentStack
  let affectedComponent = '<Componente Desconhecido>';
  if (componentStack) {
    const lines = componentStack.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const match = lines[0].match(/at\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) {
        affectedComponent = `<${match[1]}>`;
      } else {
        affectedComponent = lines[0].substring(0, 40);
      }
    }
  }

  // 1. Erro de Propriedade Indefinida / Nula (TypeError)
  if (
    message.includes('Cannot read properties of undefined') ||
    message.includes('Cannot read property') ||
    message.includes('null is not an object') ||
    message.includes('undefined is not an object')
  ) {
    const propMatch = message.match(/reading ['"]([^'"]+)['"]/);
    const propName = propMatch ? propMatch[1] : 'propriedade';

    return {
      category: 'Acesso a Propriedade Indefinida (TypeError)',
      affectedComponent,
      diagnosisText: `O componente ${affectedComponent} tentou ler a propriedade '${propName}' de um objeto que estava 'undefined' ou não havia sido inicializado durante a renderização.`,
      recommendedFixes: [
        {
          text: `Executar o script de reparo de propriedades indefinidas e fallbacks no DatabaseAutomatorService para restabelecer os objetos padrão.`,
          actionType: 'REPAIR_UNDEFINED_PROPERTIES',
          actionLabel: '⚡ Executar Reparo Automático de Propriedades e Schemas Indefinidos',
        },
        {
          text: `Executar a Auto-Cura Relacional Completa para restaurar turmas, alunos, disciplinas e configurações ausentes.`,
          actionType: 'RUN_RELATIONAL_AUTOHEAL',
          actionLabel: '✨ Executar Auto-Cura Relacional do Banco',
        },
        {
          text: `Aplicar encadeamento opcional (?.) no código do componente (ex: objeto?.${propName} ?? fallback).`,
        },
      ],
      codeSnippetHint: `// Exemplo de Correção a Implementar:\nconst ${propName}Val = objeto?.${propName} ?? INLINE_DEFAULT_FALLBACK;\nif (!objeto) return <LoadingSpinner />;`,
      severity: 'CRITICAL',
    };
  }

  // 2. Erro de Permissões / Perfis / Roles (ADMIN, TEACHER, STUDENT, PARENT, rolePreferences)
  if (
    message.includes('ADMIN') ||
    message.includes('rolePreferences') ||
    message.includes('TEACHER') ||
    message.includes('STUDENT') ||
    message.includes('PARENT')
  ) {
    return {
      category: 'Inconsistência em Perfis de Acesso / RBAC',
      affectedComponent,
      diagnosisText: `Falha ao mapear permissões ou o dicionário de preferências por papel do usuário ('rolePreferences'). Alguma chave esperada ('ADMIN', 'TEACHER', 'STUDENT') veio ausente.`,
      recommendedFixes: [
        {
          text: `Reparar e restaurar o dicionário de RolePreferences para todas as roles via DatabaseAutomatorService.`,
          actionType: 'REPAIR_ROLE_PREFERENCES',
          actionLabel: '🔧 Executar Reparo Automático de RolePreferences',
        },
        {
          text: `Executar a automação DDL completa e atualização de banco de dados para a v5.5.1 Enterprise.`,
          actionType: 'RUN_FULL_MIGRATION',
          actionLabel: '🚀 Executar Automação DDL/Migração v5.5.1',
        },
        {
          text: `Integrar 'normalizeRole()' de 'src/utils/roleNormalizer.ts' no carregamento do perfil.`,
        },
      ],
      codeSnippetHint: `import { normalizeRole } from '../utils/roleNormalizer';\nconst safeRole = normalizeRole(userProfile?.role);`,
      severity: 'CRITICAL',
    };
  }

  // 3. Erro de Parse de Dados / Storage Local
  if (
    message.includes('JSON') ||
    message.includes('SyntaxError') ||
    message.includes('storage') ||
    message.includes('QuotaExceededError')
  ) {
    return {
      category: 'Corrupção no Banco de Dados Local (LocalStorage)',
      affectedComponent,
      diagnosisText: `O sistema encontrou um registro corrompido ou malformado ao ler dados do localStorage ou IndexedDB.`,
      recommendedFixes: [
        {
          text: `Executar o saneamento do LocalStorage no DatabaseAutomatorService para purgar registros órfãos.`,
          actionType: 'REPAIR_LOCALSTORAGE',
          actionLabel: '🧹 Executar Saneamento de LocalStorage',
        },
        {
          text: `Executar a Auto-Cura Relacional para re-sincronizar chaves e regravação íntegra.`,
          actionType: 'RUN_RELATIONAL_AUTOHEAL',
          actionLabel: '✨ Restabelecer Integridade Relacional',
        },
        {
          text: `Envolver chamadas 'JSON.parse()' em blocos try/catch com fallback defensivo.`,
        },
      ],
      codeSnippetHint: `try {\n  return JSON.parse(rawData);\n} catch (err) {\n  return DEFAULT_FALLBACK_DATA;\n}`,
      severity: 'WARNING',
    };
  }

  // 4. Erro de Rede / API / Servidor Micro
  if (
    message.includes('fetch') ||
    message.includes('Network') ||
    message.includes('CORS') ||
    message.includes('Failed to fetch')
  ) {
    return {
      category: 'Falha de Conectividade / API / Servidor Local',
      affectedComponent,
      diagnosisText: `Não foi possível obter resposta do servidor backend, banco de dados remoto ou micro-servidor HTTP em 'C:\\SucessoEdu'.`,
      recommendedFixes: [
        {
          text: `Sincronizar o estado offline e garantir o schema local íntegro via DatabaseAutomatorService.`,
          actionType: 'REPAIR_UNDEFINED_PROPERTIES',
          actionLabel: '⚡ Sincronizar e Sanear Estado do Banco Local',
        },
        {
          text: `Executar a automação DDL e recálculo do score de saúde da base de dados.`,
          actionType: 'RUN_FULL_MIGRATION',
          actionLabel: '🚀 Recalcular Saúde e Atualizar Banco Local',
        },
        {
          text: `Verificar se o micro-servidor local ('server_micro.ps1' ou 'iniciar_servidor.bat') está ativo no host.`,
        },
      ],
      codeSnippetHint: `try {\n  const res = await fetch('/api/endpoint');\n} catch (err) {\n  setOfflineStatus(true);\n}`,
      severity: 'WARNING',
    };
  }

  // 5. Erro Genérico de Componente
  return {
    category: 'Exceção Genérica de Renderização',
    affectedComponent,
    diagnosisText: `Ocorreu uma exceção não tratada durante o ciclo de vida de renderização do componente: ${message}`,
    recommendedFixes: [
      {
        text: `Executar Auto-Cura de Estrutura e Dados no DatabaseAutomatorService.`,
        actionType: 'RUN_RELATIONAL_AUTOHEAL',
        actionLabel: '✨ Executar Auto-Cura de Estrutura e Dados',
      },
      {
        text: `Higienizar permissões, fallbacks e re-inicializar a sessão.`,
        actionType: 'REPAIR_ROLE_PREFERENCES',
        actionLabel: '🔧 Higienizar Dicionário de Permissões',
      },
      {
        text: `Validar 'props' e adicionar guardas condicionais no topo do componente ${affectedComponent}.`,
      },
    ],
    codeSnippetHint: `if (!data) {\n  return <LoadingBoundary />;\n}`,
    severity: 'WARNING',
  };
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRestoring: false,
      showTechStack: false,
      copiedToClipboard: false,
      isExecutingRepair: false,
      repairStatusMessage: null,
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

    // Auto-recuperação imediata para erros de schema / rolePreferences residuais
    if (
      error?.message?.includes('ADMIN') ||
      error?.message?.includes('rolePreferences') ||
      error?.message?.includes('undefined (reading')
    ) {
      try {
        sanitizeLegacyLocalStorage();
      } catch {}
    }
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

  private async handleExecuteDatabaseAutomatorFix(actionType: RepairActionType) {
    this.setState({
      isExecutingRepair: true,
      repairStatusMessage: 'Executando reparo automático via DatabaseAutomatorService...',
    });

    try {
      let resultMessage = '';
      if (actionType === 'REPAIR_ROLE_PREFERENCES') {
        const res = DatabaseAutomatorService.repairRolePreferences();
        resultMessage = res.message;
      } else if (actionType === 'REPAIR_UNDEFINED_PROPERTIES') {
        const res = DatabaseAutomatorService.repairUndefinedPropertiesAndSchema();
        resultMessage = res.message;
      } else if (actionType === 'REPAIR_LOCALSTORAGE') {
        const res = DatabaseAutomatorService.repairLocalStorageCorruption();
        resultMessage = res.message;
      } else if (actionType === 'RUN_RELATIONAL_AUTOHEAL') {
        const res = DatabaseAutomatorService.runRelationalAutoHeal();
        resultMessage = res.message;
      } else if (actionType === 'RUN_FULL_MIGRATION') {
        const res = await DatabaseAutomatorService.runFullDatabaseMigration();
        resultMessage = res.success
          ? `Migração v${res.schemaVersion} concluída em ${res.totalDurationMs}ms (${res.fixesApplied.length} correções)!`
          : `Migração concluída com avisos: ${res.errorMessage || 'Verifique os logs.'}`;
      }

      this.setState({
        repairStatusMessage: `✅ ${resultMessage}`,
        isExecutingRepair: false,
      });

      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          repairStatusMessage: null,
        });
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      this.setState({
        repairStatusMessage: `❌ Falha ao executar reparo automático: ${err.message}`,
        isExecutingRepair: false,
      });
    }
  }

  private handleCopyDiagnosisAndFix = (diagnosis: DetailedErrorDiagnosis) => {
    const reportText = `=== RELATÓRIO DE DIAGNÓSTICO E CORREÇÃO - SUCESSOEDU ===
[Categoria]: ${diagnosis.category}
[Componente Afetado]: ${diagnosis.affectedComponent}
[Severidade]: ${diagnosis.severity}
[Erro Lançado]: ${this.state.error?.name}: ${this.state.error?.message}

--- DIAGNÓSTICO DO ERRO ---
${diagnosis.diagnosisText}

--- CORREÇÃO QUE DEVE SER IMPLEMENTADA PARA RESOLVER A FALHA ---
${diagnosis.recommendedFixes.map((step, idx) => `${idx + 1}. ${step.text} ${step.actionLabel ? `[Ação Script: ${step.actionLabel}]` : ''}`).join('\n')}

${diagnosis.codeSnippetHint ? `\n--- SUGESTÃO DE CÓDIGO (HINT) ---\n${diagnosis.codeSnippetHint}\n` : ''}
--- STACK TRACE ---
${this.state.error?.stack || 'N/A'}
${this.state.errorInfo?.componentStack || ''}`;

    navigator.clipboard.writeText(reportText).then(() => {
      this.setState({ copiedToClipboard: true });
      setTimeout(() => {
        this.setState({ copiedToClipboard: false });
      }, 3000);
    });
  };

  public render() {
    if (this.state.hasError) {
      // Auto-higieniza se for erro de ADMIN / rolePreferences no localStorage do usuário
      if (
        this.state.error?.message?.includes('ADMIN') ||
        this.state.error?.message?.includes('rolePreferences') ||
        this.state.error?.message?.includes('undefined (reading')
      ) {
        try {
          sanitizeLegacyLocalStorage();
        } catch {}
      }

      const diagnosis = analyzeErrorAndBuildFixPlan(this.state.error, this.state.errorInfo);

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
            
            {/* Cabecalho do Modulo */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/5">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                      Recuperação Automática do Sistema
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      Diagnóstico & Reparo Ativo
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    O SucessoEdu isolou a exceção e mapeou as sugestões de reparo executáveis em 1 clique via <strong>DatabaseAutomatorService</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => this.handleCopyDiagnosisAndFix(diagnosis)}
                title="Copiar Diagnóstico e Plano de Correção para Área de Transferência"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shrink-0"
              >
                {this.state.copiedToClipboard ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Relatório</span>
                  </>
                )}
              </button>
            </div>

            {/* FEEDBACK BANNER DE EXECUÇÃO DE REPARO */}
            {this.state.repairStatusMessage && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-pulse ${
                this.state.repairStatusMessage.startsWith('✅')
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : this.state.repairStatusMessage.startsWith('❌')
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
              }`}>
                {this.state.isExecutingRepair ? (
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                ) : this.state.repairStatusMessage.startsWith('✅') ? (
                  <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{this.state.repairStatusMessage}</span>
              </div>
            )}

            {/* SEÇÃO 1: DIAGNÓSTICO DO ERRO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>1. Diagnóstico do Erro Detectado</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  Módulo: <strong className="text-indigo-400">{diagnosis.affectedComponent}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                  {diagnosis.category}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-rose-300 break-all leading-relaxed">
                  <span className="text-slate-500 font-bold select-none">[Exceção]: </span>
                  {this.state.error?.name}: {this.state.error?.message || 'Erro de execução'}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  <strong className="text-slate-200">Causa Raiz:</strong> {diagnosis.diagnosisText}
                </p>
              </div>
            </div>

            {/* SEÇÃO 2: CORREÇÃO COM LINKS/AÇÕES EXECUTÁVEIS DO DATABASEAUTOMATORSERVICE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span>2. Correções & Scripts de Automação Recomendados</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Execução via DatabaseAutomatorService
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-medium">
                  Clique no link/botão de ação de cada sugestão para executar o script de reparo correspondente:
                </p>

                <div className="space-y-2.5">
                  {diagnosis.recommendedFixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-300">Passo {idx + 1}: </strong>
                          <span>{fix.text}</span>
                        </div>
                      </div>

                      {fix.actionType && fix.actionLabel && (
                        <button
                          onClick={() => this.handleExecuteDatabaseAutomatorFix(fix.actionType!)}
                          disabled={this.state.isExecutingRepair}
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40 hover:scale-[1.02] disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{fix.actionLabel}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {diagnosis.codeSnippetHint && (
                  <div className="mt-3 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Exemplo de Código / Ajuste Sugerido:</span>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {diagnosis.codeSnippetHint}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO 3: AÇÕES DE RECUPERAÇÃO RÁPIDA (1 CLIQUE) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  3. Ações de Auto-Cura e Reset de Segurança:
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={this.handleSanitizeAndReload}
                  disabled={this.state.isRestoring || this.state.isExecutingRepair}
                  className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-3 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 shrink-0 ${this.state.isRestoring ? 'animate-spin' : ''}`} />
                  <div className="text-left">
                    <div>Saneamento & Recarregamento</div>
                    <div className="text-[10px] font-normal opacity-80">Higieniza esquemas e preserva dados</div>
                  </div>
                </button>

                <button
                  onClick={this.handleRestoreDemo}
                  disabled={this.state.isRestoring || this.state.isExecutingRepair}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <div>Restaurar Base Demonstrativa</div>
                    <div className="text-[10px] font-normal opacity-80">Carrega escola com dados de teste</div>
                  </div>
                </button>

                <button
                  onClick={this.handleRestoreClean}
                  disabled={this.state.isRestoring || this.state.isExecutingRepair}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                  <div className="text-left">
                    <div>Restaurar Base Limpa (Produção)</div>
                    <div className="text-[10px] font-normal opacity-80">Estruturas zeradas sem dados de teste</div>
                  </div>
                </button>

                <button
                  onClick={this.handleReload}
                  disabled={this.state.isRestoring || this.state.isExecutingRepair}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Home className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <div>Recarregar Página</div>
                    <div className="text-[10px] font-normal opacity-80">Reinicializa o estado atual</div>
                  </div>
                </button>
              </div>
            </div>

            {/* SEÇÃO 4: DETALHES TÉCNICOS EXPANSÍVEIS (STACK TRACE) */}
            <div className="pt-1">
              <button
                onClick={() => this.setState({ showTechStack: !this.state.showTechStack })}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-500" />
                  <span>Detalhes Técnicos Avançados (Stack Trace)</span>
                </div>
                {this.state.showTechStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {this.state.showTechStack && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48">
                  <div>
                    <strong className="text-slate-300">Stack Trace do Erro:</strong>
                    <p className="text-rose-400/90 whitespace-pre-wrap mt-1">{this.state.error?.stack || 'N/A'}</p>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div className="pt-2 border-t border-slate-900">
                      <strong className="text-slate-300">Árvore de Componentes (Component Stack):</strong>
                      <p className="text-slate-400 whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
