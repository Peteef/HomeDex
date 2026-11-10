import type { Request } from 'express';
import type { CurrentUser } from '../../../domain/auth/index.ts';

const users = new WeakMap<Request, CurrentUser>();

export function setCurrentUser(req: Request, user: CurrentUser): void {
  users.set(req, user);
}

// Only valid in routes mounted behind requireAuth.
export function currentUser(req: Request): CurrentUser {
  const user = users.get(req);
  if (!user) throw new Error('currentUser() was called on a request that is not authenticated');
  return user;
}
