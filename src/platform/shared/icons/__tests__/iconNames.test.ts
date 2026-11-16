import { describe, expect, it } from 'vitest';
import { isIconName } from '../iconNames.ts';

describe('isIconName', () => {
  it('should be true when the name is a built-in icon', () => {
    // When / Then
    expect(isIconName('cart')).toBe(true);
  });

  it.each(['no-such-icon', 'toString'])('should be false when the name is %s', (name) => {
    // When / Then
    expect(isIconName(name)).toBe(false);
  });
});
