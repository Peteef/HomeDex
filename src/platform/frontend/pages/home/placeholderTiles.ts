import type { TileProps } from '../../components/tile/Tile.tsx';

export type PlaceholderTile = Omit<TileProps, 'pinned' | 'onTogglePin'>;

// Fake sample data until the home screen lists real tiles (work item 4A).
export const PLACEHOLDER_TILES: PlaceholderTile[] = [
  {
    dexNo: 1,
    icon: 'wallet',
    title: 'Finances',
    description: 'Monthly budget and savings',
    href: 'https://example.com/finances',
    external: true,
  },
  {
    dexNo: 2,
    icon: 'hammer',
    title: 'Home renovation',
    href: 'https://example.com/renovation',
    external: true,
  },
  {
    dexNo: 3,
    icon: 'cart',
    title: 'Shopping list',
    description: 'What we need from the shop',
    href: '/m/shopping-list',
  },
  {
    dexNo: 4,
    icon: 'scale',
    title: 'Weight log',
    href: 'https://example.com/weight',
    external: true,
  },
];
