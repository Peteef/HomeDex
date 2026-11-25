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
  components: {
    urgencyLabel: {
      overdue_one: '{{count}} dzień po terminie',
      overdue_few: '{{count}} dni po terminie',
      overdue_many: '{{count}} dni po terminie',
      overdue_other: '{{count}} dnia po terminie',
      today: 'Dziś',
      tomorrow: 'Jutro',
      inDays_one: 'Za {{count}} dzień',
      inDays_few: 'Za {{count}} dni',
      inDays_many: 'Za {{count}} dni',
      inDays_other: 'Za {{count}} dnia',
    },
  },
  allPlants: {
    heading: 'Wszystkie rośliny',
    loadFailed: 'Nie udało się wczytać roślin.',
    empty: 'Nie ma jeszcze roślin.',
    emptyHint: 'Wkrótce dodasz tu rośliny.',
    plantLoadFailed: 'Nie udało się wczytać tej rośliny.',
    plantDetails: {
      summer: 'Lato',
      winter: 'Zima',
      everyDay: 'Codziennie',
      every_one: 'Co {{count}} dzień',
      every_few: 'Co {{count}} dni',
      every_many: 'Co {{count}} dni',
      every_other: 'Co {{count}} dnia',
      now: 'teraz',
      lastWatered: 'Ostatnie podlewanie',
      nextWatering: 'Następne podlewanie',
    },
  },
  today: {
    heading: 'Do podlania dziś',
  },
  calendar: {
    heading: 'Najbliższe podlewanie',
  },
} as const satisfies Translation<typeof en>;
