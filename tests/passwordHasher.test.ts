import { describe, expect, it } from 'vitest';
import { hashPassword, isPasswordHash, verifyPassword, sha256Hex, PASSWORD_MASK } from '../src/utils/passwordHasher';

describe('passwordHasher', () => {
  it('sha256 confere com o vetor de teste padrão', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('gera hash com sal aleatório e confere a senha', () => {
    const a = hashPassword('Senha@123');
    const b = hashPassword('Senha@123');
    expect(isPasswordHash(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(a).not.toContain('Senha@123');
    expect(verifyPassword(a, 'Senha@123')).toBe(true);
    expect(verifyPassword(a, 'senha@123')).toBe(false);
    expect(verifyPassword(a, '')).toBe(false);
  });

  it('não aceita a máscara nem hash adulterado', () => {
    expect(verifyPassword(PASSWORD_MASK, PASSWORD_MASK)).toBe(false);
    expect(verifyPassword(undefined, 'x')).toBe(false);
    const h = hashPassword('abc123');
    const parts = h.split('$');
    parts[1] = '0';
    expect(verifyPassword(parts.join('$'), 'abc123')).toBe(false);
  });
});
