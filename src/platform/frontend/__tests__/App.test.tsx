import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { accountsList, fakeApi, renderApp, signedIn, signedOut, status } from './helpers.tsx';

const GREETING = 'Hello Misty! What do you need today?';

const renderAt = async (path: string) => {
  fakeApi({ 'GET /api/auth/me': signedIn() });
  renderApp(path);
  await screen.findByRole('heading', { level: 1 });
};

describe('App', () => {
  describe('routes', () => {
    it('should greet the user by name on the home screen at /', async () => {
      // When
      await renderAt('/');

      // Then
      expect(screen.getByRole('heading', { level: 1, name: GREETING })).toBeInTheDocument();
      expect(screen.getByRole('searchbox', { name: 'Find a tile' })).toBeInTheDocument();
      expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    });

    it('should show the login page at /login when nobody is signed in', async () => {
      // Given
      fakeApi({ 'GET /api/auth/me': signedOut(), 'GET /api/auth/accounts': accountsList('Misty') });

      // When
      renderApp('/login');

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: "Who's there, Trainer?" }),
      ).toBeInTheDocument();
    });

    it('should show the module placeholder at /m/<anything>', async () => {
      // When
      await renderAt('/m/shopping-list/items');

      // Then
      expect(
        screen.getByRole('heading', { level: 1, name: 'Module not available' }),
      ).toBeInTheDocument();
    });

    it('should show the not-found placeholder when the path is unknown', async () => {
      // When
      await renderAt('/nowhere');

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    });

    it('should draw the scene behind every screen', async () => {
      // When
      await renderAt('/login');

      // Then
      expect(document.querySelector('img[src="/media/scene/background.svg"]')).toBeInTheDocument();
    });

    it('should go home when the link on a placeholder is followed', async () => {
      // Given
      await renderAt('/nowhere');

      // When
      fireEvent.click(screen.getByRole('link', { name: 'Back to the Dex' }));

      // Then
      expect(screen.getByRole('heading', { level: 1, name: GREETING })).toBeInTheDocument();
    });
  });

  describe('home placeholder', () => {
    it('should toggle the pin of one tile without touching the others', async () => {
      // Given
      await renderAt('/');
      const pin = screen.getByRole('button', { name: 'Pin Finances' });

      // When
      fireEvent.click(pin);

      // Then
      expect(pin).toHaveAttribute('aria-pressed', 'true');

      expect(screen.getByRole('button', { name: 'Pin Weight log' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('should move a pinned tile to the front and back when it is unpinned', async () => {
      // Given
      await renderAt('/');
      const firstTile = () => screen.getAllByRole('article')[0];

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Pin Weight log' }));

      // Then
      expect(firstTile()).toHaveTextContent('Weight log');
      fireEvent.click(screen.getByRole('button', { name: 'Pin Weight log' }));
      expect(firstTile()).toHaveTextContent('Finances');
    });

    it('should unpin a tile when its pin control is clicked twice', async () => {
      // Given
      await renderAt('/');
      const pin = screen.getByRole('button', { name: 'Pin Finances' });

      // When
      fireEvent.click(pin);
      fireEvent.click(pin);

      // Then
      expect(pin).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('route guard', () => {
    it('should send a visitor to the login page when nobody is signed in', async () => {
      // Given
      fakeApi({ 'GET /api/auth/me': signedOut(), 'GET /api/auth/accounts': accountsList('Misty') });

      // When
      renderApp('/');

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: "Who's there, Trainer?" }),
      ).toBeInTheDocument();
    });

    it('should guard module screens and unknown paths too', async () => {
      // Given
      fakeApi({ 'GET /api/auth/me': signedOut(), 'GET /api/auth/accounts': accountsList('Misty') });

      // When
      renderApp('/nowhere');

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: "Who's there, Trainer?" }),
      ).toBeInTheDocument();
    });

    it('should show only a loading status while the session is checked', () => {
      // Given
      fakeApi({ 'GET /api/auth/me': () => new Promise(() => undefined) });

      // When
      renderApp('/');

      // Then
      expect(screen.getByRole('status')).toHaveTextContent('Loading…');
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should offer a retry when the server cannot be reached', async () => {
      // Given
      let reachable = false;
      fakeApi({ 'GET /api/auth/me': () => (reachable ? signedIn() : status(503)) });
      renderApp('/');
      const retry = await screen.findByRole('button', { name: 'Try again' });
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Can't reach HomeDex");

      // When
      reachable = true;
      fireEvent.click(retry);

      // Then
      expect(await screen.findByRole('heading', { level: 1, name: GREETING })).toBeInTheDocument();
    });
  });

  describe('sign out', () => {
    it('should sign out and show the login page when the sign-out button is pressed', async () => {
      // Given
      const api = fakeApi({
        'GET /api/auth/me': signedIn(),
        'POST /api/auth/logout': { status: 204 },
        'GET /api/auth/accounts': accountsList('Misty'),
      });

      renderApp('/');
      const signOut = await screen.findByRole('button', { name: 'Sign out' });

      // When
      fireEvent.click(signOut);

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: "Who's there, Trainer?" }),
      ).toBeInTheDocument();

      expect(api.callsTo('POST /api/auth/logout')).toHaveLength(1);
    });
  });

  describe('import aliases', () => {
    it('should resolve #platform/frontend through package.json imports', async () => {
      // When
      const api = await import('#platform/frontend');

      // Then
      expect(Object.keys(api).sort()).toEqual([
        'Button',
        'ICON_NAMES',
        'Icon',
        'IconButton',
        'Panel',
        'TextInput',
        'useCurrentUser',
      ]);
    });
  });
});
