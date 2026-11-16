import { fireEvent, render, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useCurrentUser } from '../features/auth/index.ts';
import { RequireAuth } from '../RequireAuth.tsx';
import { fakeApi, signedIn, signedOut, status, withProviders } from './helpers.tsx';

const SESSION = 'GET /api/auth/me';
const BROCK = { id: 2, username: 'Brock' };

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
    fakeApi({ [SESSION]: signedIn(BROCK) });

    // When
    renderSecret();

    // Then
    expect(await screen.findByText('Brock')).toBeInTheDocument();
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

  it('should show the page when Try again is pressed and the session can be read again', async () => {
    // Given
    const server = { reachable: false };
    fakeApi({ [SESSION]: () => (server.reachable ? signedIn(BROCK) : status(500)) });
    renderSecret();
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    server.reachable = true;

    // When
    fireEvent.click(tryAgain);

    // Then
    expect(await screen.findByText('Brock')).toBeInTheDocument();
  });
});
