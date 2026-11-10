import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { currentUser, setCurrentUser } from '../currentUser.ts';

describe('currentUser', () => {
  it('should return the user when the request was authenticated', () => {
    const req = {} as Request;
    setCurrentUser(req, { id: 1, username: 'ash' });
    expect(currentUser(req)).toEqual({ id: 1, username: 'ash' });
  });

  it('should throw when the request was not authenticated', () => {
    expect(() => currentUser({} as Request)).toThrow('not authenticated');
  });

  it('should keep the users of two requests apart', () => {
    const first = {} as Request;
    const second = {} as Request;
    setCurrentUser(first, { id: 1, username: 'ash' });
    setCurrentUser(second, { id: 2, username: 'misty' });
    expect(currentUser(first).username).toBe('ash');
    expect(currentUser(second).username).toBe('misty');
  });
});
