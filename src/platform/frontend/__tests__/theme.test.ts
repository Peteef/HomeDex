import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIN_TEXT_CONTRAST = 4.5;
const CSS = readFileSync(resolve(process.cwd(), 'src/platform/frontend/index.css'), 'utf8');

type Rgb = [number, number, number];

const channel = (value: number): number => {
  const unit = value / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]: Rgb): number =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

const contrast = (a: Rgb, b: Rgb): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

const tokenValue = (name: string): string => {
  const match = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(CSS);
  if (!match?.[1]) {
    throw new Error(`Missing token ${name}`);
  }
  return match[1].trim();
};

const parseHex = (hex: string): Rgb =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as Rgb;

const solid = (name: string): Rgb => parseHex(tokenValue(name));

const over = (name: string, background: Rgb): Rgb => {
  const match = /rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/.exec(tokenValue(name));
  if (!match) {
    throw new Error(`Token ${name} is not an rgb() with alpha`);
  }
  const alpha = Number(match[4]);
  const foreground = [match[1], match[2], match[3]].map(Number);
  return background.map((under, i) =>
    Math.round((foreground[i] ?? 0) * alpha + under * (1 - alpha)),
  ) as Rgb;
};

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];

describe('theme tokens', () => {
  describe.each([
    ['dark', BLACK],
    ['bright', WHITE],
  ] as const)('text on the glass panel over a %s scene', (_scene, background) => {
    it.each(['dex-ink', 'dex-ink-muted', 'dex-red-deep'])(
      'should keep %s at least 4.5:1',
      (token) => {
        // Given
        const panel = over('dex-glass', background);

        // When
        const ratio = contrast(solid(token), panel);

        // Then
        expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      },
    );

    it('should keep text on a tile card at least 4.5:1', () => {
      // Given
      const card = over('dex-card', over('dex-glass', background));

      // When
      const ratios = ['dex-ink', 'dex-ink-muted'].map((token) => contrast(solid(token), card));

      // Then
      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      }
    });
  });

  it('should keep white text on the primary button at least 4.5:1', () => {
    // When
    const ratio = contrast(WHITE, solid('dex-red'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it('should keep white text on the pressed pin and the hovered button at least 4.5:1', () => {
    // When
    const ratio = contrast(WHITE, solid('dex-red-deep'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it('should keep the input border at least 3:1 against the panel', () => {
    // When
    const ratio = contrast(solid('dex-field-border'), over('dex-glass', WHITE));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});
