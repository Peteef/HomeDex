import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { currentUser, setCurrentUser } from '../currentUser.ts';

describe('currentUser', () => {
  it('should return the user when the request was authenticated', () => {
    // Given
    const req = {} as unknown as Request;
    setCurrentUser(req, { id: 1, username: 'ash' });

    // When
    const user = currentUser(req);

    // Then
    expect(user).toEqual({ id: 1, username: 'ash' });
  });

  it('should throw when the request was not authenticated', () => {
    // When / Then
    expect(() => currentUser({} as unknown as Request)).toThrow('not authenticated');
  });

  it('should keep the users of two requests apart', () => {
    // Given
    const first = {} as unknown as Request;
    const second = {} as unknown as Request;

    // When
    setCurrentUser(first, { id: 1, username: 'ash' });
    setCurrentUser(second, { id: 2, username: 'misty' });

    // Then
    expect(currentUser(first).username).toBe('ash');
    expect(currentUser(second).username).toBe('misty');
  });
});
