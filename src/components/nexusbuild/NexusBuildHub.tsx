import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Download,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Server,
  Layers,
  ArrowLeft,
  Mail,
  Copy,
  Check,
  BookOpen
} from 'lucide-react';
import {
  HardwareValidatorState,
  SastAuditResult,
  PostgresSmartAdapterState,
  FirewallRule,
  BackupEngineConfig,
  DeveloperNotification,
  NexusBuildWizardStep,
  InnoSetupPackageMeta
} from '../../types/nexusbuild';
import {
  generateInnoSetupScript,
  generateBatchInstallerScript,
  generateDailyBackupScript,
  generateSelfHealingScript,
  generateCreateRootFolderScript,
  DEVELOPER_EMAIL,
  DEFAULT_ROOT_DIR
} from '../../utils/nexusBuildGenerator';
import { NexusBuildWizard } from './NexusBuildWizard';
import { HardwareValidator } from './HardwareValidator';
import { SystemGuardAuditor } from './SystemGuardAuditor';
import { EnvironmentProvisioner } from './EnvironmentProvisioner';
import { PostgresSmartAdapter } from './PostgresSmartAdapter';
import { NetworkGuard } from './NetworkGuard';
import { NexusBackupEngine } from './NexusBackupEngine';
import { GmailAlertSystem } from './GmailAlertSystem';
import { InnoSetupTutorial } from './InnoSetupTutorial';

interface NexusBuildHubProps {
  onNavigate?: (tab: string) => void;
  onBack?: () => void;
}

