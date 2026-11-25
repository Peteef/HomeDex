import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import type { FakeResponse } from '#platform/frontend/testing';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PlantDetails, PlantSummary } from '../../../features/plants/index.ts';
import { AllPlantsPage } from '../AllPlantsPage.tsx';

const PLANTS = 'GET /api/m/plant-assistant/plants';
const FERN_PATH = 'GET /api/m/plant-assistant/plants/1';
const TODAY = '2026-11-20';

const plant = (id: number, name: string, overrides: Partial<PlantSummary> = {}): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-18',
  nextWateringOn: '2026-11-25',
  daysUntil: 5,
  urgency: 'later',
  ...overrides,
});

const FERN = plant(1, "Bulbasaur's fern", { daysUntil: -3, urgency: 'overdue' });
const CACTUS = plant(2, "Cacnea's cactus");
const ALOE = plant(3, "Oddish's aloe");

const FERN_DETAILS: PlantDetails = {
  ...FERN,
  description: 'Likes shade.',
  summerIntervalDays: 7,
  winterIntervalDays: 21,
  currentSeason: 'winter',
};

type Routes = Parameters<typeof fakeApi>[0];

const openPage = (plants: PlantSummary[] | Routes[string], routes: Routes = {}) => {
  const api = fakeApi({
    [PLANTS]: Array.isArray(plants) ? ok({ today: TODAY, plants }) : plants,
    ...routes,
  });

  render(withProviders(<AllPlantsPage />));
  return api;
};

describe('AllPlantsPage', () => {
  it('should list the plants by name in the current language', async () => {
    // When
    openPage([ALOE, FERN, CACTUS]);

    // Then
    await screen.findByText("Bulbasaur's fern");

    expect(
      within(screen.getByRole('list'))
        .getAllByRole('button')
        .map((row) => row.textContent),
    ).toEqual([
      "Bulbasaur's fern3 days overdue",
      "Cacnea's cactusIn 5 days",
      "Oddish's aloeIn 5 days",
    ]);
  });

  it('should be the All plants section', async () => {
    // When
    openPage([FERN]);

    // Then
    expect(screen.getByRole('region', { name: 'All plants' })).toBeInTheDocument();
    await screen.findByText("Bulbasaur's fern");
  });

  it('should say the plants are loading when they have not arrived yet', async () => {
    // When
    openPage([FERN]);

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    await screen.findByText("Bulbasaur's fern");
  });

  it('should say so when there are no plants yet', async () => {
    // When
    openPage([]);

    // Then
    await screen.findByText('No plants yet.');

    expect(screen.getByRole('status')).toHaveTextContent(
      "No plants yet.You'll be able to add plants here soon.",
    );
  });

  it('should offer to try again when the plants cannot be loaded', async () => {
    // Given
    const api = openPage(status(400));
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't load the plants.");

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => {
      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });
  });

  it('should open the details of the plant whose row is pressed', async () => {
    // Given
    openPage([FERN, CACTUS], { [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }) });

    // When
    fireEvent.click(await screen.findByRole('button', { name: /Bulbasaur's fern/ }));

    // Then
    const dialog = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
    expect(await within(dialog).findByText('Likes shade.')).toBeInTheDocument();
    expect(within(dialog).getByText('Every 21 days')).toBeInTheDocument();
  });

  it('should show the name and say the details are loading before they arrive', async () => {
    // Given
    let arrive: (response: FakeResponse) => void = () => undefined;

    openPage([FERN], {
      [FERN_PATH]: () =>
        new Promise<FakeResponse>((resolve) => {
          arrive = resolve;
        }),
    });

    // When
    fireEvent.click(await screen.findByRole('button', { name: /Bulbasaur's fern/ }));

    // Then
    const dialog = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading…');

    arrive(ok({ today: TODAY, plant: FERN_DETAILS }));
    expect(await within(dialog).findByText('Likes shade.')).toBeInTheDocument();
  });

  it('should offer to try again when the details cannot be loaded', async () => {
    // Given
    const api = openPage([FERN], { [FERN_PATH]: status(400) });
    fireEvent.click(await screen.findByRole('button', { name: /Bulbasaur's fern/ }));
    const dialog = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent("Can't load this plant.");

    // When
    fireEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => {
      expect(api.callsTo(FERN_PATH)).toHaveLength(2);
    });
  });

  it('should close the details', async () => {
    // Given
    openPage([FERN], { [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }) });
    fireEvent.click(await screen.findByRole('button', { name: /Bulbasaur's fern/ }));
    await screen.findByText('Likes shade.');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should keep the title of the open plant when someone else deletes it', async () => {
    // Given
    let deleted = false;
    const listPlants = () => ok({ today: TODAY, plants: deleted ? [] : [FERN] });

    const api = openPage(listPlants, { [FERN_PATH]: status(404) });

    fireEvent.click(await screen.findByRole('button', { name: /Bulbasaur's fern/ }));
    const dialog = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
    await within(dialog).findByRole('alert');

    // When
    deleted = true;
    fireEvent.focus(window);

    // Then
    await waitFor(() => {
      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });

    expect(await screen.findByText('No plants yet.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: "Bulbasaur's fern" })).toBeInTheDocument();
  });

  it('should refresh the plants when the window gets focus', async () => {
    // Given
    const api = openPage([FERN]);
    await screen.findByText("Bulbasaur's fern");

    // When
    fireEvent.focus(window);

    // Then
    await waitFor(() => {
      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });
  });

  it('should refresh the plants every 15 seconds', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = openPage([FERN]);
    await screen.findByText("Bulbasaur's fern");

    // When
    await act(() => vi.advanceTimersByTimeAsync(15_000));

    // Then
    expect(api.callsTo(PLANTS)).toHaveLength(2);
  });

  it('should show its text in Polish', async () => {
    // Given
    openPage([]);
    await screen.findByText('No plants yet.');

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(screen.getByRole('region', { name: 'Wszystkie rośliny' })).toBeInTheDocument();
    expect(screen.getByText('Nie ma jeszcze roślin.')).toBeInTheDocument();
  });
});
