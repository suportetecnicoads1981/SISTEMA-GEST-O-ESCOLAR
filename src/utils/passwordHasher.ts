/**
 * Hash de senhas das contas locais do SucessoEdu.
 *
 * As estações acessam o servidor por http://IP-da-rede, onde o navegador não
 * disponibiliza crypto.subtle (exige contexto seguro). Por isso o SHA-256 é
 * implementado aqui em JavaScript puro, com sal aleatório e iterações.
 *
 * Formato armazenado: "sha256$<iteracoes>$<sal-hex>$<hash-hex>"
 */

const HASH_PREFIX = 'sha256';
const DEFAULT_ITERATIONS = 5000;

/** Valor exibido nos formulários no lugar da senha real (nunca é uma senha válida). */
export const PASSWORD_MASK = '••••••••';

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
      const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i]);
  return out;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSaltHex(): string {
  const salt = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < salt.length; i++) salt[i] = Math.floor(Math.random() * 256);
  }
  return toHex(salt);
}

function deriveHash(password: string, saltHex: string, iterations: number): string {
  const encoder = new TextEncoder();
  let digest = sha256(encoder.encode(`${saltHex}:${password}`));
  for (let i = 1; i < iterations; i++) {
    const next = new Uint8Array(digest.length + saltHex.length);
    next.set(digest);
    next.set(encoder.encode(saltHex), digest.length);
    digest = sha256(next);
  }
  return toHex(digest);
}

/** Exposto apenas para verificação com vetores de teste conhecidos. */
export function sha256Hex(text: string): string {
  return toHex(sha256(new TextEncoder().encode(text)));
}

export function isPasswordHash(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

/** Conta possui senha definida (hash ou senha legada em texto puro). */
export function hasPasswordDefined(value?: string | null): boolean {
  return typeof value === 'string' && value.length > 0 && value !== PASSWORD_MASK;
}

export function hashPassword(password: string): string {
  const salt = randomSaltHex();
  return `${HASH_PREFIX}$${DEFAULT_ITERATIONS}$${salt}$${deriveHash(password, salt, DEFAULT_ITERATIONS)}`;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Confere a senha digitada. Aceita também senhas legadas gravadas em texto puro
 * (versões anteriores), que devem ser convertidas em hash após o login.
 */
export function verifyPassword(stored: string | undefined | null, input: string): boolean {
  if (!hasPasswordDefined(stored) || typeof input !== 'string') return false;
  if (isPasswordHash(stored)) {
    const [, iterStr, salt, expected] = (stored as string).split('$');
    const iterations = parseInt(iterStr, 10);
    if (!salt || !expected || !Number.isFinite(iterations) || iterations < 1) return false;
    return constantTimeEquals(deriveHash(input, salt, iterations), expected);
  }
  return constantTimeEquals(stored as string, input);
}

export const MIN_PASSWORD_LENGTH = 6;
