import { accountsService } from './accounts/index.ts';
import type { AccountsService, ScryptParams } from './accounts/index.ts';
import { sessionService } from './auth/index.ts';
import type { SessionService } from './auth/index.ts';
import type { Config } from './config.ts';
import type { Storage } from './storage/index.ts';

export interface Services {
  accounts: AccountsService;
  sessions: SessionService;
}

export interface ServiceOverrides {
  scryptParams?: ScryptParams;
  now?: () => number;
}

// The one place that wires the domains together, shared by the server and the CLI.
export function services(
  storage: Storage,
  config: Config,
  { scryptParams, now }: ServiceOverrides = {},
): Services {
  const sessions = sessionService(storage, {
    ttlDays: config.SESSION_TTL_DAYS,
    ...(now && { now }),
  });
  const accounts = accountsService(storage, {
    revokeSessions: (userId) => {
      sessions.revokeAllFor(userId);
    },
    ...(scryptParams && { scryptParams }),
    ...(now && { now }),
  });
  return { accounts, sessions };
}
