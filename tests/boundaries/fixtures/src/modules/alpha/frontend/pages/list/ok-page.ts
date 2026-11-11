import { page } from './ListPage.ts';
import { row } from '../../components/row/Row.ts';
import { items } from '../../features/items/index.ts';
import manifest from '../../../manifest.ts';
import { frontendApi } from '#platform/frontend';
export const ok = [page, row, items, manifest, frontendApi];
