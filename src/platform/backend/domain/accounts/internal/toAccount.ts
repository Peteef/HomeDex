import type { Account } from '../types.ts';
import type { UserRow } from './userRepository.ts';

export const toAccount = (row: UserRow): Account => {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
};
