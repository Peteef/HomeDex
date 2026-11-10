export interface CurrentUser {
  id: number;
  username: string;
}

export interface IssuedSession {
  token: string;
  expiresAt: number;
}

export interface ResolvedSession {
  user: CurrentUser;
  // Set when the expiry was just extended, so the cookie can be renewed too.
  renewedUntil: number | null;
}
