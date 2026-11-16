import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useCurrentUser } from '../features/auth/index.ts';
import { RequireAuth } from '../RequireAuth.tsx';
import { fakeApi, signedIn, signedOut, status, withProviders } from './helpers.tsx';

const SESSION = 'GET /api/auth/me';

const Secret = () => <p>{useCurrentUser().username}</p>;

const LoginProbe = () => <p>{JSON.stringify(useLocation().state)}</p>;

const renderSecret = () =>
  render(
    withProviders(
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/secret" element={<Secret />} />
        </Route>
        <Route path="/login" element={<LoginProbe />} />
      </Routes>,
      { path: '/secret' },
    ),
  );

describe('RequireAuth', () => {
  it('should show the loading status when the session is being read', () => {
    // Given
    fakeApi({ [SESSION]: () => new Promise(() => undefined) });

    // When
    renderSecret();

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('should show the page and give it the user when signed in', async () => {
    // Given
    fakeApi({ [SESSION]: signedIn() });

    // When
    renderSecret();

    // Then
    expect(await screen.findByText('Misty')).toBeInTheDocument();
  });

  it('should send the visitor to the login page and remember the requested path when signed out', async () => {
    // Given
    fakeApi({ [SESSION]: signedOut() });

    // When
    renderSecret();

    // Then
    expect(await screen.findByText('{"from":"/secret"}')).toBeInTheDocument();
  });

  it("should show that HomeDex can't be reached when the session cannot be read", async () => {
    // Given
    fakeApi({ [SESSION]: status(500) });

    // When
    renderSecret();

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: "Can't reach HomeDex" }),
    ).toBeInTheDocument();
  });

  it('should read the session again when Try again is pressed', async () => {
    // Given
    const api = fakeApi({ [SESSION]: status(500) });
    renderSecret();
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    const callsBefore = api.callsTo(SESSION).length;

    // When
    fireEvent.click(tryAgain);

    // Then
    await waitFor(() => {
      expect(api.callsTo(SESSION).length).toBeGreaterThan(callsBefore);
    });
  });
});
