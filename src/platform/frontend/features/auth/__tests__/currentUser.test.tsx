import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEST_USER } from '../../../__tests__/helpers.tsx';
import { CurrentUserContext, useCurrentUser } from '../currentUser.ts';

describe('useCurrentUser', () => {
  it('should return the user given by the route guard', () => {
    // When
    const { result } = renderHook(useCurrentUser, {
      wrapper: ({ children }) => (
        <CurrentUserContext value={TEST_USER}>{children}</CurrentUserContext>
      ),
    });

    // Then
    expect(result.current).toEqual(TEST_USER);
  });

  it('should throw when it is used outside the screens behind the login', () => {
    // When / Then
    expect(() => renderHook(useCurrentUser)).toThrow(/behind the login/);
  });
});
