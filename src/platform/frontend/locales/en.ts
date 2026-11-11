const en = {
  common: {
    actions: {
      tryAgain: 'Try again',
      backToDex: 'Back to the Dex',
    },
  },
  components: {
    languageSelect: {
      label: 'Language',
    },
    loadingStatus: {
      loading: 'Loading…',
    },
    tile: {
      dexNumber: 'No. {{number}}',
      opensInNewTab: '(opens in a new tab)',
      pin: 'Pin {{title}}',
    },
  },
  login: {
    picker: {
      title: "Who's there, Trainer?",
      loadFailed: "Can't load the Trainers.",
      empty: 'No Trainers yet. Create an account with <code>{{command}}</code>.',
    },
    password: {
      greeting: 'Hi, {{username}}!',
      welcomeBack: 'Welcome back, {{username}}!',
      prompt: "Prove it's you.",
      label: 'Password',
      submit: 'I choose you!',
      submitting: 'Signing in…',
      switchTrainer: 'Not {{username}}? Switch Trainer',
    },
    errors: {
      passwordRequired: 'Enter your password.',
      wrongPassword: "That's not the right password. Try again.",
      tooManyAttempts: 'Too many failed attempts. Try again in a few minutes.',
      unexpected: 'Something went wrong. Try again.',
    },
  },
  home: {
    greeting: 'Hello {{username}}! What do you need today?',
    signOut: 'Sign out',
    search: {
      label: 'Find a tile',
      placeholder: 'Search the Dex...',
    },
    allEntries: 'All entries',
  },
  notFound: {
    title: 'Page not found',
    message: 'There is nothing at this address.',
  },
  sessionUnavailable: {
    title: "Can't reach HomeDex",
    message: 'Check your connection and try again.',
  },
} as const;

export default en;
