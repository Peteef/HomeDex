import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'scrypt';
const SEPARATOR = '$';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const ENCODING = 'base64';
const SCRYPT_MEMORY_FACTOR = 128;
const MEMORY_HEADROOM = 2;

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

// OWASP's first scrypt recommendation: 128 MiB of memory.
export const DEFAULT_SCRYPT_PARAMS: ScryptParams = { N: 2 ** 17, r: 8, p: 1 };

function derive(password: string, salt: Buffer, { N, r, p }: ScryptParams): Promise<Buffer> {
  const maxmem = SCRYPT_MEMORY_FACTOR * N * r * MEMORY_HEADROOM;
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N, r, p, maxmem }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

// The stored form carries its own parameters, so the cost can be raised without breaking old hashes.
export async function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_SCRYPT_PARAMS,
): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, params);
  return [
    ALGORITHM,
    String(params.N),
    String(params.r),
    String(params.p),
    salt.toString(ENCODING),
    key.toString(ENCODING),
  ].join(SEPARATOR);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, key] = stored.split(SEPARATOR);
  if (algorithm !== ALGORITHM || !n || !r || !p || !salt || !key) return false;
  const expected = Buffer.from(key, ENCODING);
  const actual = await derive(password, Buffer.from(salt, ENCODING), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
