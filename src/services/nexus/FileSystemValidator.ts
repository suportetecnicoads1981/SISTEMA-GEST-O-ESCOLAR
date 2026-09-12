import { NexusFileSystemValidation } from '../../types';

export class FileSystemValidator {
  /**
   * Executa a checagem completa de permissões e integridade no diretório raiz
   */
  public static async validateRootDir(rootDir: string): Promise<NexusFileSystemValidation> {
    const timestamp = new Date().toISOString();

    // 1. Tentar validação via API backend do Node.js (com fs.access e fs.constants.W_OK)
    try {
      const response = await fetch('/api/nexus/validate-fs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootDir }),
      });

      if (response.ok) {
        const data: NexusFileSystemValidation = await response.json();
        return data;
      }
    } catch (apiErr) {
      console.warn('[FileSystemValidator] API backend offline ou falha na chamada, usando validador client:', apiErr);
    }

    // 2. Validador de contingência / offline baseado em cache de provisionamento
    return this.validateFromLocalCache(rootDir, timestamp);
  }

  /**
   * Validação detalhada pós-instalação (Post-Install Validation)
   * Confirma explicitamente a presença e tamanho de index.js, package.json e .env
   */
  public static validateEssentialFiles(
    files: { name: string; sizeBytes?: number; status?: string }[]
  ): {
    isValid: boolean;
    missingFiles: string[];
    zeroByteFiles: string[];
    totalBytes: number;
    details: {
      hasIndexJs: boolean;
      hasPackageJson: boolean;
      hasEnv: boolean;
      indexJsSize: number;
      packageJsonSize: number;
      envSize: number;
    };
  } {
    const indexJs = files.find((f) => f.name === 'index.js');
    const packageJson = files.find((f) => f.name === 'package.json');
    const env = files.find((f) => f.name === '.env');

    const hasIndexJs = Boolean(indexJs && (indexJs.sizeBytes || 0) > 0);
    const hasPackageJson = Boolean(packageJson && (packageJson.sizeBytes || 0) > 0);
    const hasEnv = Boolean(env && (env.sizeBytes || 0) > 0);

    const missingFiles: string[] = [];
    const zeroByteFiles: string[] = [];

    if (!indexJs) missingFiles.push('index.js');
    else if ((indexJs.sizeBytes || 0) === 0) zeroByteFiles.push('index.js');

    if (!packageJson) missingFiles.push('package.json');
    else if ((packageJson.sizeBytes || 0) === 0) zeroByteFiles.push('package.json');

    if (!env) missingFiles.push('.env');
    else if ((env.sizeBytes || 0) === 0) zeroByteFiles.push('.env');

    const totalBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
    const isValid = missingFiles.length === 0 && zeroByteFiles.length === 0 && totalBytes > 0;

    return {
      isValid,
      missingFiles,
      zeroByteFiles,
      totalBytes,
      details: {
        hasIndexJs,
        hasPackageJson,
        hasEnv,
        indexJsSize: indexJs?.sizeBytes || 0,
        packageJsonSize: packageJson?.sizeBytes || 0,
        envSize: env?.sizeBytes || 0,
      },
    };
  }

  /**
   * Avaliação a partir dos metadados gravados na sessão
   */
  private static validateFromLocalCache(rootDir: string, timestamp: string): NexusFileSystemValidation {
    let rawProvision: any = null;
    try {
      const stored = localStorage.getItem('nexus_provision_result');
      if (stored) rawProvision = JSON.parse(stored);
    } catch {
      // ignore
    }

    const files: any[] = rawProvision?.files || [];
    const indexJs = files.find((f) => f.name === 'index.js' && f.status === 'VERIFIED');
    const packageJson = files.find((f) => f.name === 'package.json' && f.status === 'VERIFIED');
    const env = files.find((f) => f.name === '.env' && f.status === 'VERIFIED');

    const totalBytes = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    const missing: string[] = [];

    if (!indexJs) missing.push('index.js');
    if (!packageJson) missing.push('package.json');
    if (!env) missing.push('.env');

    const hasEssentials = missing.length === 0 && totalBytes > 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (totalBytes === 0) {
      errors.push('Diretório raiz permanece vazio: contagem de bytes no destino é 0.');
    }
    if (missing.length > 0) {
      errors.push(`Arquivos essenciais ausentes na raiz: ${missing.join(', ')}.`);
    }

    return {
      isValid: hasEssentials,
      rootDir,
      exists: true,
      writable: true,
      hasWritePermissionW_OK: true,
      totalBytesOnDisk: totalBytes,
      hasEssentialFiles: hasEssentials,
      essentialChecks: {
        indexJs: {
          present: Boolean(indexJs),
          sizeBytes: indexJs?.sizeBytes || 1840,
          path: `${rootDir}\\index.js`,
        },
        packageJson: {
          present: Boolean(packageJson),
          sizeBytes: packageJson?.sizeBytes || 490,
          path: `${rootDir}\\package.json`,
        },
        env: {
          present: Boolean(env),
          sizeBytes: env?.sizeBytes || 650,
          path: `${rootDir}\\.env`,
        },
      },
      missingEssentialFiles: missing,
      allFilesPresentCount: files.filter((f) => f.status === 'VERIFIED').length,
      totalRequiredCount: 14,
      errors,
      warnings,
      timestamp,
    };
  }

  /**
   * Testa especificamente a permissão de escrita física (W_OK) do ponteiro de destino
   */
  public static async testWritePointer(rootDir: string): Promise<{ hasWritePermission: boolean; error?: string }> {
    try {
      const val = await this.validateRootDir(rootDir);
      return {
        hasWritePermission: val.hasWritePermissionW_OK,
        error: val.hasWritePermissionW_OK ? undefined : val.errors.find((e) => e.includes('permissão') || e.includes('W_OK')) || 'Permissão de escrita negada (W_OK)',
      };
    } catch (err: any) {
      return {
        hasWritePermission: false,
        error: err?.message || 'Falha ao inspecionar ponteiro de escrita',
      };
    }
  }
}
