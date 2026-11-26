import type { PlantSummary } from './types.ts';

// One definition of "due" for the Today board and the badge (PRD R10).
export const isDue = ({ daysUntil }: PlantSummary): boolean => daysUntil <= 0;
