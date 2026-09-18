// Types for NexusCore ERP Production Consolidation & Deployment
export type NexusCoreModuleId = 'auth' | 'crm' | 'financeiro' | 'inventario';

export interface NexusCoreModuleAudit {
  id: NexusCoreModuleId;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'pending';
  testsCount: number;
  passedTests: number;
  failedTests: number;
  coveragePercent: number;
  latencyMs: number;
  details: string[];
  lastAuditedAt: string;
}

export interface NexusCoreSnapshotMetadata {
  snapshotId: string;
  timestamp: string;
  initiator: string; // suportetecnicoads@gmail.com
  storageBucket: string; // gs://nexuscore-production-backups
  storagePath: string;
  firestoreCollectionCount: number;
  totalDocuments: number;
  sizeBytes: number;
  status: 'completed' | 'in_progress' | 'failed' | 'verified';
  checksumSha256: string;
}

export interface NexusCoreDriveReleaseMetadata {
  releaseId: string;
  folderName: string; // "Atualizações e melhorias"
  fileId?: string;
  versionTag: string;
  syncedAt: string;
  syncedBy: string; // suportetecnicoads@gmail.com
  driveWebLink?: string;
  status: 'synced' | 'pending' | 'failed';
  artifactsCount: number;
}

export interface NexusCoreMigrationProgress {
  isActive: boolean;
  phase: 'idle' | 'snapshot_backup' | 'schema_refactor' | 'drive_sync' | 'smoke_test' | 'completed' | 'failed';
  currentCollection: string;
  currentDocumentId: string;
  processedDocs: number;
  totalDocs: number;
  percent: number;
  estimatedRemainingSecs: number;
  startTime: number;
  errors: string[];
  logs: string[];
}

export interface NexusCoreSmokeTestResult {
  readSuccess: boolean;
  writeSuccess: boolean;
  sessionPersistence: boolean;
  rlsIsolationEnforced: boolean;
  latencyAvgMs: number;
  allPassed: boolean;
  executedAt: string;
}
