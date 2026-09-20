import React, { useState, useEffect } from 'react';
import {
  Key,
  Globe,
  Database,
  Server,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Lock,
  Cpu,
  Terminal,
} from 'lucide-react';
import {
  EnvironmentService,
  EnvironmentStatusResponse,
  EnvironmentVariableStatus,
  GeminiTestResult,
} from '../../services/environmentService';

interface EnvironmentVariablesViewProps {
  onBack?: () => void;
}

export const EnvironmentVariablesView: React.FC<EnvironmentVariablesViewProps> = ({ onBack }) => {
  const [data, setData] = useState<EnvironmentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Teste Gemini
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState<GeminiTestResult | null>(null);

  // Teste Síntese Pedagógica
  const [isTestingInsight, setIsTestingInsight] = useState(false);
  const [insightResult, setInsightResult] = useState<{
    source: string;
    text?: string;
    recommendations?: string[];
  } | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await EnvironmentService.getEnvironmentStatus();
      setData(res);
    } catch {
      // Handled in service fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await EnvironmentService.testGeminiConnection();
      setGeminiResult(res);
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestPedagogicalInsight = async () => {
    setIsTestingInsight(true);
    setInsightResult(null);
    try {
      const res = await EnvironmentService.requestPedagogicalInsights({
        examTitle: 'Simulado Diagnóstico 2026 - Matemática',
        subject: 'Matemática e Geometria Espacial',
        className: '3º Ano E.M. - Turma A',
        averageScore: 6.4,
        commonErrors: [
          { topic: 'Cálculo de Proporção e Razão Áurea', errorRate: 42 },
          { topic: 'Geometria Espacial: Volume de Prismas', errorRate: 38 },
        ],
        topicMastery: {
          'Álgebra Linear': 82,
          'Funções Polinomiais': 71,
          'Geometria Espacial': 49,
        },
      });
      setInsightResult(res);
    } finally {
      setIsTestingInsight(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('AI')) return <Sparkles className="w-4 h-4 text-purple-400" />;
    if (category.includes('Rede')) return <Globe className="w-4 h-4 text-blue-400" />;
    if (category.includes('Banco')) return <Database className="w-4 h-4 text-emerald-400" />;
    return <Server className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Key className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Auditoria de Variáveis de Ambiente & Secrets
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-medium">
                    {data?.configuredVariables || 0}/{data?.totalVariables || 6} Ativas
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verificação em tempo real das variáveis declaradas em <code className="text-indigo-300 font-mono">.env.example</code> e injetadas no Cloud Run / Servidor.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadStatus}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Recarregar status das variáveis de ambiente"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{isLoading ? 'Checando...' : 'Atualizar Status'}</span>
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono transition-all cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Indicadores rápidos de Infraestrutura */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-mono block">Plataforma Ativa</span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              {data?.runtimePlatform || 'Cloud Run (AI Studio)'}
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-mono block">Porta Canônica</span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              PORT=3000 (Nginx Proxy)
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-mono block">Google Gemini AI</span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              gemini-3.8-flash (Server)
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-mono block">Banco & RLS</span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Supabase PostgREST v12
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Ações Rápidas de Teste das Variáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Teste: GEMINI_API_KEY */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Teste do GEMINI_API_KEY</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Endpoint: /api/ai/test-connection</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Server-Side Secret
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dispara uma verificação direta no servidor via SDK <code className="font-mono text-purple-600">@google/genai</code> utilizando o modelo <code className="font-mono text-purple-600">gemini-3.8-flash</code> para certificar que a chave de API está funcional.
            </p>

            {geminiResult && (
              <div className={`p-3 rounded-xl border text-xs font-mono ${
                geminiResult.working
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {geminiResult.working ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  <span>{geminiResult.working ? 'Gemini AI Conectado com Sucesso!' : 'Falha na Conexão com Gemini'}</span>
                </div>
                <div className="mt-1 text-[11px] space-y-0.5">
                  {geminiResult.model && <div>Modelo: <strong>{geminiResult.model}</strong></div>}
                  {geminiResult.response && <div>Resposta: <strong>{geminiResult.response}</strong></div>}
                  {geminiResult.error && <div>Erro: {geminiResult.error}</div>}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Chave protegida no backend</span>
            <button
              onClick={handleTestGemini}
              disabled={isTestingGemini}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
              <span>{isTestingGemini ? 'Testando API...' : 'Testar Conexão Gemini'}</span>
            </button>
          </div>
        </div>

        {/* Card de Teste: Síntese Pedagógica com IA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Terminal className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Diagnóstico Psicopedaçógico IA</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Endpoint: /api/ai/pedagogical-insights</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Executa a análise preditiva e gera recomendações de intervenção pedagógica baseadas nas habilidades da BNCC utilizando a chave de ambiente configurada.
            </p>

            {insightResult && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs space-y-1.5 max-h-32 overflow-y-auto">
                <div className="font-bold flex items-center justify-between text-[11px] text-indigo-700">
                  <span>Fonte: {insightResult.source}</span>
                  <span className="text-emerald-600 font-bold">200 OK</span>
                </div>
                {insightResult.text ? (
                  <p className="whitespace-pre-line text-[11px] text-slate-700 leading-relaxed">
                    {insightResult.text.substring(0, 240)}...
                  </p>
                ) : (
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-700">
                    {insightResult.recommendations?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Recuperação da Aprendizagem</span>
            <button
              onClick={handleTestPedagogicalInsight}
              disabled={isTestingInsight}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Cpu className={`w-3.5 h-3.5 ${isTestingInsight ? 'animate-spin' : ''}`} />
              <span>{isTestingInsight ? 'Sintetizando...' : 'Gerar Diagnóstico IA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Variáveis Auditadas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Variáveis de Ambiente Mapeadas</h3>
            <p className="text-xs text-slate-500">
              Configurações canônicas ativas no runtime do ecossistema SucessoEdu
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {data?.variables?.length || 0} Variáveis Registradas
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.variables?.map((v: EnvironmentVariableStatus) => {
            const displayValue = v.maskedValue || v.value || 'Não definido';
            return (
              <div key={v.key} className="p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {v.key}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {getCategoryIcon(v.category)}
                        {v.category}
                      </span>
                      {v.isSecret && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Lock className="w-3 h-3" />
                          Segredo Sensível (Backend Only)
                        </span>
                      )}
                      {v.status === 'CONFIGURED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativa & Configurada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Fallback Local
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{v.description}</p>
                    <p className="text-[11px] text-slate-400 italic">Finalidade: {v.usage}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 max-w-xs truncate select-all">
                      {displayValue}
                    </div>
                    {displayValue && !displayValue.includes('****') && (
                      <button
                        onClick={() => handleCopy(displayValue, v.key)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title={`Copiar valor de ${v.key}`}
                      >
                        {copiedKey === v.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    {v.key === 'APP_URL' && v.value && v.value.startsWith('http') && (
                      <a
                        href={v.value}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                        title="Abrir URL Oficial em Nova Aba"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
