export default {
  manifest: {
    name: 'Plant Assistant',
    description: 'Which plants need water today',
  },
  main: {
    title: 'Plant Assistant',
    views: 'Views',
    rightColumn: 'Plants or calendar',
    today: 'Today',
    plants: 'Plants',
    calendar: 'Calendar',
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
