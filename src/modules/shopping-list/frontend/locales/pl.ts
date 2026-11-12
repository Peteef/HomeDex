import type { Translation } from '#platform/frontend';
import type en from './en.ts';

export default {
  manifest: {
    name: 'Lista zakupów',
    description: 'Czego potrzebujemy ze sklepu',
  },
  list: {
    title: 'Lista zakupów',
    back: 'Wróć do Dexu',
    toBuy: 'Do kupienia',
    inCart: 'W koszyku',
    clear: 'Wyczyść',
    empty: 'Nic do kupienia. Dodaj pierwszą rzecz powyżej.',
    loading: 'Wczytywanie listy…',
    loadFailed: 'Nie udało się wczytać listy.',
    tryAgain: 'Spróbuj ponownie',
    addItemForm: {
      item: 'Produkt',
      itemPlaceholder: 'np. mleko',
      amount: 'Ilość (opcjonalnie)',
      amountPlaceholder: 'np. 2 l',
      add: 'Dodaj',
      failed: 'Nie udało się dodać produktu. Spróbuj ponownie.',
    },
    itemRow: {
      addedBy: 'Dodane przez: {{username}}',
      delete: 'Usuń: {{item}}',
    },
  },
} as const satisfies Translation<typeof en>;
