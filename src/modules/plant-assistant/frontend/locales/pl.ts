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
    tagChip: {
      remove: 'Usuń {{tag}}',
    },
  },
  allPlants: {
    heading: 'Wszystkie rośliny',
    loadFailed: 'Nie udało się wczytać roślin.',
    add: 'Dodaj roślinę',
    empty: 'Nie ma jeszcze roślin.',
    emptyHint: 'Pierwszą dodasz przyciskiem „Dodaj roślinę”.',
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
      edit: 'Edytuj',
      delete: 'Usuń',
    },
    addPlantForm: {
      title: 'Nowa roślina',
      lastWatered: 'Ostatnie podlewanie',
    },
    editPlantForm: {
      title: 'Edycja: {{name}}',
      nextWatering: 'Następne podlewanie',
    },
    plantForm: {
      name: 'Nazwa',
      description: 'Opis',
      interval: 'Podlewanie co',
      summer: 'Latem',
      winter: 'Zimą',
      days: 'dni',
      save: 'Zapisz',
      saving: 'Zapisywanie…',
      failed: 'Nie udało się zapisać rośliny. Spróbuj ponownie.',
      errors: {
        nameRequired: 'Wpisz nazwę.',
        nameTooLong: 'Maksymalnie 60 znaków.',
        descriptionTooLong: 'Maksymalnie 1000 znaków.',
        intervalInvalid: 'Wpisz pełne dni, od 1 do 365.',
        dateRequired: 'Wybierz datę.',
        dateInFuture: 'Ta data nie może być w przyszłości.',
        dateInPast: 'Wybierz dzisiejszą lub późniejszą datę.',
      },
    },
    tagsInput: {
      label: 'Tagi',
      newTag: 'Nowy tag',
      add: 'Dodaj',
      notes: {
        tagTooLong: 'Tag może mieć maksymalnie 30 znaków.',
        tagDuplicate: 'Ten tag już jest na liście.',
        tooManyTags: 'Roślina może mieć maksymalnie 10 tagów.',
      },
    },
    deleteConfirmation: {
      title: 'Usunąć {{name}}?',
      warning: 'Razem z nią zniknie historia podlewania. Tego nie da się cofnąć.',
      delete: 'Usuń',
      deleting: 'Usuwanie…',
      cancel: 'Anuluj',
      failed: 'Nie udało się usunąć rośliny. Spróbuj ponownie.',
    },
  },
  today: {
    heading: 'Do podlania dziś',
  },
  calendar: {
    heading: 'Najbliższe podlewanie',
  },
} as const satisfies Translation<typeof en>;
