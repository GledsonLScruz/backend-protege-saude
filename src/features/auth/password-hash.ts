import crypto from 'crypto';

const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = 'sha512';

export function hashSenha(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verificarSenha(plain: string, stored: string): boolean {
  try {
    const [iterStr, salt, hash] = stored.split(':');
    const iterations = Number(iterStr) || ITERATIONS;
    const derived = crypto.pbkdf2Sync(plain, salt, iterations, KEYLEN, DIGEST).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
  } catch {
    return false;
  }
}
