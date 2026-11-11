import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetAccount, rememberAccount, rememberedAccount } from '../rememberedAccount.ts';

const blockStorage = () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });

  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });

  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked');
  });
};

describe('remembered account', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return nothing when nobody was remembered', () => {
    // When / Then
    expect(rememberedAccount()).toBeNull();
  });

  it('should return the remembered username', () => {
    // Given
    rememberAccount('Misty');

    // When / Then
    expect(rememberedAccount()).toBe('Misty');
  });

  it('should return nothing after the account is forgotten', () => {
    // Given
    rememberAccount('Misty');

    // When
    forgetAccount();

    // Then
    expect(rememberedAccount()).toBeNull();
  });

  it('should act as if nobody was remembered when the browser blocks storage', () => {
    // Given
    blockStorage();

    // When
    rememberAccount('Misty');
    forgetAccount();

    // Then
    expect(rememberedAccount()).toBeNull();
  });
});
