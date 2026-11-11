import { Router } from 'express';
import { currentUser } from '../http/auth/currentUser.ts';
import { logger } from '../logger.ts';
import type { Logger } from '../logger.ts';
import type { Storage } from '../storage/index.ts';
import type { ModuleContext } from './types.ts';

const moduleLogger = (id: string): Logger => {
  const prefix = `[${id}]`;

  const info = (message: string, ...details: unknown[]): void => {
    logger.info(`${prefix} ${message}`, ...details);
  };

  const warn = (message: string, ...details: unknown[]): void => {
    logger.warn(`${prefix} ${message}`, ...details);
  };

  const error = (message: string, ...details: unknown[]): void => {
    logger.error(`${prefix} ${message}`, ...details);
  };

  return {
    info,
    warn,
    error,
  };
};

export const moduleContext = (id: string, storage: Storage): ModuleContext => ({
  id,
  router: Router(),
  storage,
  currentUser,
  logger: moduleLogger(id),
});
