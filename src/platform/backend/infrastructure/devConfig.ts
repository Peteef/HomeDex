import type { Config } from './config.ts';

// Variables starting with DEV_ are reserved for local development (for example the test user of
// scripts/dev-user.ts). They must never reach a production environment, so any of them there
// stops the server.
export const DEV_CONFIG_PREFIX = 'DEV_';

export const rejectDevConfigInProduction = (config: Config, env: NodeJS.ProcessEnv): void => {
  const present = Object.keys(env)
    .filter((name) => name.startsWith(DEV_CONFIG_PREFIX))
    .sort();

  if (config.NODE_ENV === 'production' && present.length > 0) {
    throw new Error(
      `Invalid configuration: ${present.join(', ')} are for development only, remove them from the production environment`,
    );
  }
};
