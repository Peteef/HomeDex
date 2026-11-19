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
  allPlants: {
    heading: 'All plants',
  },
  today: {
    heading: 'To water today',
  },
  calendar: {
    heading: 'Upcoming waterings',
  },
} as const;
