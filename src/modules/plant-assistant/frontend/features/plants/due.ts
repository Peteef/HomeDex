import type { PlantSummary } from './types.ts';

export const isDue = ({ daysUntil }: PlantSummary): boolean => daysUntil <= 0;
