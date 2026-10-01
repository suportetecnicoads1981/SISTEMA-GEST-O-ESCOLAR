import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { passwordProblem, generateStrongPassword } from '../src/utils/passwordPolicy';

describe('regra de senha (igual à da nuvem)', () => {
  it('aceita só 8+ caracteres com minúscula, maiúscula e número', () => {
    expect(passwordProblem('Escola2026')).toBe('');
    expect(passwordProblem('escola26')).toContain('letra maiúscula');
    expect(passwordProblem('ESCOLA2026')).toContain('letra minúscula');
    expect(passwordProblem('Escolaxyz')).toContain('número');
    expect(passwordProblem('Es2026')).toContain('8 caracteres');
    expect(passwordProblem('')).not.toBe('');
  });
  it('a senha gerada já atende à regra', () => {
    for (let i = 0; i < 200; i++) expect(passwordProblem(generateStrongPassword())).toBe('');
  });
  it('servidor da Sede e função da nuvem usam a mesma regra', () => {
    const ps = readFileSync(join(__dirname, '../public/offline/servidor_sucessoedu.ps1'), 'utf8');
    expect(ps).toContain("$password.Length -lt 8 -or $password -cnotmatch '[a-z]' -or $password -cnotmatch '[A-Z]' -or $password -notmatch '[0-9]'");
    const fn = readFileSync(join(__dirname, '../supabase/functions/gerenciar-conta-nuvem/index.ts'), 'utf8');
    expect(fn).toContain('password.length < 8');
  });
});
