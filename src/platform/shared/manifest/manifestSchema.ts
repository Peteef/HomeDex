import { z } from 'zod';
import { ICON_NAMES } from '../icons/iconNames.ts';

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const KEYWORD = /^[a-z]+$/;
const MODULE_ROUTE_PREFIX = '/m/';

const quickActionSchema = z.strictObject({
  id: z.string().regex(KEBAB_CASE, 'must be kebab-case'),
  keyword: z.string().regex(KEYWORD, 'must be one lowercase word'),
});

export const manifestSchema = z
  .strictObject({
    id: z.string().regex(KEBAB_CASE, 'must be kebab-case'),
    icon: z.enum(ICON_NAMES),
    route: z.string(),
    enabled: z.boolean(),
    quickActions: z.array(quickActionSchema).exactOptional(),
  })
  .refine((manifest) => manifest.route === `${MODULE_ROUTE_PREFIX}${manifest.id}`, {
    path: ['route'],
    message: `must be ${MODULE_ROUTE_PREFIX}<id>`,
  });

export type ModuleManifest = z.infer<typeof manifestSchema>;
export type QuickAction = z.infer<typeof quickActionSchema>;
