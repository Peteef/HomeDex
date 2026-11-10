import { accountsService } from './accounts/index.ts';
import type { AccountsService, Argon2Params } from './accounts/index.ts';
import { sessionService } from './auth/index.ts';
import type { SessionService } from './auth/index.ts';
import type { Storage } from '../infrastructure/storage/index.ts';

export interface DomainServices {
  accounts: AccountsService;
  sessions: SessionService;
}

export interface DomainServicesOptions {
  sessionTtlDays: number;
  argon2Params?: Argon2Params;
  now?: () => number;
}

// The domain layer's single entrypoint: it wires the domains together, so the server and the
// CLI get the same services. Domains never import each other's internals; connections between
// them are made here.
export function domainServices(
  storage: Storage,
  { sessionTtlDays, argon2Params, now }: DomainServicesOptions,
): DomainServices {
  const sessions = sessionService(storage, {
    ttlDays: sessionTtlDays,
    ...(now && { now }),
  });
  const accounts = accountsService(storage, {
    revokeSessions: (userId) => {
      sessions.revokeAllFor(userId);
    },
    ...(argon2Params && { argon2Params }),
    ...(now && { now }),
  });
  return {
    accounts,
    sessions,
  };
}
