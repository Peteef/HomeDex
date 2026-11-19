export default {
  manifest: {
    name: 'Plant Assistant',
    description: 'Which plants need water today',
  },
  main: {
    title: 'Plant Assistant',
    tabBar: {
      label: 'Views',
      today: 'Today',
      plants: 'Plants',
      calendar: 'Calendar',
    },
    viewTabs: {
      label: 'Views',
      today: 'To water today',
      plants: 'All plants',
      calendar: 'Calendar',
    },
    todayBoard: {
      heading: 'To water today',
    },
    plantList: {
      heading: 'All plants',
    },
    calendarView: {
      heading: 'Upcoming waterings',
    },
  },
} as const;
