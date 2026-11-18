import { fireEvent, screen } from '@testing-library/react';
import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from '../features/auth/index.ts';
import {
  accountsList,
  fakeApi,
  fixClockAt,
  ok,
  renderApp,
  signedIn,
  signedOut,
} from './helpers.tsx';

const NotesPage = () => {
  const user = useCurrentUser();

  return (
    <Routes>
      <Route index element={<h1>Notes of {user.username}</h1>} />
      <Route path="archive" element={<h1>Archived notes</h1>} />
    </Routes>
  );
};

const BrokenPage = () => {
  throw new Error('boom');
};

vi.mock('../features/modules/index.ts', () => ({
  MODULE_PAGES: [
    {
      id: 'notes',
      route: '/m/notes',
      Page: lazy(() => Promise.resolve({ default: NotesPage })),
    },
    {
      id: 'broken',
      route: '/m/broken',
      Page: lazy(() => Promise.resolve({ default: BrokenPage })),
    },
  ],
  MODULE_TRANSLATIONS: [],
}));

describe('module routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("should keep the rest of the app working when a module's page crashes", async () => {
    // Given
    fixClockAt(10);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fakeApi({ 'GET /api/auth/me': signedIn(), 'GET /api/tiles': ok({ tiles: [] }) });
    renderApp('/m/broken');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page hit a problem' }),
    ).toBeInTheDocument();

    // When
    fireEvent.click(screen.getByRole('link', { name: 'Back to the Dex' }));

    // Then
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Good morning, Misty! What do you need today?',
      }),
    ).toBeInTheDocument();
  });
});