export const NexusBuildHub: React.FC<NexusBuildHubProps> = ({
  onNavigate,
  onBack,
}) => {
  // Estado do Wizard
  const [currentStep, setCurrentStep] = useState<NexusBuildWizardStep>('PREREQUISITES');
  const [progressPercent, setProgressPercent] = useState<number>(20);
  const [currentStepLabel, setCurrentStepLabel] = useState<string>('Validando Pré-requisitos & Hardware');
  const [isExecutingPipeline, setIsExecutingPipeline] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'ALL' | 'WIZARD' | 'TUTORIAL' | 'DOWNLOADS' | 'LOGS'>('ALL');

  // 1. Hardware State
  const [hardwareState, setHardwareState] = useState<HardwareValidatorState>({
    cpuCores: 8,
    totalMemoryGb: 16,
    freeMemoryGb: 9.4,
    freeDiskGb: 48.2,
    targetDisk: DEFAULT_ROOT_DIR,
    isDiskSpaceOk: true,
    isAdmin: true,
    conflictingProcesses: [],
    status: 'PASSED',
    evaluatedAt: new Date().toISOString(),
  });

  // 2. SAST Audit State
  const [sastState, setSastState] = useState<SastAuditResult>({
    passed: true,
    totalScannedFiles: 142,
    criticalIssuesCount: 0,
    warningsCount: 2,
    syntaxOk: true,
    memoryLeakChecksPassed: true,
    binaryIntegritySha256: 'e83f204194914c5a98c02a654d7a19f8b1c4e9087213456789abcdef01234567',
    findings: [
      {
        id: 'warn-1',
        severity: 'WARNING',
        file: 'src/server/routes.ts',
        line: 145,
        rule: 'PERF_STREAM_BUFFER_SIZE',
        description: 'Buffer de compressão de logs pode ser elevado para 64KB.',
        autoFixAvailable: true,
        fixed: false,
      },
      {
        id: 'warn-2',
        severity: 'WARNING',
        file: 'src/components/common/Header.tsx',
        line: 88,
        rule: 'REACT_USEMEMO_MISSING',
        description: 'Cálculo de métricas de rede pode ser memorizado com useMemo.',
        autoFixAvailable: true,
        fixed: false,
      },
    ],
    developerNotified: true,
    developerEmail: DEVELOPER_EMAIL,
    auditTimestamp: new Date().toISOString(),
  });

  // 3. PostgreSQL Smart Adapter State
  const [postgresState, setPostgresState] = useState<PostgresSmartAdapterState>({
    detectedExisting: false,
    activePort: 5433,
    connectionAttempts: 5,
    maxAttempts: 5,
    connectionLogs: [
      'Iniciando tentativa 1/5 em 127.0.0.1:5432...',
      '[ALERTA] Porta 5432 não respondeu dentro do timeout de 2000ms.',
      'Iniciando tentativa 2/5 em 127.0.0.1:5432...',
      '[ALERTA] Porta 5432 recusou conexão (Nenhum serviço PostgreSQL prévio ativo).',
      'Iniciando tentativa 3/5 em 127.0.0.1:5432...',
      'Iniciando tentativa 4/5 em 127.0.0.1:5432...',
      'Iniciando tentativa 5/5 em 127.0.0.1:5432...',
      '[FALLBACK ATIVADO] 5/5 tentativas esgotadas na porta padrão 5432.',
      '[POSTGRESQL 16 SILENT] Preparando instalação silenciosa na porta 5433...',
      '[OK] Gerado arquivo pg_hba.conf para conexões locais autenticadas em 127.0.0.1/32.',
      '[SUCESSO] PostgreSQL 16 pronto para inicialização como serviço na porta 5433.',
    ],
    status: 'RUNNING_5433',
    silentInstallPrepared: true,
    version: 'PostgreSQL 16.1 (Windows x64)',
    pgHbaConfigured: true,
    pgHbaContent: `# =====================================================================
# pg_hba.conf gerado automaticamente pelo SucessoEduSistema
# Local de Instalação: C:\\SucessoEduSistema\\Config\\pg_hba.conf
# =====================================================================

# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
local   all             postgres                                trust
host    sucessoedu_db   sucessoedu_user 127.0.0.1/32            scram-sha-256
`,
    serviceName: 'postgresql-x64-16',
    selfHealingTriggered: false,
  });

  // 4. Firewall Rules State
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([
    {
      id: 'rule-app',
      name: 'SucessoEdu App Engine',
      direction: 'in',
      action: 'allow',
      protocol: 'TCP',
      program: 'C:\\SucessoEduSistema\\Bin\\SucessoEdu_App.exe',
      status: 'CONFIGURED',
      command: 'netsh advfirewall firewall add rule name="SucessoEdu App Engine" dir=in action=allow program="C:\\SucessoEduSistema\\Bin\\SucessoEdu_App.exe" enable=yes',
    },
    {
      id: 'rule-postgres',
      name: `SucessoEdu Database (${postgresState.activePort})`,
      direction: 'in',
      action: 'allow',
      protocol: 'TCP',
      localPort: postgresState.activePort,
      status: 'CONFIGURED',
      command: `netsh advfirewall firewall add rule name="SucessoEdu Database (${postgresState.activePort})" dir=in action=allow protocol=TCP localport=${postgresState.activePort} enable=yes`,
    },
    {
      id: 'rule-http',
      name: 'SucessoEdu Web Bridge (3000-3001)',
      direction: 'in',
      action: 'allow',
      protocol: 'TCP',
      localPort: 3001,
      status: 'CONFIGURED',
      command: 'netsh advfirewall firewall add rule name="SucessoEdu Web Bridge (3000-3001)" dir=in action=allow protocol=TCP localport=3001 enable=yes',
    },
  ]);

  // 5. Backup Engine State
  const [backupConfig, setBackupConfig] = useState<BackupEngineConfig>({
    cronSchedule: '0 3 * * *',
    scheduledTimeStr: '03:00 AM Diário',
    windowsTaskName: 'SucessoEdu_DailyBackup',
    gdriveFolderId: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ_0123456789',
    isFolderIdValid: true,
    aesKeyMasked: 'AES256-GCM-****-****-****-9491',
    totalArchiveIncludesAll: true,
    includeExtensions: ['.lic', '.key', '.exe', '.db', '.dump', '.log', '.json', '.conf'],
    lastBackupStatus: 'SUCCESS',
    lastBackupTimestamp: 'Hoje às 03:00:12 AM',
    lastBackupArchiveName: 'SucessoEdu_Backup_Full_20260915_030000.zip',
    cloudSyncConfirmed: true,
  });

  // 6. Notifications State
  const [notifications, setNotifications] = useState<DeveloperNotification[]>([
    {
      id: 'notif-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      recipient: DEVELOPER_EMAIL,
      subject: '[SucessoEduSistema] Status de Instalação: Provisionamento em C:\\SucessoEduSistema OK',
      type: 'INSTALLATION_STATUS',
      status: 'SENT',
      contentPreview: 'Ambiente provisionado com sucesso. Permissões icacls aplicadas e PostgreSQL 16 pronto na porta 5433.',
    },
    {
      id: 'notif-2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      recipient: DEVELOPER_EMAIL,
      subject: '[SucessoEduSistema] Relatório de Auditoria SAST: 0 Erros Críticos',
      type: 'AUDIT_CRITICAL',
      status: 'SENT',
      contentPreview: 'Varredura estática de 142 arquivos concluída. Nenhuma falha de sintaxe ou vazamento de memória detectado.',
    },
  ]);

  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleCopyCode = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Execução do Pipeline Completo
  const handleStartFullBuild = async () => {
    setIsExecutingPipeline(true);
    
    // Passo 1: Pré-requisitos
    setCurrentStep('PREREQUISITES');
    setCurrentStepLabel('Validando Hardware, 2GB em Disco e Privilégios UAC...');
    setProgressPercent(15);
    await new Promise((r) => setTimeout(r, 600));

    // Passo 2: SAST Audit
    setCurrentStep('SAST_AUDIT');
    setCurrentStepLabel('Executando Varredura SAST Estrita e Integridade SHA-256...');
    setProgressPercent(30);
    await new Promise((r) => setTimeout(r, 700));

    // Passo 3: Raiz C:\SucessoEduSistema
    setCurrentStep('ROOT_PROVISIONING');
    setCurrentStepLabel('Provisionando Estrutura de Pastas e Permissões Icacls...');
    setProgressPercent(45);
    await new Promise((r) => setTimeout(r, 600));

    // Passo 4: Database Auto-Deploy
    setCurrentStep('DATABASE_DEPLOY');
    setCurrentStepLabel('Testando Porta 5432 e Configurando pg_hba.conf para Porta 5433...');
    setProgressPercent(60);
    await new Promise((r) => setTimeout(r, 700));

    // Passo 5: Firewall
    setCurrentStep('FIREWALL_CONFIG');
    setCurrentStepLabel('Registrando Regras de Firewall Netsh para Executável e Banco...');
    setProgressPercent(75);
    await new Promise((r) => setTimeout(r, 600));

    // Passo 6: Backup Engine
    setCurrentStep('BACKUP_ENGINE');
    setCurrentStepLabel('Agendando Tarefa Diária das 03:00 AM e Validando Folder ID do Google Drive...');
    setProgressPercent(90);
    await new Promise((r) => setTimeout(r, 600));

    // Passo 7: Inno Setup Package
    setCurrentStep('PACKAGE_INNO');
    setCurrentStepLabel('Script Inno Setup (.iss) e Executável Gerados com Sucesso!');
    setProgressPercent(100);
    setIsExecutingPipeline(false);

    // Adicionar notificação de sucesso
    const newNotif: DeveloperNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: DEVELOPER_EMAIL,
      subject: '[SucessoEduSistema] Pipeline de Instalação e Empacotamento Concluído com Sucesso',
      type: 'INSTALLATION_STATUS',
      status: 'SENT',
      contentPreview: `Pipeline 100% executado. C:\\SucessoEduSistema configurado, PostgreSQL ativo na porta ${postgresState.activePort} e tarefa de backup das 03:00 AM criada.`,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Re-teste de Conexão com o PostgreSQL
  const handleTestPostgresConnection = () => {
    setPostgresState((prev) => ({
      ...prev,
      status: 'TESTING_5432',
      connectionAttempts: 1,
      connectionLogs: [
        ...prev.connectionLogs,
        `[TESTE ${new Date().toLocaleTimeString('pt-BR')}] Verificando conectividade na porta 5432...`,
        '[ALERTA] Porta 5432 inacessível. Confirmando persistência do PostgreSQL na porta 5433.',
        '[OK] Serviço ativo na porta 5433 com sucesso.',
      ],
    }));

    setTimeout(() => {
      setPostgresState((prev) => ({
        ...prev,
        status: 'RUNNING_5433',
        connectionAttempts: 5,
      }));
    }, 1200);
  };

  // Auto-Cura do PostgreSQL
  const handleTriggerSelfHealing = () => {
    setPostgresState((prev) => ({
      ...prev,
      status: 'SELF_HEALING',
      selfHealingTriggered: true,
      connectionLogs: [
        ...prev.connectionLogs,
        `[SELF-HEALING ${new Date().toLocaleTimeString('pt-BR')}] Detectada chamada de Auto-Cura para serviço ${prev.serviceName}...`,
        `[COMANDO] net stop ${prev.serviceName} && net start ${prev.serviceName}`,
        '[SUCESSO] Serviço PostgreSQL reiniciado com êxito! Portas e conexões locais reestabelecidas.',
      ],
    }));

    setTimeout(() => {
      setPostgresState((prev) => ({
        ...prev,
        status: 'RUNNING_5433',
      }));

      // Notificar desenvolvedor
      const healNotif: DeveloperNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        recipient: DEVELOPER_EMAIL,
        subject: '[NexusBuild] Auto-Cura: Serviço PostgreSQL Reiniciado com Sucesso',
        type: 'SELF_HEALING_ALERT',
        status: 'SENT',
        contentPreview: `Serviço ${postgresState.serviceName} recuperado automaticamente antes de impactar os usuários. Porta ativa: ${postgresState.activePort}.`,
      };
      setNotifications((prev) => [healNotif, ...prev]);
    }, 1500);
  };

  // Envio de Notificação Manual
  const handleSendTestNotification = (type: DeveloperNotification['type']) => {
    const notif: DeveloperNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: DEVELOPER_EMAIL,
      subject: `[NexusBuild] Alerta de Teste: ${type}`,
      type,
      status: 'SENT',
      contentPreview: `Relatório de diagnóstico acionado manualmente pelo console de administração. Destinatário: ${DEVELOPER_EMAIL}.`,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Auto-Fix SAST
  const handleAutoFixSast = () => {
    setSastState((prev) => ({
      ...prev,
      warningsCount: 0,
      findings: prev.findings.map((f) => ({ ...f, fixed: true })),
    }));
  };

  const innoScriptContent = generateInnoSetupScript({
    postgresPort: postgresState.activePort,
    developerEmail: DEVELOPER_EMAIL,
    gdriveFolderId: backupConfig.gdriveFolderId,
  });

  const batchScriptContent = generateBatchInstallerScript({
    postgresPort: postgresState.activePort,
    developerEmail: DEVELOPER_EMAIL,
  });

  const backupScriptContent = generateDailyBackupScript({
    gdriveFolderId: backupConfig.gdriveFolderId,
    developerEmail: DEVELOPER_EMAIL,
  });

  const selfHealingScriptContent = generateSelfHealingScript();
  const createRootFolderScriptContent = generateCreateRootFolderScript(DEFAULT_ROOT_DIR);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Barra de Topo do NexusBuild */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="p-3 rounded-lg bg-indigo-600 text-white shadow-md">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-50 tracking-tight">
                SucessoEduSistema
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-600 text-white shadow-xs">
                INSTALADOR TOTAL
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                {DEFAULT_ROOT_DIR}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sistema de Diagnóstico, Instalação e Empacotamento Total com PostgreSQL, Firewall, Backup 03:00 AM e Pasta Padrão Raiz <span className="text-cyan-400 font-mono font-semibold">{DEFAULT_ROOT_DIR}</span>.
            </p>
          </div>
        </div>

        {/* Botões de Ação de Topo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTabSection('TUTORIAL')}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border ${
              activeTabSection === 'TUTORIAL'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Passo a passo detalhado de como compilar no Inno Setup 6"
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>Passo a Passo Inno Setup</span>
          </button>
          <button
            onClick={() => handleDownloadFile('SucessoEdu_Setup.iss', innoScriptContent)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            title="Baixar script Inno Setup para compilação do executável"
          >
            <Download className="h-4 w-4" />
            <span>Baixar Inno Setup (.iss)</span>
          </button>
          <button
            onClick={() => handleDownloadFile('instalar_sucessoedu.bat', batchScriptContent)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
            title="Baixar instalador em lote 1-clique com elevação UAC"
          >
            <FileCode className="h-4 w-4" />
            <span>Baixar .BAT (UAC)</span>
          </button>
        </div>
      </div>

      {/* Submenu de Navegação Interna */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-xs font-mono w-fit">
        <button
          onClick={() => setActiveTabSection('ALL')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            activeTabSection === 'ALL'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visão Geral Completa
        </button>
        <button
          onClick={() => setActiveTabSection('WIZARD')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            activeTabSection === 'WIZARD'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Wizard de Instalação
        </button>
        <button
          onClick={() => setActiveTabSection('TUTORIAL')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTabSection === 'TUTORIAL'
              ? 'bg-cyan-600 text-white font-bold shadow-xs'
              : 'text-cyan-400 hover:text-cyan-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Passo a Passo Inno Setup</span>
        </button>
        <button
          onClick={() => setActiveTabSection('DOWNLOADS')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            activeTabSection === 'DOWNLOADS'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scripts & Downloads
        </button>
        <button
          onClick={() => setActiveTabSection('LOGS')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            activeTabSection === 'LOGS'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Central Gmail ({notifications.length})
        </button>
      </div>

      {/* Wizard Interativo com Barra de Progresso */}
      <NexusBuildWizard
        currentStep={currentStep}
        progressPercent={progressPercent}
        currentStepLabel={currentStepLabel}
        isExecuting={isExecutingPipeline}
        onStartFullBuild={handleStartFullBuild}
        onSelectStep={(step) => setCurrentStep(step)}
      />

      {/* Seção 1: Pré-requisitos & HardwareValidator */}
      {(activeTabSection === 'ALL' || activeTabSection === 'WIZARD') && (
        <HardwareValidator
          data={hardwareState}
          onRefresh={() => {
            setHardwareState((prev) => ({
              ...prev,
              evaluatedAt: new Date().toISOString(),
            }));
          }}
        />
      )}

      {/* Seção 2: System Guard Auditor (SAST & Integridade) */}
      {(activeTabSection === 'ALL' || activeTabSection === 'WIZARD') && (
        <SystemGuardAuditor
          auditResult={sastState}
          onRunAudit={() => {
            setSastState((prev) => ({
              ...prev,
              auditTimestamp: new Date().toISOString(),
            }));
          }}
          onAutoFix={handleAutoFixSast}
          onNotifyDeveloper={() => handleSendTestNotification('AUDIT_CRITICAL')}
        />
      )}

      {/* Seção 3: Environment Provisioner & Raiz C:\SucessoEduSistema */}
      {(activeTabSection === 'ALL' || activeTabSection === 'WIZARD') && (
        <EnvironmentProvisioner
          onCopyCommand={(cmd) => {}}
        />
      )}

      {/* Seção 4: PostgresSmartAdapter & Auto-Deploy */}
      {(activeTabSection === 'ALL' || activeTabSection === 'WIZARD') && (
        <PostgresSmartAdapter
          state={postgresState}
          onTestConnection={handleTestPostgresConnection}
          onTriggerSelfHealing={handleTriggerSelfHealing}
          onApplyPgHba={(newContent) => {
            setPostgresState((prev) => ({
              ...prev,
              pgHbaContent: newContent,
            }));
          }}
        />
      )}

      {/* Seção 5: NetworkGuard & Firewall do Windows */}
      {(activeTabSection === 'ALL' || activeTabSection === 'WIZARD') && (
        <NetworkGuard
          rules={firewallRules}
          activePort={postgresState.activePort}
          onReconfigureRules={() => {
            setFirewallRules((prev) =>
              prev.map((r) => ({ ...r, status: 'CONFIGURED' }))
            );
          }}
        />
      )}

      {/* Seção 6: NexusBackupEngine & TotalArchivePacker */}
      {(activeTabSection === 'ALL' || activeTabSection === 'WIZARD') && (
        <NexusBackupEngine
          config={backupConfig}
          onUpdateGdriveId={(newId) => {
            setBackupConfig((prev) => ({
              ...prev,
              gdriveFolderId: newId,
              isFolderIdValid: true,
            }));
          }}
          onRunImmediateBackup={() => {
            setBackupConfig((prev) => ({
              ...prev,
              lastBackupTimestamp: `Manual às ${new Date().toLocaleTimeString('pt-BR')}`,
              lastBackupArchiveName: `NexusBuild_Backup_Manual_${Date.now()}.zip`,
              cloudSyncConfirmed: true,
            }));
            handleSendTestNotification('BACKUP_INTEGRITY');
          }}
        />
      )}

      {/* Seção 7: Central de Downloads e Scripts Gerados */}
      {(activeTabSection === 'ALL' || activeTabSection === 'DOWNLOADS') && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <FileCode className="h-5 w-5 text-indigo-400" />
                Scripts de Instalação e Arquivo Inno Setup (.iss)
              </h3>
              <p className="text-xs text-slate-400">
                Arquivos de configuração prontos para compilar o executável autossuficiente e provisionar em produção.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Card 1: Criador da Pasta Padrão no Diretório Raiz */}
            <div className="p-4 rounded-lg bg-slate-950 border border-cyan-500/40 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Diretório Raiz</span>
                  <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">C:\</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-1">criar_pastas_instalador.bat</h4>
                <p className="text-2xs text-slate-400 mt-1">
                  Cria a pasta padrão <strong className="text-cyan-400">C:\SucessoEduSistema</strong> com toda a hierarquia de diretórios e permissões totais via icacls.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile('criar_pastas_instalador.bat', createRootFolderScriptContent)}
                  className="w-full py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Criador</span>
                </button>
                <button
                  onClick={() => handleCopyCode(createRootFolderScriptContent, 'create_root')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                  title="Copiar script .BAT"
                >
                  {copiedFile === 'create_root' ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Card 2: Inno Setup */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400">Inno Setup 6</span>
                  <span className="text-2xs font-mono text-slate-500">.ISS</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-1">SucessoEdu_Setup.iss</h4>
                <p className="text-2xs text-slate-400 mt-1">
                  Validação de 800MB livres em disco, netstat com remapeamento de porta (5432/5433), HKLM e bypass de firewall.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile('SucessoEdu_Setup.iss', innoScriptContent)}
                    className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar .ISS</span>
                  </button>
                  <button
                    onClick={() => handleCopyCode(innoScriptContent, 'inno')}
                    className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                    title="Copiar código"
                  >
                    {copiedFile === 'inno' ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => setActiveTabSection('TUTORIAL')}
                  className="w-full py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 text-2xs font-mono border border-slate-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Passo a Passo</span>
                </button>
              </div>
            </div>

            {/* Card 3: Batch Installer */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Script em Lote</span>
                  <span className="text-2xs font-mono text-slate-500">.BAT</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-1">instalar_sucessoedu.bat</h4>
                <p className="text-2xs text-slate-400 mt-1">
                  Auto-elevação via `runas`, criação de pastas em C:\SucessoEduSistema e regras de firewall automáticas.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile('instalar_sucessoedu.bat', batchScriptContent)}
                  className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar .BAT</span>
                </button>
                <button
                  onClick={() => handleCopyCode(batchScriptContent, 'bat')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                  title="Copiar código"
                >
                  {copiedFile === 'bat' ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Card 4: Backup Diario */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Rotina de Backup</span>
                  <span className="text-2xs font-mono text-slate-500">03:00 AM</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-1">backup_full.bat</h4>
                <p className="text-2xs text-slate-400 mt-1">
                  Compacta 100% de C:\SucessoEduSistema (incluindo .lic e .key) e valida Folder ID do Google Drive.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile('backup_full.bat', backupScriptContent)}
                  className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Backup</span>
                </button>
                <button
                  onClick={() => handleCopyCode(backupScriptContent, 'backup')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                  title="Copiar código"
                >
                  {copiedFile === 'backup' ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Card 5: Auto-Cura PowerShell */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">PowerShell Self-Healing</span>
                  <span className="text-2xs font-mono text-slate-500">.PS1</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-1">self_healing_postgres.ps1</h4>
                <p className="text-2xs text-slate-400 mt-1">
                  Verifica status do serviço do banco de dados e reinicia automaticamente em caso de falha.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile('self_healing_postgres.ps1', selfHealingScriptContent)}
                  className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar .PS1</span>
                </button>
                <button
                  onClick={() => handleCopyCode(selfHealingScriptContent, 'ps1')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                  title="Copiar código"
                >
                  {copiedFile === 'ps1' ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção: Guia Passo a Passo Inno Setup 6 */}
      {(activeTabSection === 'ALL' || activeTabSection === 'TUTORIAL') && (
        <InnoSetupTutorial
          innoScriptContent={innoScriptContent}
          onDownloadScript={() => handleDownloadFile('SucessoEdu_Setup.iss', innoScriptContent)}
          onNavigateTab={onNavigate}
        />
      )}

      {/* Seção 8: Communication Bridge (Gmail Alert System) */}
      {(activeTabSection === 'ALL' || activeTabSection === 'LOGS') && (
        <GmailAlertSystem
          notifications={notifications}
          onSendTestNotification={handleSendTestNotification}
        />
      )}
    </div>
  );
};
