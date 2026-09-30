import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ACCESS_RULES } from '../src/services/rbac/accessControl';
import { getDefaultSectorPermissions } from '../src/components/usuarios/UserAccessControl';

const ps = readFileSync(join(__dirname, '../public/offline/servidor_sucessoedu.ps1'), 'utf8');

function hereString(name: string): any {
  const start = ps.indexOf(`$${name} = @'\n`);
  expect(start).toBeGreaterThan(0);
  const body = ps.slice(start + name.length + 7);
  return JSON.parse(body.slice(0, body.indexOf("\n'@")));
}

describe('servidor da rede local: mesmas regras de permissão do sistema', () => {
  it('regras por cadastro iguais às do accessControl.ts', () => {
    expect(hereString('AccessRulesJson')).toEqual(JSON.parse(JSON.stringify(ACCESS_RULES)));
  });

  it('permissões padrão por setor iguais às do cadastro de usuários', () => {
    const defaults = hereString('SectorDefaultsJson');
    for (const sector of ['MASTER', 'DIRETORIA', 'COORDENACAO', 'SECRETARIA', 'PROFESSOR', 'GESTOR_MUNICIPAL', 'ALUNO', 'RESPONSAVEL']) {
      expect(defaults[sector]).toEqual(getDefaultSectorPermissions(sector as any));
    }
  });

  it('script só com caracteres ASCII (Windows PowerShell 5.1 lê .ps1 sem BOM como ANSI)', () => {
    expect([...ps].every((c) => c.charCodeAt(0) < 128)).toBe(true);
  });

  it('gravação não falha com valores embrulhados do PowerShell (referência circular)', () => {
    expect(ps).toContain('function ConvertTo-PlainValue');
    const fn = ps.slice(ps.indexOf('function ConvertTo-JsonText'), ps.indexOf("$AccessRulesJson = @'"));
    expect(fn).toContain('catch');
    expect(fn).toContain('ConvertTo-PlainValue $value');
    // Sem pipeline (Where-Object) montando listas que voltam ao banco ou à comparação.
    expect(ps).not.toMatch(/\$w\.list \| Where-Object/);
    expect(ps).toContain('reason = [string]$reason');
  });

  it('servidor anuncia as permissões e exige sessão para gravar', () => {
    expect(ps).toContain('"permissoes":true');
    expect(ps).toContain("'/api/local/ops'");
    expect(ps).toContain("'/api/local/login'");
    expect(ps).toContain('somente-master');
  });
});
