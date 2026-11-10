export type AccountErrorCode = 'invalid' | 'taken' | 'not_found' | 'archived';

export interface Account {
  id: number;
  username: string;
  createdAt: number;
  archivedAt: number | null;
}

export interface AccountEdit {
  username?: string;
  password?: string;
}
