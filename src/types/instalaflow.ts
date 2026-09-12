/**
 * Tipos e Interfaces do InstalaFlow - Sistema de Gestão de Deploy e Instalação Híbrida (Supabase Edition)
 */

export type InstallationScenario = 'LOCAL_SERVER' | 'WORKSTATION' | 'REMOTE_CLOUD';

export type WindowsFolderTarget = 'ROOT_C' | 'PROGRAM_DATA' | 'LOCAL_APPDATA' | 'CUSTOM';

export interface WindowsPrivilegeStatus {
  hasAdminPrivileges: boolean;
  uacLevel: 'Elevated' | 'Standard' | 'Restricted';
  testedPaths: {
    path: string;
    canWrite: boolean;
    errorCode?: string;
    errorMessage?: string;
  }[];
  recommendedPath: string;
  fallbackAvailable: boolean;
  takeOwnershipRequired: boolean;
}

export interface DependencyCheckItem {
  id: string;
  name: string;
  category: 'RUNTIME' | 'DRIVER' | 'FRAMEWORK' | 'NETWORK';
  requiredVersion: string;
  detectedVersion: string | null;
  isInstalled: boolean;
  statusMessage: string;
  downloadUrl?: string;
  silentInstallCommand?: string;
}

export interface SQLiteTableSchema {
  name: string;
  columnsCount: number;
  hasId: boolean;
  hasUpdatedAt: boolean;
  hasStationId: boolean;
  recordsCount: number;
  isCleanProduction: boolean;
}

export interface SQLiteDatabaseStatus {
  dbPath: string;
  sizeBytes: number;
  isEncrypted: boolean;
  encryptionAlgorithm: 'SQLCipher AES-256' | 'None';
  tables: SQLiteTableSchema[];
  totalRecords: number;
  isPureZeroData: boolean;
  integrityStatus: 'OK' | 'CORRUPTED' | 'REPAIRED';
  lastIntegrityCheck: string;
  walModeEnabled: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  isConnected: boolean;
  lastPingMs: number;
  activeChannelsCount: number;
  rlsPoliciesCount: number;
}

export interface SyncConflictRecord {
  id: string;
  tableName: string;
  recordId: string;
  stationId: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  winner: 'LOCAL' | 'REMOTE';
  resolutionRule: 'LAST_WRITE_WINS';
  conflictFields: string[];
  localDataSnapshot: Record<string, any>;
  remoteDataSnapshot: Record<string, any>;
  resolvedAt: string;
  syncLatencyMs: number;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  stationId: string;
  tableName: string;
  action: 'UPSERT_TO_CLOUD' | 'PULL_FROM_CLOUD' | 'CONFLICT_RESOLVED' | 'OFFLINE_QUEUED';
  recordsAffected: number;
  durationMs: number;
  status: 'SUCCESS' | 'CONFLICT_LWW' | 'ERROR';
  details?: string;
}

export interface StationNode {
  id: string;
  stationName: string;
  stationType: 'MASTER_SERVER' | 'WORKSTATION_SECRETARY' | 'WORKSTATION_TEACHER' | 'WORKSTATION_LAB' | 'MOBILE_APP';
  ipAddress: string;
  port: number;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  lastSyncAt: string;
  pendingChangesCount: number;
  latencyMs: number;
  version: string;
}

export interface TroubleshootingIssue {
  id: string;
  errorCode: string;
  title: string;
  category: 'PERMISSIONS' | 'DIRECTORY' | 'FIREWALL' | 'DEPENDENCY' | 'NETWORK';
  symptoms: string;
  rootCause: string;
  recommendedSolution: string;
  executableScriptSnippet: string;
  scriptLanguage: 'BAT' | 'POWERSHELL' | 'XML';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface MobileEndpointSpec {
  table: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  description: string;
  postgrestQueryExample: string;
  normalizedSchema: { field: string; type: string; constraints: string }[];
  mobileSamplePayload: Record<string, any>;
}

export interface StressTestResult {
  simulatedStationsCount: number;
  totalTransactionsDispatched: number;
  successfulSyncs: number;
  conflictsDetectedAndResolved: number;
  averageLatencyMs: number;
  peakTps: number;
  packetLossPercentage: number;
  allStationsAudited: boolean;
}
