import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../App.tsx';

const renderAt = (path: string) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
};

describe('App', () => {
  describe('routes', () => {
    it('should show the home placeholder with tiles at /', () => {
      // When
      renderAt('/');

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'HomeDex' })).toBeInTheDocument();
      expect(screen.getByRole('searchbox', { name: 'Find a tile' })).toBeInTheDocument();
      expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    });

    it('should show the login placeholder at /login', () => {
      // When
      renderAt('/login');

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    });

    it('should show the module placeholder at /m/<anything>', () => {
      // When
      renderAt('/m/shopping-list/items');

      // Then
      expect(
        screen.getByRole('heading', { level: 1, name: 'Module not available' }),
      ).toBeInTheDocument();
    });

    it('should show the not-found placeholder when the path is unknown', () => {
      // When
      renderAt('/nowhere');

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    });

    it('should draw the scene behind every screen', () => {
      // When
      renderAt('/login');

      // Then
      expect(document.querySelector('img[src="/media/scene/background.svg"]')).toBeInTheDocument();
    });

    it('should go home when the link on a placeholder is followed', () => {
      // Given
      renderAt('/nowhere');

      // When
      fireEvent.click(screen.getByRole('link', { name: 'Back to the Dex' }));

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'HomeDex' })).toBeInTheDocument();
    });
  });

  describe('home placeholder', () => {
    it('should toggle the pin of one tile without touching the others', () => {
      // Given
      renderAt('/');
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

    it('should unpin a tile when its pin control is clicked twice', () => {
      // Given
      renderAt('/');
      const pin = screen.getByRole('button', { name: 'Pin Finances' });

      // When
      fireEvent.click(pin);
      fireEvent.click(pin);

      // Then
      expect(pin).toHaveAttribute('aria-pressed', 'false');
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
      ]);
    });
  });
});
