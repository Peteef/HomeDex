import type { Logger } from '../logger.ts';
import { ModuleError } from './errors.ts';

export type TileBadgeCount = () => number;

export interface TileBadges {
  set: (moduleId: string, count: TileBadgeCount, logger: Logger) => void;
  countOnBadge: (moduleId: string) => number;
}

interface RegisteredBadge {
  count: TileBadgeCount;
  logger: Logger;
}

const safeCount = ({ count, logger }: RegisteredBadge): number => {
  try {
    const value = count();
    return Math.max(value, 0);
  } catch (error) {
    logger.error('The tile badge failed', error);
    return 0;
  }
};

export const tileBadges = (): TileBadges => {
  // Filled while the modules register, after the services that read it were built.
  const badges = new Map<string, RegisteredBadge>();

  const set = (moduleId: string, count: TileBadgeCount, logger: Logger): void => {
    if (badges.has(moduleId)) {
      throw new ModuleError(`Module "${moduleId}" set its tile badge twice`);
    }

    badges.set(moduleId, { count, logger });
  };

  const countOnBadge = (moduleId: string): number => {
    const badge = badges.get(moduleId);
    return badge ? safeCount(badge) : 0;
  };

  return {
    set,
    countOnBadge,
  };
};
