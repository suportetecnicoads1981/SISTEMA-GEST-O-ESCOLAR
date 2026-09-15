/**
 * Tipos e Interfaces do NexusInstall - Gerenciador de Módulos e Instaladores
 * Padrões de Design System:
 * - Fundo: bg-slate-950 (#020617)
 * - Primária: bg-blue-600 (#2563eb)
 * - Texto: text-slate-50 e text-slate-400
 * - Border radius: rounded-md
 */

export interface NetworkInterfaceDetail {
  name: string;
  family: string;
  address: string;
  netmask?: string;
  mac: string;
  internal: boolean;
  type: 'Ethernet' | 'Wi-Fi' | 'Virtual' | 'Loopback';
  isPhysical: boolean;
  speedMbps?: number;
}

export interface NetworkDetectionResult {
  defaultPort: number;
  allocatedPort: number;
  isPortOccupied: boolean;
  migrationLogs: string[];
  primaryIp: string;
  hostname: string;
  activeInterface: NetworkInterfaceDetail | null;
  allInterfaces: NetworkInterfaceDetail[];
  secretManagerSynced: boolean;
  secretKeyName: string;
  envFilePath: string;
  timestamp: string;
}

export interface AuditedAsset {
  name: string;
  type: 'css' | 'js' | 'html' | 'manifest' | 'font';
  devBytes: number;
  prodBytes: number;
  devHash: string;
  prodHash: string;
  status: 'MATCH' | 'MISMATCH' | 'IGNORED';
  notes: string;
}

export interface PurgedClassAudit {
  className: string;
  category: 'Grid' | 'Flexbox' | 'Spacing' | 'ThemeColor' | 'BorderRadius';
  preserved: boolean;
  selector: string;
}

export interface VisualAuditReport {
  devHash: string;
  prodHash: string;
  isParityVerified: boolean;
  parityScore: number; // 0 - 100
  totalAssetsAudited: number;
  ignoredAssetsCount: number;
  criticalClassesPreserved: boolean;
  auditedAssets: AuditedAsset[];
  purgedClasses: PurgedClassAudit[];
  divergenceReason?: string;
  timestamp: string;
}

export interface CompactPackageResult {
  success: boolean;
  packageFileName: string;
  singleExecutableName: string;
  originalBundleSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercentage: number;
  allocatedPort: number;
  allocatedIp: string;
  firewallRuleCommand: string;
  checksumSha256: string;
  devDependenciesRemoved: string[];
  installationType: 'SINGLE_EXECUTABLE' | 'ONE_CLICK_STANDALONE';
  downloadUrl?: string;
  generatedFiles: {
    name: string;
    sizeFormatted: string;
    purpose: string;
  }[];
  timestamp: string;
}
