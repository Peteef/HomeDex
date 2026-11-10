import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../password.ts';
import type { Argon2Params } from '../password.ts';

const FAST: Argon2Params = { memory: 8, passes: 1, parallelism: 1 };

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

  it('should store the hash as an Argon2id PHC string with its parameters', async () => {
    expect(await hashPassword('pw-long-enough', FAST)).toMatch(
      /^\$argon2id\$v=19\$m=8,t=1,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
    );
  });

  it('should verify a hash made with other parameters when it carries them', async () => {
    const hash = await hashPassword('pw-long-enough', { memory: 16, passes: 2, parallelism: 1 });
    expect(await verifyPassword('pw-long-enough', hash)).toBe(true);
  });

  it('should verify a hash made by another Argon2id implementation when it is a PHC string', async () => {
    // Generated with the `argon2` npm package (the reference C implementation) for the password
    // "password" and the salt "somesaltsomesalt".
    const reference =
      '$argon2id$v=19$m=8,t=1,p=1$c29tZXNhbHRzb21lc2FsdA$BbbKj4A4toOIetSRZTOFi0nLUgQBJsE09Mbp2HEbjAk';
    expect(await verifyPassword('password', reference)).toBe(true);
    expect(await verifyPassword('Password', reference)).toBe(false);
  });

  it('should reject a stored value that is not an Argon2id hash', async () => {
    expect(await verifyPassword('anything', 'plaintext')).toBe(false);
    expect(await verifyPassword('anything', 'scrypt$16$1$1$a$b')).toBe(false);
    expect(await verifyPassword('anything', '$argon2i$v=19$m=8,t=1,p=1$c2FsdA$aGFzaA')).toBe(false);
  });

  it('should hash with the OWASP parameters when no parameters are given', async () => {
    const hash = await hashPassword('default-params-pw');
    expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
    expect(await verifyPassword('default-params-pw', hash)).toBe(true);
  });
});
