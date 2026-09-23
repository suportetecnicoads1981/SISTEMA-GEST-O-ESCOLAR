import { describe, expect, it } from 'vitest';
import { classifyApiRoute, extractBearerToken, isRoleAllowed, normalizeApiPath } from '../src/server/apiAccess';

describe('classifyApiRoute', () => {
  it('mantém públicas as rotas de descoberta e das estações da rede local', () => {
    expect(classifyApiRoute('GET', '/api/health')).toBe('public');
    expect(classifyApiRoute('GET', '/api/ping')).toBe('public');
    expect(classifyApiRoute('HEAD', '/api/ping')).toBe('public');
    expect(classifyApiRoute('POST', '/api/sync')).toBe('public');
    expect(classifyApiRoute('POST', '/api/sync/station?station=LAB01')).toBe('public');
    expect(classifyApiRoute('GET', '/api/updates/download/pkg-v5.4.1-enterprise')).toBe('public');
  });

  it('exige ADMIN nas rotas que alteram o servidor', () => {
    for (const [m, p] of [
      ['POST', '/api/updates/apply'],
      ['POST', '/api/updates/publish'],
      ['POST', '/api/nexus/provision'],
      ['POST', '/api/nexus/install/commit-pipeline'],
      ['POST', '/api/cleanslate/zero-data-build'],
      ['POST', '/api/nexusinstall/network/save-secret'],
      ['POST', '/api/nexusbuild/self-healing'],
      ['GET', '/api/system/environment-status'],
      ['GET', '/api/instalaflow/download-installer'],
    ]) {
      expect(classifyApiRoute(m, p), `${m} ${p}`).toBe('admin');
    }
  });

  it('não deixa um método diferente herdar a liberação pública', () => {
    expect(classifyApiRoute('POST', '/api/health')).toBe('admin');
    expect(classifyApiRoute('DELETE', '/api/sync')).toBe('admin');
    expect(classifyApiRoute('POST', '/api/updates/download/x')).toBe('admin');
  });

  it('não é enganado por barras extras ou barra final', () => {
    expect(classifyApiRoute('POST', '//api//updates/apply/')).toBe('admin');
    expect(classifyApiRoute('GET', '/api/health/')).toBe('public');
  });

  it('IA exige equipe; rotas de contas fazem a própria checagem', () => {
    expect(classifyApiRoute('POST', '/api/ai/pedagogical-insights')).toBe('staff');
    expect(classifyApiRoute('POST', '/api/admin/cloud-user')).toBe('self');
    expect(classifyApiRoute('POST', '/api/update-user-role')).toBe('self');
  });

  it('rota desconhecida exige ADMIN (falha fechada)', () => {
    expect(classifyApiRoute('GET', '/api/qualquer-coisa-nova')).toBe('admin');
  });
});

describe('isRoleAllowed', () => {
  it('aplica os papéis corretamente', () => {
    expect(isRoleAllowed('admin', 'ADMIN')).toBe(true);
    expect(isRoleAllowed('admin', 'admin')).toBe(true);
    expect(isRoleAllowed('admin', 'TEACHER')).toBe(false);
    expect(isRoleAllowed('admin', '')).toBe(false);
    expect(isRoleAllowed('staff', 'TEACHER')).toBe(true);
    expect(isRoleAllowed('staff', 'STUDENT')).toBe(false);
    expect(isRoleAllowed('staff', null)).toBe(false);
    expect(isRoleAllowed('public', null)).toBe(true);
  });
});

describe('extractBearerToken / normalizeApiPath', () => {
  it('lê o token do cabeçalho', () => {
    expect(extractBearerToken('Bearer abc.def')).toBe('abc.def');
    expect(extractBearerToken('bearer  xyz ')).toBe('xyz');
    expect(extractBearerToken('Basic abc')).toBe('');
    expect(extractBearerToken(undefined)).toBe('');
  });
  it('normaliza caminhos', () => {
    expect(normalizeApiPath('/api/x/?a=1')).toBe('/api/x');
    expect(normalizeApiPath('/')).toBe('/');
  });
});
