import { accountsService } from './accounts/index.ts';
import type { AccountsService, Argon2Params } from './accounts/index.ts';
import { sessionService } from './auth/index.ts';
import type { SessionService } from './auth/index.ts';
import { tilesService } from './tiles/index.ts';
import type { TileBadge, TilesService } from './tiles/index.ts';
import type { Storage } from '../infrastructure/storage/index.ts';
import { definedProps } from '../../shared/objects/definedProps.ts';

export interface DomainServices {
  accounts: AccountsService;
  sessions: SessionService;
  tiles: TilesService;
}

export interface DomainServicesOptions {
  sessionTtlDays: number;
  argon2Params?: Argon2Params;
  enabledModuleIds?: readonly string[];
  tileBadge?: TileBadge;
  now?: () => number;
}

// The domain layer's single entrypoint: it wires the domains together, so the server and the
// CLI get the same services. Domains never import each other's internals; connections between
// them are made here.
export const domainServices = (
  storage: Storage,
  { sessionTtlDays, argon2Params, enabledModuleIds = [], tileBadge, now }: DomainServicesOptions,
): DomainServices => {
  const sessions = sessionService(storage, {
    ttlDays: sessionTtlDays,
    ...definedProps({ now }),
  });

  const accounts = accountsService(storage, {
    revokeSessions: (userId) => {
      sessions.revokeAllFor(userId);
    },
    ...definedProps({ argon2Params, now }),
  });

  const tiles = tilesService(storage, { enabledModuleIds, ...definedProps({ tileBadge, now }) });

  return {
    accounts,
    sessions,
    tiles,
  };
};
