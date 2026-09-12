/**
 * CleanSlate Enterprise Hub - Tipos e Contratos
 * Infraestrutura Desktop Blindada: Electron, React & Supabase
 * Conformidade estrita com LGPD, Zero-Data Production, GDrive Chunked Stream e Ed25519 CLI.
 */

export type CleanSlateEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION_ZERO_DATA';

export interface LgpdConsentPreferences {
  technicalTelemetry: boolean;
  performanceDiagnostics: boolean;
  crashReports: boolean;
  acceptedAt: string | null;
  consentVersion: string;
}

export interface HardwareTelemetryLGPD {
  rawPlaceholderLabel: string; // Ex: "[PROTEGIDO PELA LGPD]"
  anonymizedCpuHash: string; // SHA-256(CPU_ID + Secret_Salt)
  anonymizedDiskHash: string; // SHA-256(Disk_Serial + Secret_Salt)
  saltIdentifier: string; // Ex: "vault_salt_v2" (nunca o segredo em claro)
  platform: string;
  osRelease: string;
  totalMemoryGb: number;
  cpuCores: number;
  anonymizationTimestamp: string;
  ttlExpiresAt: string; // TTL de 90 dias
  ttlDaysRemaining: number;
  lgpdComplianceStatus: 'COMPLIANT' | 'NEEDS_CONSENT';
}

export interface UpdateChunk {
  index: number;
  byteStart: number;
  byteEnd: number;
  sizeBytes: number; // 64MB por chunk padrão
  sizeMb: number;
  status: 'PENDING' | 'DOWNLOADING' | 'BUFFERING' | 'VALIDATING' | 'VERIFIED' | 'CORRUPTED' | 'HEALING';
  adler32Expected: string;
  adler32Actual?: string;
  downloadedBytes: number;
  retryCount: number;
  lastError?: string;
}

export interface UpdatePackageSpec {
  id: string;
  version: string;
  channel: 'STABLE_ENTERPRISE' | 'LTS' | 'BETA';
  rawSizeBytes: number; // ~256MB
  compressedSizeBytes: number; // ~142MB
  compressionRatio: string; // "44.5% de redução"
  compressionAlgorithm: 'LZMA' | 'BROTLI';
  finalSha512: string;
  gdriveFileId: string;
  gdriveUrl: string;
  chunkSizeBytes: number; // 67108864 (64MB)
  bufferSizeBytes: number; // 8388608 (8MB)
  chunks: UpdateChunk[];
  totalProgressPercentage: number;
  overallStatus: 'IDLE' | 'DOWNLOADING' | 'PAUSED' | 'VERIFYING' | 'COMPLETED' | 'FAILED_HEALING';
  resumable: boolean;
}

export type ApprovedCommandName =
  | 'rebuild-index'
  | 'clear-cache'
  | 'rotate-logs'
  | 'check-integrity'
  | 'flush-dns'
  | 'restart-service';

export interface EphemeralCommand {
  id: string;
  commandName: ApprovedCommandName;
  args?: Record<string, any>;
  signatureEd25519: string;
  signedBy: string; // "supabase-vault@admin-ed25519"
  issuedAt: string;
  executedAt?: string;
  status: 'PENDING' | 'VALIDATING_SIGNATURE' | 'EXECUTING' | 'SUCCESS' | 'REJECTED_SIGNATURE' | 'BLOCKED_UNAUTHORIZED';
  exitCode?: number;
  output: string[];
  durationMs?: number;
  rlsOwnerId: string; // device_owner_id
}

export interface ZeroDataBuildSummary {
  environment: CleanSlateEnvironment;
  buildTimestamp: string;
  purgedTables: {
    tableName: string;
    purgedRowCount: number;
    description: string;
  }[];
  preservedTables: {
    tableName: string;
    preservedRowCount: number;
    description: string;
  }[];
  totalPurgedRows: number;
  totalPreservedRows: number;
  isPureZeroData: boolean;
  productionDbUrl: string;
  manifestSha256: string;
}

export interface SupabaseRealtimeState {
  isConnected: boolean;
  channelName: string;
  transport: 'WSS' | 'WEBSOCKET_SECURE';
  clientMode: 'OUTBOUND_ONLY' | 'ZERO_OPEN_PORTS';
  rlsPolicyEnforced: string; // "uid() = device_owner_id"
  lastPingMs: number;
  eventsReceivedCount: number;
}
