import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  fakeApi,
  signedIn,
  TEST_USER,
  testQueryClient,
  withProviders,
} from '../../__tests__/helpers.tsx';
import { useLogin, useLogout } from '../session.ts';

const SESSION_KEY = ['session'];
const OTHER_USER = { id: 2, username: 'Brock' };

const renderWith = <T,>(hook: () => T, queryClient = testQueryClient()) => {
  const { result } = renderHook(hook, {
    wrapper: ({ children }) => withProviders(children, { queryClient }),
  });
  return {
    result,
    queryClient,
  };
};

describe('session', () => {
  describe('useLogin', () => {
    it('should store the new user and drop data cached for the previous one', async () => {
      // Given
      fakeApi({ 'POST /api/auth/login': signedIn(OTHER_USER) });
      const queryClient = testQueryClient();
      queryClient.setQueryData(['tiles'], ['private tile']);
      const { result } = renderWith(useLogin, queryClient);

      // When
      result.current.mutate({ username: 'Brock', password: 'fake-password' });

      // Then
      await waitFor(() => {
        expect(queryClient.getQueryData(SESSION_KEY)).toEqual(OTHER_USER);
      });
      expect(queryClient.getQueryData(['tiles'])).toBeUndefined();
    });
  });

  describe('useLogout', () => {
    it('should clear the session and every cached query', async () => {
      // Given
      fakeApi({ 'POST /api/auth/logout': { status: 204 } });
      const queryClient = testQueryClient();
      queryClient.setQueryData(SESSION_KEY, TEST_USER);
      queryClient.setQueryData(['tiles'], ['private tile']);
      const { result } = renderWith(useLogout, queryClient);

      // When
      result.current.mutate();

      // Then
      await waitFor(() => {
        expect(queryClient.getQueryData(SESSION_KEY)).toBeNull();
      });
      expect(queryClient.getQueryData(['tiles'])).toBeUndefined();
    });
  });
});
