import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'argon2id';
const VERSION = 19;
const SALT_LENGTH = 16;
const TAG_LENGTH = 32;
const ENCODING = 'base64';
const PADDING = /=+$/;
const PHC_FORMAT = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/;

export interface Argon2Params {
  // In KiB.
  memory: number;
  passes: number;
  parallelism: number;
}

// OWASP's first Argon2id recommendation: 19 MiB, 2 passes, 1 lane.
export const DEFAULT_ARGON2_PARAMS: Argon2Params = { memory: 19456, passes: 2, parallelism: 1 };

function derive(
  password: string,
  salt: Buffer,
  { memory, passes, parallelism }: Argon2Params,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2(
      ALGORITHM,
      { message: password, nonce: salt, parallelism, tagLength: TAG_LENGTH, memory, passes },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

const encode = (bytes: Buffer): string => bytes.toString(ENCODING).replace(PADDING, '');

// The result is a PHC string, which carries its own parameters, so the cost can be raised
// without breaking existing hashes.
export async function hashPassword(
  password: string,
  params: Argon2Params = DEFAULT_ARGON2_PARAMS,
): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, params);
  const cost = `m=${String(params.memory)},t=${String(params.passes)},p=${String(params.parallelism)}`;
  return `$${ALGORITHM}$v=${String(VERSION)}$${cost}$${encode(salt)}$${encode(key)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const match = PHC_FORMAT.exec(stored);
  if (!match) return false;
  const [, memory, passes, parallelism, salt, key] = match;
  const expected = Buffer.from(key ?? '', ENCODING);
  const actual = await derive(password, Buffer.from(salt ?? '', ENCODING), {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
