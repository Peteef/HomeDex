import { screen } from '@testing-library/react';
import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from '../features/auth/index.ts';
import { accountsList, fakeApi, renderApp, signedIn, signedOut } from './helpers.tsx';

const NotesPage = () => {
  const user = useCurrentUser();

  return (
    <Routes>
      <Route index element={<h1>Notes of {user.username}</h1>} />
      <Route path="archive" element={<h1>Archived notes</h1>} />
    </Routes>
  );
};

vi.mock('../features/modules/index.ts', () => ({
  MODULE_PAGES: [
    {
      id: 'notes',
      route: '/m/notes',
      Page: lazy(() => Promise.resolve({ default: NotesPage })),
    },
  ],
  MODULE_TRANSLATIONS: [],
}));

describe('module routes', () => {
  it("should show a module's page at its route for the signed-in user", async () => {
    // Given
    fakeApi({ 'GET /api/auth/me': signedIn() });

    // When
    renderApp('/m/notes');

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Notes of Misty' }),
    ).toBeInTheDocument();
  });

  it("should leave the paths below a module's route to the module", async () => {
    // Given
    fakeApi({ 'GET /api/auth/me': signedIn() });

    // When
    renderApp('/m/notes/archive');

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Archived notes' }),
    ).toBeInTheDocument();
  });

  it('should show the not-found page for a module that does not exist', async () => {
    // Given
    fakeApi({ 'GET /api/auth/me': signedIn() });

    // When
    renderApp('/m/clock');

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
  });

  it('should send a visitor to the login page before showing a module', async () => {
    // Given
    fakeApi({ 'GET /api/auth/me': signedOut(), 'GET /api/auth/accounts': accountsList('Misty') });

    // When
    renderApp('/m/notes');

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: "Who's there, Trainer?" }),
    ).toBeInTheDocument();
  });
});
