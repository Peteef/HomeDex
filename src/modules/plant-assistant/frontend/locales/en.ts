export default {
  manifest: {
    name: 'Plant Assistant',
    description: 'Which plants need water today',
  },
  layout: {
    title: 'Plant Assistant',
    tabBar: {
      label: 'Views',
      plants: 'Plants',
      today: 'Today',
      calendar: 'Calendar',
    },
    viewTabs: {
      label: 'Views',
      plants: 'All plants',
      today: 'To water today',
      calendar: 'Calendar',
    },
  },
  components: {
    urgencyLabel: {
      overdue_one: '{{count}} day overdue',
      overdue_other: '{{count}} days overdue',
      today: 'Today',
      tomorrow: 'Tomorrow',
      inDays_one: 'In {{count}} day',
      inDays_other: 'In {{count}} days',
    },
  },
  allPlants: {
    heading: 'All plants',
    loadFailed: "Can't load the plants.",
    empty: 'No plants yet.',
    emptyHint: "You'll be able to add plants here soon.",
    plantLoadFailed: "Can't load this plant.",
    plantDetails: {
      summer: 'Summer',
      winter: 'Winter',
      everyDay: 'Every day',
      every_one: 'Every {{count}} day',
      every_other: 'Every {{count}} days',
      now: 'now',
      lastWatered: 'Last watered',
      nextWatering: 'Next watering',
    },
  },
  today: {
    heading: 'To water today',
  },
  calendar: {
    heading: 'Upcoming waterings',
  },
} as const;
