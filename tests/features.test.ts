import { describe, expect, it } from 'vitest';
import { isTabAvailable } from '../src/config/features';

describe('módulos experimentais', () => {
  it('ficam ocultos por padrão e voltam com a flag', () => {
    expect(isTabAvailable('NEXUS_BUILD', false)).toBe(false);
    expect(isTabAvailable('OMNI_DEPLOY', false)).toBe(false);
    expect(isTabAvailable('NEXUS_BUILD', true)).toBe(true);
  });
  it('não afetam os módulos reais', () => {
    for (const id of ['MAIN_DASHBOARD', 'STUDENTS', 'NETWORK_INSTALLER', 'DATASYNC_PRO', 'USER_CONTROL']) {
      expect(isTabAvailable(id, false)).toBe(true);
    }
  });
});
