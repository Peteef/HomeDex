import manifest from '../manifest.ts';

export type View = 'plants' | 'today' | 'calendar';

export const VIEWS: View[] = ['plants', 'today', 'calendar'];

export const VIEW_PATHS: Record<View, string> = {
  plants: manifest.route,
  today: `${manifest.route}/today`,
  calendar: `${manifest.route}/calendar`,
};
