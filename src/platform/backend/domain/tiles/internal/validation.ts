import { z } from 'zod';
import { isIconName } from '../../../../shared/icons/iconNames.ts';
import { TileError } from '../errors.ts';
import { TILE_SCOPES } from '../types.ts';

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 140;
const MAX_URL_LENGTH = 2048;
const WEB_PROTOCOLS = ['http:', 'https:'];

const isWebUrl = (value: string): boolean =>
  URL.canParse(value) && WEB_PROTOCOLS.includes(new URL(value).protocol);

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(MAX_TITLE_LENGTH, `Title must be at most ${String(MAX_TITLE_LENGTH)} characters`);

const descriptionSchema = z
  .string()
  .trim()
  .max(
    MAX_DESCRIPTION_LENGTH,
    `Description must be at most ${String(MAX_DESCRIPTION_LENGTH)} characters`,
  )
  .nullable()
  .transform((description) => (description === '' ? null : description));

const urlSchema = z
  .string()
  .trim()
  .max(MAX_URL_LENGTH, `URL must be at most ${String(MAX_URL_LENGTH)} characters`)
  .refine(isWebUrl, 'URL must be a web address starting with http:// or https://');

const iconSchema = z.string().refine(isIconName, 'Unknown icon');

export const linkTileSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(null),
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
