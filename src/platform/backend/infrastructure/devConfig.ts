import type { Config } from './config.ts';

// Credentials of the development test user (scripts/dev-user.ts). They must never reach a
// production environment, so their presence there stops the server.
export const DEV_USER_VARIABLES = ['DEV_USERNAME', 'DEV_PASSWORD'] as const;

export const rejectDevUserInProduction = (config: Config, env: NodeJS.ProcessEnv): void => {
  const present = DEV_USER_VARIABLES.filter((name) => env[name] !== undefined);
  if (config.NODE_ENV === 'production' && present.length > 0) {
    throw new Error(
      `Invalid configuration: ${present.join(', ')} are for development only, remove them from the production environment`,
    );
  }
};
