import manifest from '../../../../manifest.ts';

export type View = 'today' | 'plants' | 'calendar';

export const VIEWS: View[] = ['plants', 'today', 'calendar'];

export const VIEW_PATHS: Record<View, string> = {
  today: `${manifest.route}/today`,
  plants: manifest.route,
  calendar: `${manifest.route}/calendar`,
};
