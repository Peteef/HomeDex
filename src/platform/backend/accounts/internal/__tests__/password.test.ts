import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../password.ts';
import type { ScryptParams } from '../password.ts';

const FAST: ScryptParams = { N: 16, r: 1, p: 1 };

describe('password hashing', () => {
  it('should accept the password when it matches the hash', async () => {
    const hash = await hashPassword('s3cret-pass', FAST);
    expect(await verifyPassword('s3cret-pass', hash)).toBe(true);
  });

  it('should reject the password when it differs from the hash', async () => {
    const hash = await hashPassword('s3cret-pass', FAST);
    expect(await verifyPassword('s3cret-pasS', hash)).toBe(false);
  });

  it('should produce different hashes when the same password is hashed twice', async () => {
    expect(await hashPassword('same-password', FAST)).not.toBe(
      await hashPassword('same-password', FAST),
    );
  });

  it('should store the algorithm and its parameters with the hash', async () => {
    expect(await hashPassword('pw-long-enough', FAST)).toMatch(/^scrypt\$16\$1\$1\$[^$]+\$[^$]+$/);
  });

  it('should verify a hash made with other parameters when it carries them', async () => {
    const hash = await hashPassword('pw-long-enough', { N: 32, r: 2, p: 1 });
    expect(await verifyPassword('pw-long-enough', hash)).toBe(true);
  });

  it('should reject a stored value that is not a scrypt hash', async () => {
    expect(await verifyPassword('anything', 'plaintext')).toBe(false);
    expect(await verifyPassword('anything', 'bcrypt$1$2$3$4$5')).toBe(false);
  });

  it('should hash with the OWASP parameters when no parameters are given', async () => {
    const hash = await hashPassword('default-params-pw');
    expect(hash.startsWith('scrypt$131072$8$1$')).toBe(true);
    expect(await verifyPassword('default-params-pw', hash)).toBe(true);
  });
});
