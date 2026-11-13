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
    dialog: {
      close: 'Zamknij',
    },
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
      edit: 'Edytuj: {{title}}',
      add: 'Dodaj kafelek',
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
    results: 'Wyniki',
    tileList: {
      loadFailed: 'Nie udało się wczytać kafelków.',
      empty: 'Twój Dex jest pusty.',
      noMatches: 'Żaden kafelek nie pasuje do „{{query}}”.',
      holdToEdit: 'Przytrzymaj kafelek, aby go edytować.',
    },
    tileDialog: {
      addTitle: 'Dodaj kafelek',
      editTitle: 'Edytuj kafelek',
    },
    tileForm: {
      title: 'Tytuł',
      description: 'Opis (opcjonalnie)',
      addLanguage: 'Dodaj {{language}}',
      removeLanguage: 'Usuń {{language}}',
      url: 'Adres',
      urlPlaceholder: 'https://…',
      icon: 'Ikona',
      save: 'Zapisz',
      saving: 'Zapisywanie…',
      scope: {
        label: 'Kto go widzi',
        personal: 'Tylko ja',
        shared: 'Wspólny',
        sharedForGood: 'Wspólny: widzą go wszyscy.',
      },
      delete: {
        start: 'Usuń kafelek',
        question: 'Usunąć „{{title}}”?',
        cancel: 'Anuluj',
        confirm: 'Usuń',
        deleting: 'Usuwanie…',
      },
      errors: {
        titleRequired: 'Wpisz tytuł.',
        urlRequired: 'Wpisz adres.',
        urlInvalid: 'Wpisz adres strony zaczynający się od http:// lub https://.',
        saveFailed: 'Nie udało się zapisać kafelka. Spróbuj ponownie.',
        deleteFailed: 'Nie udało się usunąć kafelka. Spróbuj ponownie.',
        gone: 'Ten kafelek został usunięty albo nie można go już zmienić.',
      },
      icons: {
        link: 'Link',
        spreadsheet: 'Arkusz',
        wallet: 'Portfel',
        home: 'Dom',
        hammer: 'Młotek',
        receipt: 'Paragon',
        bank: 'Bank',
        cart: 'Koszyk',
        scale: 'Waga',
        calendar: 'Kalendarz',
        health: 'Zdrowie',
        car: 'Samochód',
        plane: 'Samolot',
        book: 'Książka',
        camera: 'Aparat',
        music: 'Muzyka',
        notes: 'Notatki',
        food: 'Jedzenie',
        work: 'Praca',
        star: 'Gwiazdka',
      },
    },
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
