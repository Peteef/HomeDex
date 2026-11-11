import { notes } from './domain/notes/index.ts';
import { routes } from './routes/notes.ts';
import manifest from '../manifest.ts';
import { api } from '#platform/backend';
import { sharedApi } from '#platform/shared';
export const ok = [notes, routes, manifest, api, sharedApi];
