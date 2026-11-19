import type { Translation } from '#platform/frontend';
import type en from './en.ts';

export default {
  manifest: {
    name: 'Zielony Asystent',
    description: 'Które rośliny potrzebują dziś wody',
  },
  layout: {
    title: 'Zielony Asystent',
    tabBar: {
      label: 'Widoki',
      plants: 'Rośliny',
      today: 'Dziś',
      calendar: 'Kalendarz',
    },
    viewTabs: {
      label: 'Widoki',
      plants: 'Wszystkie rośliny',
      today: 'Do podlania dziś',
      calendar: 'Kalendarz',
    },
  },
  allPlants: {
    heading: 'Wszystkie rośliny',
  },
  today: {
    heading: 'Do podlania dziś',
  },
  calendar: {
    heading: 'Najbliższe podlewanie',
  },
} as const satisfies Translation<typeof en>;
