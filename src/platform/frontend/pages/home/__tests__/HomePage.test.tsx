import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { fakeApi, ok, renderApp, signedIn, status } from '../../../__tests__/helpers.tsx';
import type { FakeResponse } from '../../../__tests__/helpers.tsx';
import { linkTile, moduleTile } from '../../../__tests__/tiles.ts';
import type { Tile } from '../../../features/tiles/index.ts';

const FINANCES = linkTile(
  {
    en: { title: 'Finances', description: 'Monthly budget' },
    pl: { title: 'Finanse', description: 'Budżet miesięczny' },
  },
  { id: 1, dexNo: 1, url: 'https://docs.example.com/finances' },
);

const WEIGHT = linkTile(
  { en: { title: 'Weight log', description: null } },
  { id: 2, dexNo: 2, url: 'https://docs.example.com/weight' },
);

const SHOPPING = linkTile(
  {
    en: { title: 'Shopping', description: null },
    pl: { title: 'Zakupy', description: 'Lista zakupów' },
  },
  { id: 3, dexNo: 3, url: 'https://docs.example.com/shopping' },
);

const openHome = async (tiles: Tile[] | FakeResponse = [FINANCES, WEIGHT, SHOPPING]) => {
  const api = fakeApi({
    'GET /api/auth/me': signedIn(),
    'GET /api/tiles': Array.isArray(tiles) ? ok({ tiles }) : tiles,
  });

  renderApp('/');
  await screen.findByRole('heading', { level: 1 });
  return api;
};

const PIN_LABEL = /^(Pin |Przypnij: )/;

const tileTitles = () =>
  screen
    .queryAllByRole('article')
    .map((article) =>
      within(article).getByRole('button').getAttribute('aria-label')?.replace(PIN_LABEL, ''),
    );

const search = () => screen.getByRole('searchbox', { name: 'Find a tile' });

const typeQuery = (query: string) => {
  fireEvent.change(search(), { target: { value: query } });
};

const fakeFinePointer = () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: fine)' }));
};

describe('HomePage', () => {
  it('should show the tiles pinned first, then by title', async () => {
    // When
    await openHome([FINANCES, { ...WEIGHT, pinned: true }, SHOPPING]);

    // Then
    await waitFor(() => {
      expect(tileTitles()).toEqual(['Weight log', 'Finances', 'Shopping']);
    });
  });

  it('should show the text and order of the current language', async () => {
    // Given
    await openHome();
    await screen.findByText('Finances');

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(tileTitles()).toEqual(['Finanse', 'Weight log', 'Zakupy']);
  });

  it('should move a tile to the front when it is pinned', async () => {
    // Given
    let pinned = false;

    fakeApi({
      'GET /api/auth/me': signedIn(),
      'GET /api/tiles': () => ok({ tiles: [FINANCES, WEIGHT, { ...SHOPPING, pinned }] }),
      'PUT /api/tiles/3/pin': () => {
        pinned = true;
        return { status: 204 };
      },
    });

    renderApp('/');
    await screen.findByText('Shopping');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Pin Shopping' }));

    // Then
    await waitFor(() => {
      expect(tileTitles()).toEqual(['Shopping', 'Finances', 'Weight log']);
    });

    expect(screen.getByRole('button', { name: 'Pin Shopping' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should link a link tile to its URL in a new tab and a module tile to its page', async () => {
    // When
    await openHome([FINANCES, moduleTile('clock', { id: 9, dexNo: 9 })]);

    // Then
    const finances = await screen.findByRole('link', { name: /Finances/ });
    expect(finances).toHaveAttribute('href', 'https://docs.example.com/finances');
    expect(finances).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /clock/ })).toHaveAttribute('href', '/m/clock');
  });

  it('should show only the matching tiles, best match first, while searching', async () => {
    // Given
    await openHome();
    await screen.findByText('Finances');

    // When
    typeQuery('budget');

    // Then
    expect(screen.getByRole('heading', { level: 2, name: 'Results' })).toBeInTheDocument();
    expect(tileTitles()).toEqual(['Finances']);
  });

  it('should search the text shown in Polish, ignoring diacritics', async () => {
    // Given
    await i18next.changeLanguage('pl');
    await openHome();
    await screen.findByText('Zakupy');

    // When
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zakupow' } });

    // Then
    expect(tileTitles()).toEqual(['Zakupy']);
  });

  it('should say so when no tile matches the query', async () => {
    // Given
    await openHome();
    await screen.findByText('Finances');

    // When
    typeQuery('pokeball');

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('No tiles match “pokeball”.');
  });

  it('should open the best link match in a new tab when Enter is pressed', async () => {
    // Given
    const open = vi.fn();
    vi.stubGlobal('open', open);
    await openHome();
    await screen.findByText('Finances');
    typeQuery('weig');

    // When
    fireEvent.keyDown(search(), { key: 'Enter' });

    // Then
    expect(open).toHaveBeenCalledWith(
      'https://docs.example.com/weight',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('should go to the module page when Enter is pressed on a module match', async () => {
    // Given
    await openHome([FINANCES, moduleTile('clock', { id: 9, dexNo: 9 })]);
    await screen.findByText('Finances');
    typeQuery('clo');

    // When
    fireEvent.keyDown(search(), { key: 'Enter' });

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
  });

  it('should open nothing when Enter is pressed with an empty query', async () => {
    // Given
    const open = vi.fn();
    vi.stubGlobal('open', open);
    await openHome();
    await screen.findByText('Finances');

    // When
    fireEvent.keyDown(search(), { key: 'Enter' });

    // Then
    expect(open).not.toHaveBeenCalled();
  });

  it('should clear the search when Escape is pressed', async () => {
    // Given
    await openHome();
    await screen.findByText('Finances');
    typeQuery('weight');

    // When
    fireEvent.keyDown(search(), { key: 'Escape' });

    // Then
    expect(search()).toHaveValue('');
    expect(tileTitles()).toHaveLength(3);
  });

  it('should focus the search on a device with a fine pointer', async () => {
    // Given
    fakeFinePointer();

    // When
    await openHome();

    // Then
    expect(search()).toHaveFocus();
  });

  it('should not focus the search on a touch device', async () => {
    // When
    await openHome();

    // Then
    expect(search()).not.toHaveFocus();
  });

  it('should say the Dex is empty when there are no tiles', async () => {
    // When
    await openHome([]);

    // Then
    expect(await screen.findByText('Your Dex is empty.')).toBeInTheDocument();
  });

  it('should offer to try again when the tiles cannot be loaded', async () => {
    // Given
    const api = await openHome(status(400));
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByRole('alert')).toHaveTextContent("Can't load the tiles.");

    // When
    fireEvent.click(tryAgain);

    // Then
    await waitFor(() => {
      expect(api.callsTo('GET /api/tiles')).toHaveLength(2);
    });
  });
});
