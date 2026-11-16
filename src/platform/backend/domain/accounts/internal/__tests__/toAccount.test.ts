import { describe, expect, it } from 'vitest';
import { toAccount } from '../toAccount.ts';

describe('toAccount', () => {
  it('should map the row to an account without the password hash when given a user row', () => {
    // Given
    const row = {
      id: 7,
      username: 'ash',
      password_hash: 'hash',
      created_at: 1_000,
      archived_at: 2_000,
    };

    // When
    const account = toAccount(row);

    // Then
    expect(account).toEqual({ id: 7, username: 'ash', createdAt: 1_000, archivedAt: 2_000 });
  });
});
