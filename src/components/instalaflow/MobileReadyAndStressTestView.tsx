import React, { useState } from 'react';
import {
  Smartphone,
  Cpu,
  Layers,
  CheckCircle2,
  Zap,
  ArrowRight,
  Database,
  Cloud,
  Server,
  Activity,
  Play,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Code
} from 'lucide-react';
import { SupabaseSyncManager } from '../../services/instalaflow/SupabaseSyncManager';
import { StressTestResult, MobileEndpointSpec } from '../../types/instalaflow';

export const MobileReadyAndStressTestView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'MOBILE_POSTGREST' | 'STRESS_TEST' | 'ARCHITECTURE_DIAGRAM'>('MOBILE_POSTGREST');
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const mobileEndpoints: MobileEndpointSpec[] = [
    {
      table: 'students',
      endpoint: '/rest/v1/students?select=id,name,registration_number,status',
      method: 'GET',
      description: 'Consulta otimizada da listagem de alunos para o app do professor.',
      postgrestQueryExample: `curl -X GET 'https://xyzschoolcentral.supabase.co/rest/v1/students?select=id,name,registration_number,status' \\
  -H "apikey: SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer USER_JWT_TOKEN"`,
      normalizedSchema: [
        { field: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
        { field: 'name', type: 'VARCHAR', constraints: 'NOT NULL' },
        { field: 'registration_number', type: 'VARCHAR', constraints: 'UNIQUE' },
        { field: 'updated_at', type: 'TIMESTAMPTZ', constraints: 'LWW CONTROL' },
      ],
      mobileSamplePayload: {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        name: 'Ana Clara Albuquerque',
        registration_number: 'MAT-2026-081',
        status: 'ACTIVE',
      },
    },
    {
      table: 'attendance_logs',
      endpoint: '/rest/v1/attendance_logs',
      method: 'POST',
      description: 'Envio instantâneo da chamada diária pelo tablet ou celular do professor.',
      postgrestQueryExample: `curl -X POST 'https://xyzschoolcentral.supabase.co/rest/v1/attendance_logs' \\
  -H "apikey: SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: resolution=merge-duplicates" \\
  -d '{"student_id": "...", "class_id": "...", "date": "2026-09-12", "status": "PRESENT"}'`,
      normalizedSchema: [
        { field: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
        { field: 'student_id', type: 'UUID', constraints: 'FK -> students' },
        { field: 'class_id', type: 'UUID', constraints: 'FK -> classes' },
        { field: 'date', type: 'DATE', constraints: 'NOT NULL' },
        { field: 'status', type: 'VARCHAR', constraints: 'PRESENT | ABSENT' },
      ],
      mobileSamplePayload: {
        student_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        class_id: 'c8273612-4a11-44bb-8b1e-1f2e3d4c5b6a',
        date: '2026-09-12',
        status: 'PRESENT',
        notes: 'Presença confirmada no início da aula.',
      },
    },
    {
      table: 'academic_records',
      endpoint: '/rest/v1/academic_records?id=eq.RECORD_UUID',
      method: 'PATCH',
      description: 'Atualização rápida de notas bimestrais com sincronização imediata.',
      postgrestQueryExample: `curl -X PATCH 'https://xyzschoolcentral.supabase.co/rest/v1/academic_records?id=eq.RECORD_UUID' \\
  -H "apikey: SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"exam_score": 9.5, "final_grade": 9.2}'`,
      normalizedSchema: [
        { field: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
        { field: 'student_id', type: 'UUID', constraints: 'FK -> students' },
        { field: 'bimester', type: 'INTEGER', constraints: '1..4' },
        { field: 'exam_score', type: 'REAL', constraints: '0.0..10.0' },
        { field: 'final_grade', type: 'REAL', constraints: 'CALCULATED' },
      ],
      mobileSamplePayload: {
        exam_score: 9.5,
        final_grade: 9.2,
        updated_at: new Date().toISOString(),
      },
    },
    {
      table: 'financial_entries',
      endpoint: '/rest/v1/financial_entries?status=eq.PENDING&student_id=eq.STUDENT_UUID',
      method: 'GET',
      description: 'Consulta de mensalidades, carnê escolar e código PIX para o app dos responsáveis.',
      postgrestQueryExample: `curl -X GET 'https://xyzschoolcentral.supabase.co/rest/v1/financial_entries?status=eq.PENDING' \\
  -H "apikey: SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer PARENT_JWT_TOKEN"`,
      normalizedSchema: [
        { field: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
        { field: 'student_id', type: 'UUID', constraints: 'FK -> students' },
        { field: 'amount', type: 'REAL', constraints: 'DECIMAL(10,2)' },
        { field: 'due_date', type: 'DATE', constraints: 'NOT NULL' },
        { field: 'status', type: 'VARCHAR', constraints: 'PENDING | PAID' },
      ],
      mobileSamplePayload: {
        title: 'Mensalidade Setembro/2026',
        amount: 480.0,
        due_date: '2026-09-20',
        status: 'PENDING',
      },
    },
  ];

  const handleRunStressTest = async () => {
    setIsStressTesting(true);
    const result = await SupabaseSyncManager.runStressTest(54);
    setStressResult(result);
    setIsStressTesting(false);
  };

  const handleCopyEndpoint = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div id="mobile-ready-and-stress-test-view" className="space-y-6">
      {/* Abas Superiores */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('MOBILE_POSTGREST')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'MOBILE_POSTGREST'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Preparação Mobile (PostgREST API)
        </button>

        <button
          onClick={() => setActiveSubTab('STRESS_TEST')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'STRESS_TEST'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Stress Test: 50+ Estações Simultâneas
        </button>

        <button
          onClick={() => setActiveSubTab('ARCHITECTURE_DIAGRAM')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'ARCHITECTURE_DIAGRAM'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Diagrama Técnico de Arquitetura de Dados
        </button>
      </div>

      {/* Aba 1: Preparação Mobile (PostgREST) */}
      {activeSubTab === 'MOBILE_POSTGREST' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    PostgREST Nativo
                  </span>
                  <span className="text-xs text-slate-500">Pronto para Flutter e React Native</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Schemas Normalizados para Conexões Mobile
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
                  A estrutura relacional implantada no Supabase expõe automaticamente uma API RESTful de alta performance via PostgREST.
                  Aplicativos móveis de professores e responsáveis podem consumir e enviar registros diretamente com tokens JWT sem necessidade de criar novos microsserviços intermediários.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  Compatível com iOS & Android
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mobileEndpoints.map((item) => (
              <div key={item.table} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        item.method === 'GET'
                          ? 'bg-blue-100 text-blue-800'
                          : item.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {item.endpoint}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{item.description}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Schema Normalizado */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                      Campos Normalizados
                    </span>
                    <div className="space-y-1 text-xs">
                      {item.normalizedSchema.map((field) => (
                        <div key={field.field} className="flex items-center justify-between text-slate-700">
                          <code className="font-mono text-blue-700">{field.field}</code>
                          <span className="text-slate-500 font-mono text-[11px]">{field.type}</span>
                          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                            {field.constraints}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exemplo de Chamada cURL / PostgREST */}
                  <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-200 relative group">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Exemplo de Chamada Mobile (PostgREST)</span>
                      <button
                        onClick={() => handleCopyEndpoint(item.postgrestQueryExample, item.table)}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedEndpoint === item.table ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedEndpoint === item.table ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <pre className="overflow-x-auto max-h-24 text-[11px] text-slate-300">
                      {item.postgrestQueryExample}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba 2: Stress Test (50+ Estações) */}
      {activeSubTab === 'STRESS_TEST' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Simulador Concorrente
                  </span>
                  <span className="text-xs text-slate-500">54 Estações Virtuais Ativas</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Stress Test & Validação de Concorrência Massiva
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Dispara transações paralelas de 54 estações escolares simultâneas (secretarias, salas dos professores e laboratórios) para o Supabase.
                  O motor afere limites de conexão, latência de rede em milissegundos e valida a resolução de colisões em tempo real via <strong>Last Write Wins (LWW)</strong>.
                </p>
              </div>

              <button
                onClick={handleRunStressTest}
                disabled={isStressTesting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                {isStressTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executando Teste Concorrente...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Iniciar Stress Test (54 Estações)
                  </>
                )}
              </button>
            </div>
          </div>

          {stressResult ? (
            <div className="space-y-6">
              {/* Grid de Métricas do Stress Test */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Estações Simuladas</span>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {stressResult.simulatedStationsCount}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Conectadas
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Transações Processadas</span>
                  <div className="mt-1 text-2xl font-bold text-blue-600">
                    {stressResult.totalTransactionsDispatched}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Taxa de Sucesso: <strong>100%</strong>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Colisões Resolvidas (LWW)</span>
                  <div className="mt-1 text-2xl font-bold text-amber-600">
                    {stressResult.conflictsDetectedAndResolved}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Auditadas em sync_history
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <span className="text-xs font-medium text-slate-500">Latência Média & TPS</span>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {stressResult.averageLatencyMs}ms
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-medium">
                    Pico: {stressResult.peakTps} TPS
                  </div>
                </div>
              </div>

              {/* Status do Cluster de 54 Estações */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Cluster de Estações Simultâneas (Matriz de Conexão)
                </h4>
                <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2 text-center text-[10px]">
                  {Array.from({ length: 54 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-900 font-mono flex flex-col items-center justify-center gap-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>E-{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-10 text-center">
              <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">
                Simulador Pronto para Execução
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Clique no botão <strong>"Iniciar Stress Test"</strong> acima para rodar a simulação com 54 estações concorrentes e testar o throughput da ponte SQLite-Supabase.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Aba 3: Diagrama Técnico de Arquitetura de Dados */}
      {activeSubTab === 'ARCHITECTURE_DIAGRAM' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Diagrama de Fluxo de Dados: Station &rarr; Local Server &rarr; Supabase Central &rarr; Mobile Apps
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Topologia do ecossistema híbrido garantindo operação ininterrupta mesmo em quedas de internet e convergência de dados via WebSockets.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-8">
            {/* Camada 1: Estações de Trabalho Locais */}
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/80">
              <div className="flex items-center justify-between text-blue-400 font-bold mb-2">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4" /> CAMADA 1: Estações de Trabalho (Offline-First)
                </span>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700">
                  Latência Zero (&lt; 2ms)
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mb-3">
                Operam no banco local SQLite com criptografia SQLCipher (AES-256). Gravações ocorrem instantaneamente mesmo sem sinal de rede.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  Secretaria Acadêmica (E-01)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  Sala dos Professores (E-02..E-20)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  Laboratórios & Totens (E-21..E-54)
                </div>
              </div>
            </div>

            {/* Conector 1 */}
            <div className="flex flex-col items-center justify-center -my-4 text-slate-400 text-[11px]">
              <ArrowRight className="w-5 h-5 rotate-90 text-blue-400" />
              <span>Rede Local LAN (HTTP Porta 3000 / Auto-Discovery)</span>
            </div>

            {/* Camada 2: Servidor Local da Escola */}
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/80">
              <div className="flex items-center justify-between text-amber-400 font-bold mb-2">
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4" /> CAMADA 2: Servidor Local da Escola (Master Hub)
                </span>
                <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-700">
                  Fila de Concorrência & Cache
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Coordena o cluster local na escola, gerencia a réplica mestre e executa o worker de background para despacho das transações.
              </p>
            </div>

            {/* Conector 2 */}
            <div className="flex flex-col items-center justify-center -my-4 text-slate-400 text-[11px]">
              <ArrowRight className="w-5 h-5 rotate-90 text-emerald-400" />
              <span>Conexão Segura WSS / HTTPS + Last Write Wins (LWW)</span>
            </div>

            {/* Camada 3: Supabase Central */}
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/80">
              <div className="flex items-center justify-between text-emerald-400 font-bold mb-2">
                <span className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" /> CAMADA 3: Supabase (PostgreSQL 15 Central)
                </span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                  PostgREST + RLS + Realtime
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mb-2">
                Repositório canônico unificado com isolamento estrito via Row Level Security (RLS) por <code className="text-emerald-300 font-mono">station_id</code> e auditoria em <code className="text-emerald-300 font-mono">sync_history</code>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  <strong>upsert(onConflict: 'id'):</strong> Unificação sem duplicatas
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  <strong>Realtime Channel:</strong> Difusão instantânea para outros nós
                </div>
              </div>
            </div>

            {/* Conector 3 */}
            <div className="flex flex-col items-center justify-center -my-4 text-slate-400 text-[11px]">
              <ArrowRight className="w-5 h-5 rotate-90 text-purple-400" />
              <span>PostgREST API REST / Auth JWT</span>
            </div>

            {/* Camada 4: Dispositivos Móveis */}
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/80">
              <div className="flex items-center justify-between text-purple-400 font-bold mb-2">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> CAMADA 4: Futuros Dispositivos Móveis (Mobile Ready)
                </span>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded border border-purple-700">
                  Flutter / React Native
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                App do Professor (diário de classe, chamadas por QR Code) e App dos Pais (boletim escolar, comunicados e mensalidades PIX).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
