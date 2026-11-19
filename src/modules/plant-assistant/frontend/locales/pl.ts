import type { Translation } from '#platform/frontend';
import type en from './en.ts';

export default {
  manifest: {
    name: 'Zielony Asystent',
    description: 'Które rośliny potrzebują dziś wody',
  },
  main: {
    title: 'Zielony Asystent',
    tabBar: {
      label: 'Widoki',
      today: 'Dziś',
      plants: 'Rośliny',
      calendar: 'Kalendarz',
    },
    viewTabs: {
      label: 'Widoki',
      today: 'Do podlania dziś',
      plants: 'Wszystkie rośliny',
      calendar: 'Kalendarz',
    },
    todayBoard: {
      heading: 'Do podlania dziś',
    },
    plantList: {
      heading: 'Wszystkie rośliny',
    },
    calendarView: {
      heading: 'Najbliższe podlewania',
    },
  },
} as const satisfies Translation<typeof en>;
