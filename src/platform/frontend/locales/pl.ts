import type { Translation } from '../lib/i18n/index.ts';
import type en from './en.ts';

// Written as natural Polish, not word for word. Polish forms change with gender, so the text
// avoids them ("Który Trener tym razem?" rather than addressing "Trenerze").
const pl = {
  common: {
    actions: {
      tryAgain: 'Spróbuj ponownie',
      backToDex: 'Wróć do Dexu',
    },
  },
  components: {
    languageSelect: {
      label: 'Język',
    },
    loadingStatus: {
      loading: 'Wczytywanie…',
    },
    tile: {
      dexNumber: 'Nr {{number}}',
      opensInNewTab: '(otwiera się w nowej karcie)',
      pin: 'Przypnij: {{title}}',
    },
  },
  login: {
    picker: {
      title: 'Który Trener tym razem?',
      loadFailed: 'Nie udało się wczytać Trenerów.',
      empty: 'Nie ma jeszcze żadnego Trenera. Utwórz konto poleceniem <code>{{command}}</code>.',
    },
    password: {
      greeting: 'Cześć, {{username}}!',
      welcomeBack: 'Miło cię znowu widzieć, {{username}}!',
      prompt: 'Udowodnij, że to ty.',
      label: 'Hasło',
      submit: 'Wybieram cię!',
      submitting: 'Logowanie…',
      switchTrainer: 'To nie {{username}}? Zmień Trenera',
    },
    errors: {
      passwordRequired: 'Wpisz hasło.',
      wrongPassword: 'Hasło się nie zgadza. Spróbuj jeszcze raz.',
      tooManyAttempts: 'Zbyt wiele nieudanych prób. Spróbuj ponownie za kilka minut.',
      unexpected: 'Coś poszło nie tak. Spróbuj jeszcze raz.',
    },
  },
  home: {
    greeting: 'Cześć, {{username}}! Czego dziś potrzebujesz?',
    signOut: 'Wyloguj się',
    search: {
      label: 'Znajdź kafelek',
      placeholder: 'Szukaj w Dexie...',
    },
    allEntries: 'Wszystkie wpisy',
  },
  notFound: {
    title: 'Nie ma takiej strony',
    message: 'Pod tym adresem nic nie ma.',
  },
  sessionUnavailable: {
    title: 'Brak połączenia z HomeDex',
    message: 'Sprawdź połączenie i spróbuj ponownie.',
  },
} as const satisfies Translation<typeof en>;

export default pl;
