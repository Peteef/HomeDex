import { describe, expect, it } from 'vitest';
import { foldText } from '../index.ts';

describe('foldText', () => {
  it.each([
    ['Lista zakupów', 'lista zakupow'],
    ['Łódź', 'lodz'],
    ['ZAŻÓŁĆ GĘŚLĄ JAŹŃ', 'zazolc gesla jazn'],
    ['Éclair', 'eclair'],
    ['Budget 2026', 'budget 2026'],
  ])('should fold %j to %j', (text, folded) => {
    // When / Then
    expect(foldText(text)).toBe(folded);
  });

  it('should let a query typed without Polish letters match the text', () => {
    // Given
    const title = foldText('Lista zakupów w Łodzi');

    // When / Then
    expect(title.includes(foldText('zakupow'))).toBe(true);
    expect(title.includes(foldText('LODZ'))).toBe(true);
  });
});
