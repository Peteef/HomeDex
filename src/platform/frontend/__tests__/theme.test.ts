import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIN_TEXT_CONTRAST = 4.5;
const MIN_BORDER_CONTRAST = 3;
const CSS = readFileSync(resolve(process.cwd(), 'src/platform/frontend/index.css'), 'utf8');

type Rgb = [number, number, number];
type Palette = Map<string, string>;

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

const block = (selector: string): string => {
  const start = CSS.indexOf(`${selector} {`);

  if (start === -1) {
    throw new Error(`Missing block ${selector}`);
  }

  return CSS.slice(start, CSS.indexOf('\n}', start));
};

const colourTokens = (css: string): Palette =>
  new Map(
    [...css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name ?? '',
      (value ?? '').trim(),
    ]),
  );

const DAY = colourTokens(block('@theme'));
const NIGHT = new Map([...DAY, ...colourTokens(block(":root[data-time-of-day='night']"))]);

const tokenValue = (palette: Palette, name: string): string => {
  const value = palette.get(name);

  if (value === undefined) {
    throw new Error(`Missing token ${name}`);
  }

  return value;
};

const parseHex = (hex: string): Rgb =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as Rgb;

const solid = (palette: Palette, name: string): Rgb => parseHex(tokenValue(palette, name));

const mix = (foreground: Rgb, alpha: number, background: Rgb): Rgb =>
  background.map((under, i) =>
    Math.round((foreground[i] ?? 0) * alpha + under * (1 - alpha)),
  ) as Rgb;

const over = (palette: Palette, name: string, background: Rgb): Rgb => {
  const match = /rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/.exec(tokenValue(palette, name));

  if (!match) {
    throw new Error(`Token ${name} is not an rgb() with alpha`);
  }

  const foreground = [match[1], match[2], match[3]].map(Number) as Rgb;
  return mix(foreground, Number(match[4]), background);
};

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];
const PANEL_TEXT = ['dex-ink', 'dex-ink-muted', 'dex-red-text'];

describe.each([
  ['day', DAY],
  ['night', NIGHT],
] as const)('%s theme tokens', (_theme, palette) => {
  describe.each([
    ['dark', BLACK],
    ['bright', WHITE],
  ] as const)('text on the glass panel over a %s scene', (_scene, background) => {
    const panel = over(palette, 'dex-glass', background);

    it.each(PANEL_TEXT)('should keep %s at least 4.5:1', (token) => {
      // When
      const ratio = contrast(solid(palette, token), panel);

      // Then
      expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    });

    it('should keep text on a tile card at least 4.5:1', () => {
      // Given
      const card = over(palette, 'dex-card', panel);

      // When
      const ratios = ['dex-ink', 'dex-ink-muted'].map((token) =>
        contrast(solid(palette, token), card),
      );

      // Then
      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      }
    });

    it.each(PANEL_TEXT)('should keep %s at least 4.5:1 on a half-clear surface', (token) => {
      // Given
      const surface = mix(solid(palette, 'dex-surface'), 0.5, panel);

      // When
      const ratio = contrast(solid(palette, token), surface);

      // Then
      expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    });

    it('should keep the input border at least 3:1 against the panel', () => {
      // When
      const ratio = contrast(solid(palette, 'dex-field-border'), panel);

      // Then
      expect(ratio).toBeGreaterThanOrEqual(MIN_BORDER_CONTRAST);
    });
  });

  it.each(PANEL_TEXT)('should keep %s at least 4.5:1 in a dialog', (token) => {
    // When
    const ratio = contrast(solid(palette, token), solid(palette, 'dex-paper'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it.each(['dex-ink', 'dex-ink-muted'])('should keep %s at least 4.5:1 on a surface', (token) => {
    // When
    const ratio = contrast(solid(palette, token), solid(palette, 'dex-surface'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it('should keep white text on the primary button at least 4.5:1', () => {
    // When
    const ratio = contrast(WHITE, solid(palette, 'dex-red'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it('should keep white text on the hovered button at least 4.5:1', () => {
    // When
    const ratio = contrast(WHITE, solid(palette, 'dex-red-deep'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it('should keep the input border at least 3:1 against a dialog', () => {
    // When
    const ratio = contrast(solid(palette, 'dex-field-border'), solid(palette, 'dex-paper'));

    // Then
    expect(ratio).toBeGreaterThanOrEqual(MIN_BORDER_CONTRAST);
  });
});

describe('panel glass', () => {
  const opacity = (palette: Palette): string | undefined =>
    /\/ ([\d.]+)\)/.exec(tokenValue(palette, 'dex-glass'))?.[1];

  it('should be as see-through by night as by day', () => {
    // When / Then
    expect(opacity(NIGHT)).toBe(opacity(DAY));
  });
});
