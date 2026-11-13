const en = {
  common: {
    actions: {
      tryAgain: 'Try again',
      backToDex: 'Back to the Dex',
    },
  },
  components: {
    dialog: {
      close: 'Close',
    },
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
      edit: 'Edit {{title}}',
      add: 'Add tile',
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
    results: 'Results',
    tileList: {
      loadFailed: "Can't load the tiles.",
      empty: 'Your Dex is empty.',
      noMatches: 'No tiles match “{{query}}”.',
      holdToEdit: 'Hold a tile to edit it.',
    },
    tileDialog: {
      addTitle: 'Add tile',
      editTitle: 'Edit tile',
    },
    tileForm: {
      title: 'Title',
      description: 'Description (optional)',
      addLanguage: 'Add {{language}}',
      removeLanguage: 'Remove {{language}}',
      url: 'Address',
      urlPlaceholder: 'https://…',
      icon: 'Icon',
      save: 'Save',
      saving: 'Saving…',
      scope: {
        label: 'Who sees it',
        personal: 'Only me',
        shared: 'Shared',
        sharedForGood: 'Shared: everyone can see it.',
      },
      delete: {
        start: 'Delete tile',
        question: 'Delete “{{title}}”?',
        cancel: 'Cancel',
        confirm: 'Delete',
        deleting: 'Deleting…',
      },
      errors: {
        titleRequired: 'Enter a title.',
        urlRequired: 'Enter the address.',
        urlInvalid: 'Enter a web address starting with http:// or https://.',
        saveFailed: "Couldn't save the tile. Try again.",
        deleteFailed: "Couldn't delete the tile. Try again.",
        gone: "This tile was removed or can't be changed anymore.",
      },
      icons: {
        link: 'Link',
        spreadsheet: 'Spreadsheet',
        wallet: 'Wallet',
        home: 'Home',
        hammer: 'Hammer',
        receipt: 'Receipt',
        bank: 'Bank',
        cart: 'Cart',
        scale: 'Scale',
        calendar: 'Calendar',
        health: 'Health',
        car: 'Car',
        plane: 'Plane',
        book: 'Book',
        camera: 'Camera',
        music: 'Music',
        notes: 'Notes',
        food: 'Food',
        work: 'Work',
        star: 'Star',
      },
    },
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
