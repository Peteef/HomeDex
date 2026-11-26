import type { Logger } from '../logger.ts';
import { ModuleError } from './errors.ts';

export type TileBadgeCount = () => number;

export interface TileBadges {
  set: (moduleId: string, count: TileBadgeCount, logger: Logger) => void;
  badgeOf: (moduleId: string) => number | null;
}

interface RegisteredBadge {
  count: TileBadgeCount;
  logger: Logger;
}

const countOf = ({ count, logger }: RegisteredBadge): number | null => {
  try {
    const value = count();
    return value > 0 ? value : null;
  } catch (error) {
    logger.error('The tile badge failed', error);
    return null;
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

  const badgeOf = (moduleId: string): number | null => {
    const badge = badges.get(moduleId);
    return badge ? countOf(badge) : null;
  };

  return {
    set,
    badgeOf,
  };
};
