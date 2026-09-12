/**
 * Types for DataSync Pro - Supabase Integrated Ecosystem
 */

export interface SupabaseProjectConfig {
  projectUrl: string;
  restEndpoint: string;
  anonKey: string;
  isConnected: boolean;
  pingMs: number;
  buckets: {
    name: string;
    isPublic: boolean;
    maxSizeBytes: number;
  }[];
  activeEnvironment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  redirectUrl: string;
}

export interface MediaConversionResult {
  id: string;
  originalFileName: string;
  originalSize: number; // bytes
  originalFormat: 'GIF' | 'JPEG' | 'PNG' | 'WEBP' | 'OTHER';
  isAnimated: boolean;
  frameCount?: number;
  convertedBlob: Blob;
  convertedFileName: string;
  convertedSize: number; // bytes
  convertedFormat: 'WEBP';
  compressionRatio: number; // e.g. 64.5%
  savingsKb: number;
  previewUrl: string;
  originalPreviewUrl: string;
  targetBucket: 'vault' | 'public-assets';
  uploadedAt?: string;
  publicUrl?: string;
  storagePath?: string;
  isOverLimit: boolean;
}

export interface StoredAsset {
  id: string;
  name: string;
  bucket: 'vault' | 'public-assets';
  path: string;
  sizeBytes: number;
  mimeType: string;
  originalFormat: string;
  isAnimated: boolean;
  savingsRatio: number;
  createdAt: string;
  ownerId: string;
  publicUrl?: string;
}

export interface SQLCommandAnalysis {
  isCritical: boolean;
  criticalKeywords: string[];
  requiresBackup: boolean;
  sqlType: 'DDL' | 'DML' | 'DQL' | 'TRANSACTION';
  targetTables: string[];
}

export interface BackupZipRecord {
  id: string;
  fileName: string;
  timestamp: string;
  sizeBytes: number;
  schemaSqlSize: number;
  dataJsonSize: number;
  tablesCount: number;
  recordsCount: number;
  triggerReason: string;
  downloadUrl?: string;
}

export interface RLSPolicyStatus {
  tableName: string;
  rlsEnabled: boolean;
  isolationField: string; // auth.uid()
  readPolicy: string;
  writePolicy: string;
  crossAccessBlocked: boolean;
  status: 'ACTIVE' | 'WARNING' | 'DISABLED';
}

export interface AuthSessionLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: 'SUPER_ADMIN' | 'SECRETARY' | 'TEACHER';
  ipAddress: string;
  environment: string;
  redirectUrl: string;
  action: 'LOGIN' | 'TOKEN_REFRESH' | 'BACKUP_TRIGGERED' | 'DDL_EXECUTION' | 'STORAGE_CLEANUP';
  status: 'SUCCESS' | 'BLOCKED';
}
