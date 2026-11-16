import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { accountsList, fakeApi, status, withProviders } from '../../../__tests__/helpers.tsx';
import { useAccounts } from '../accounts.ts';

const ACCOUNTS = 'GET /api/auth/accounts';

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

describe('useAccounts', () => {
  it('should return the accounts when the request succeeds', async () => {
    // Given
    fakeApi({ [ACCOUNTS]: accountsList('Brock', 'Misty') });

    // When
    const { result } = renderHook(useAccounts, { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.data).toEqual([{ username: 'Brock' }, { username: 'Misty' }]);
    });
  });

  it('should be in the error state without a retry when the request fails with 400', async () => {
    // Given
    const api = fakeApi({ [ACCOUNTS]: status(400) });

    // When
    const { result } = renderHook(useAccounts, { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(api.callsTo(ACCOUNTS)).toHaveLength(1);
  });
});
