export type Season = 'summer' | 'winter';

export type Urgency = 'overdue' | 'today' | 'soon' | 'later';

export interface Intervals {
  summerIntervalDays: number;
  winterIntervalDays: number;
}
