import manifest from '../../../../manifest.ts';

export type View = 'today' | 'plants' | 'calendar';

export const VIEW_PATHS: Record<View, string> = {
  today: manifest.route,
  plants: `${manifest.route}/plants`,
  calendar: `${manifest.route}/calendar`,
};
