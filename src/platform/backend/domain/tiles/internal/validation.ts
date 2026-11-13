import { z } from 'zod';
import { isIconName } from '../../../../shared/icons/iconNames.ts';
import { isLanguage } from '../../../../shared/i18n/languages.ts';
import {
  isWebUrl,
  MAX_TILE_DESCRIPTION_LENGTH,
  MAX_TILE_TITLE_LENGTH,
  MAX_TILE_URL_LENGTH,
} from '../../../../shared/tiles/linkTileRules.ts';
import { TileError } from '../errors.ts';
import { TILE_SCOPES } from '../types.ts';
import type { TileTexts } from '../types.ts';

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(MAX_TILE_TITLE_LENGTH, `Title must be at most ${String(MAX_TILE_TITLE_LENGTH)} characters`);

const descriptionSchema = z
  .string()
  .trim()
  .max(
    MAX_TILE_DESCRIPTION_LENGTH,
    `Description must be at most ${String(MAX_TILE_DESCRIPTION_LENGTH)} characters`,
  )
  .nullable()
  .transform((description) => (description === '' ? null : description));

const textSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(null),
});

const hasOnlyLanguages = (texts: Record<string, unknown>): boolean =>
  Object.keys(texts).every(isLanguage);

const hasAnyText = (texts: Record<string, unknown>): boolean => Object.keys(texts).length > 0;

const textsSchema = z
  .record(z.string(), textSchema)
  .refine(hasOnlyLanguages, 'Unknown language')
  .refine(hasAnyText, 'A title in at least one language is required')
  .transform((texts) => texts as TileTexts);

const urlSchema = z
  .string()
  .trim()
  .max(MAX_TILE_URL_LENGTH, `URL must be at most ${String(MAX_TILE_URL_LENGTH)} characters`)
  .refine(isWebUrl, 'URL must be a web address starting with http:// or https://');

const iconSchema = z.string().refine(isIconName, 'Unknown icon');

export const linkTileSchema = z.object({
  texts: textsSchema,
  icon: iconSchema,
  url: urlSchema,
  scope: z.enum(TILE_SCOPES),
});

export const validate = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new TileError('invalid', result.error.issues[0]?.message ?? 'Invalid tile');
  }

  return result.data;
};
