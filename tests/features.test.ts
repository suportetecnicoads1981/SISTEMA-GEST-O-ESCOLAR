import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DISABLED_TAB_IDS, isTabAvailable } from '../src/config/features';

describe('painéis de demonstração desativados', () => {
  it('ficam indisponíveis', () => {
    for (const id of ['NEXUS_BUILD', 'OMNI_DEPLOY', 'DATASYNC_PRO', 'ARCHITECTURE_DIAGRAM', 'INSTALAFLOW', 'DEBUG_FLOW']) {
      expect(isTabAvailable(id)).toBe(false);
    }
  });
  it('não afetam os módulos reais', () => {
    for (const id of ['MAIN_DASHBOARD', 'STUDENTS', 'NETWORK_INSTALLER', 'MUNICIPAL_SYNC', 'USER_CONTROL', 'SYSTEM_UPDATES', 'ADMIN_TI']) {
      expect(isTabAvailable(id)).toBe(true);
    }
  });
  it('não são mais importados pelo App (fora do pacote)', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    for (const hub of ['NexusBuildHub', 'OmniDeployHub', 'NexusDeployerHub', 'NexusInstallHub', 'CleanSlateHub', 'InstalaFlowHub', 'DataSyncProHub', 'DebugFlowHub', 'SystemArchitectureHub']) {
      expect(app).not.toMatch(new RegExp(`import[^;]*\\b${hub}\\b`));
    }
    expect(DISABLED_TAB_IDS.size).toBeGreaterThanOrEqual(9);
  });
});
