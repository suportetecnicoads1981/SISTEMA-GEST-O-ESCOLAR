export interface HardwareValidatorState {
  cpuCores: number;
  totalMemoryGb: number;
  freeMemoryGb: number;
  freeDiskGb: number;
  targetDisk: string; // Ex: 'C:\SucessoEduSistema'
  isDiskSpaceOk: boolean; // Requisito: >= 2GB
  isAdmin: boolean;
  conflictingProcesses: { name: string; pid: number; port?: number; canAutoKill: boolean }[];
  status: 'CHECKING' | 'PASSED' | 'FAILED';
  evaluatedAt: string;
}

export interface SastFinding {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  file: string;
  line: number;
  rule: string;
  description: string;
  autoFixAvailable: boolean;
  fixed: boolean;
}

export interface SastAuditResult {
  passed: boolean;
  totalScannedFiles: number;
  criticalIssuesCount: number;
  warningsCount: number;
  syntaxOk: boolean;
  memoryLeakChecksPassed: boolean;
  binaryIntegritySha256: string;
  findings: SastFinding[];
  developerNotified: boolean;
  developerEmail: string; // suportetecnicoads@gmail.com
  auditTimestamp: string;
}

export interface PostgresSmartAdapterState {
  detectedExisting: boolean;
  activePort: 5432 | 5433;
  connectionAttempts: number;
  maxAttempts: number;
  connectionLogs: string[];
  status: 'TESTING_5432' | 'CONNECTED_5432' | 'FALLBACK_INSTALL_5433' | 'RUNNING_5433' | 'SELF_HEALING' | 'ERROR';
  silentInstallPrepared: boolean;
  version: string;
  pgHbaConfigured: boolean;
  pgHbaContent: string;
  serviceName: string; // 'postgresql-x64-16'
  selfHealingTriggered: boolean;
}

export interface FirewallRule {
  id: string;
  name: string;
  direction: 'in' | 'out';
  action: 'allow' | 'block';
  protocol: 'TCP' | 'UDP';
  localPort?: number;
  program?: string;
  status: 'CONFIGURED' | 'PENDING' | 'FAILED';
  command: string;
}

export interface BackupEngineConfig {
  cronSchedule: string; // "0 3 * * *" (03:00 AM)
  scheduledTimeStr: string; // "03:00 AM Diário"
  windowsTaskName: string; // "NexusBuild_DailyBackup"
  gdriveFolderId: string;
  isFolderIdValid: boolean; // Regex: ^[a-zA-Z0-9-_]{25,45}$
  aesKeyMasked: string;
  totalArchiveIncludesAll: boolean; // 100% da pasta C:\SucessoEduSistema
  includeExtensions: string[]; // ['.lic', '.key', '.exe', '.db', '.log', '.json']
  lastBackupStatus: 'IDLE' | 'PROGRESS' | 'SUCCESS' | 'FAILED';
  lastBackupTimestamp?: string;
  lastBackupArchiveName?: string;
  cloudSyncConfirmed: boolean;
}

export interface DeveloperNotification {
  id: string;
  timestamp: string;
  recipient: string; // suportetecnicoads@gmail.com
  subject: string;
  type: 'INSTALLATION_STATUS' | 'AUDIT_CRITICAL' | 'BACKUP_INTEGRITY' | 'SELF_HEALING_ALERT';
  status: 'SENT' | 'QUEUED' | 'FAILED';
  contentPreview: string;
}

export interface InnoSetupPackageMeta {
  appName: string;
  appVersion: string;
  installRoot: string; // "C:\SucessoEduSistema"
  outputExeName: string; // "NexusBuild_Setup_v4.2.exe"
  issContent: string;
  batchLauncherContent: string;
  powershellProvisionContent: string;
  dependenciesIncluded: string[];
  totalEstimatedSizeMb: number;
  generatedAt: string;
}

export type NexusBuildWizardStep =
  | 'PREREQUISITES'
  | 'SAST_AUDIT'
  | 'ROOT_PROVISIONING'
  | 'DATABASE_DEPLOY'
  | 'FIREWALL_CONFIG'
  | 'BACKUP_ENGINE'
  | 'PACKAGE_INNO';
