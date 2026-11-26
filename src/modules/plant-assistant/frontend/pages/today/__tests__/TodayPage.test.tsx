import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import type { FakeResponse } from '#platform/frontend/testing';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PlantDetails, PlantSummary } from '../../../features/plants/index.ts';
import { TodayPage } from '../TodayPage.tsx';

const PLANTS = 'GET /api/m/plant-assistant/plants';
const WATER_FERN = 'POST /api/m/plant-assistant/plants/1/waterings';
const UNDO_FERN = 'POST /api/m/plant-assistant/plants/1/waterings/7/undo';
const POSTPONE_FERN = 'POST /api/m/plant-assistant/plants/1/postpone';
const TODAY = '2026-11-20';
const PREVIOUS = { lastWateredOn: '2026-11-10', nextWateringOn: '2026-11-17' };

const plant = (id: number, name: string, overrides: Partial<PlantSummary> = {}): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-10',
  nextWateringOn: '2026-11-17',
  daysUntil: -3,
  urgency: 'overdue',
  ...overrides,
});

const FERN = plant(1, "Bulbasaur's fern");
const ALOE = plant(2, "Oddish's aloe", { daysUntil: 0, urgency: 'today' });
const IVY = plant(3, "Tangela's ivy", { daysUntil: 9, urgency: 'later' });
const WATERED_FERN = { ...FERN, daysUntil: 7, urgency: 'later' as const };

const FERN_DETAILS: PlantDetails = {
  ...FERN,
  description: 'Likes shade.',
  summerIntervalDays: 7,
  winterIntervalDays: 7,
  currentSeason: 'winter',
};

type Routes = Parameters<typeof fakeApi>[0];

// The server's list, which a test changes as the plants change.
const serverWith = (initial: PlantSummary[]) => {
  let plants = initial;

  return {
    list: () => ok({ today: TODAY, plants }),
    change: (next: PlantSummary[]) => {
      plants = next;
    },
  };
};

const openPage = (routes: Routes) => {
  const api = fakeApi(routes);
  render(withProviders(<TodayPage />));
  return api;
};

const boardNames = () =>
  screen
    .queryAllByRole('listitem')
    .map((card) => within(card).getAllByRole('button')[0]?.textContent);

const notice = () => screen.getAllByRole('status').at(-1);

describe('TodayPage', () => {
  it('should show the plants due, most overdue first, and leave out the others', async () => {
    // When
    openPage({ [PLANTS]: ok({ today: TODAY, plants: [IVY, ALOE, FERN] }) });

    // Then
    await screen.findByText("Bulbasaur's fern");
    expect(boardNames()).toEqual(["Bulbasaur's fern", "Oddish's aloe"]);
  });

  it('should be the To water today section', async () => {
    // When
    openPage({ [PLANTS]: ok({ today: TODAY, plants: [FERN] }) });

    // Then
    expect(screen.getByRole('region', { name: 'To water today' })).toBeInTheDocument();
    await screen.findByText("Bulbasaur's fern");
  });

  it('should say nothing needs water and name the next plant', async () => {
    // When
    openPage({ [PLANTS]: ok({ today: TODAY, plants: [IVY] }) });

    // Then
    expect(await screen.findByText('Nothing to water today.')).toBeInTheDocument();
    expect(screen.getByText("Next: Tangela's ivy,")).toBeInTheDocument();
  });

  it('should offer to try again when the plants cannot be loaded', async () => {
    // Given
    const api = openPage({ [PLANTS]: status(400) });
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't load the plants.");

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => {
      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });
  });

  it('should take a watered plant off the board at once, then offer to undo it', async () => {
    // Given
    const server = serverWith([FERN, ALOE]);
    let saved: (response: FakeResponse) => void = () => undefined;

    const api = openPage({
      [PLANTS]: server.list,
      [WATER_FERN]: () =>
        new Promise<FakeResponse>((resolve) => {
          saved = resolve;
        }),
      [UNDO_FERN]: { status: 204 },
    });

    fireEvent.click(await screen.findByRole('button', { name: "Watered: Bulbasaur's fern" }));

    // Then
    expect(boardNames()).toEqual(["Oddish's aloe"]);

    await waitFor(() => {
      expect(api.callsTo(WATER_FERN)).toHaveLength(1);
    });

    // When
    server.change([WATERED_FERN, ALOE]);
    saved({ status: 201, body: { wateringId: 7, previous: PREVIOUS } });

    // Then
    expect(await screen.findByText("Bulbasaur's fern watered.")).toBeInTheDocument();
    expect(boardNames()).toEqual(["Oddish's aloe"]);

    // When
    server.change([FERN, ALOE]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    await waitFor(() => {
      expect(boardNames()).toEqual(["Bulbasaur's fern", "Oddish's aloe"]);
    });

    expect(api.callsTo(UNDO_FERN)[0]?.body).toEqual({ previous: PREVIOUS });
    expect(notice()).toBeEmptyDOMElement();
  });

  it('should refresh and say so when someone else watered the plant first', async () => {
    // Given
    const server = serverWith([FERN, ALOE]);

    const api = openPage({
      [PLANTS]: server.list,
      [WATER_FERN]: () => {
        server.change([WATERED_FERN, ALOE]);
        return status(409);
      },
    });

    // When
    fireEvent.click(await screen.findByRole('button', { name: "Watered: Bulbasaur's fern" }));

    // Then
    expect(
      await screen.findByText("Someone already took care of Bulbasaur's fern."),
    ).toBeInTheDocument();

    expect(api.callsTo(PLANTS)).toHaveLength(2);
    expect(boardNames()).toEqual(["Oddish's aloe"]);
  });

  it('should bring the plant back and say so when the watering cannot be saved', async () => {
    // Given
    openPage({ [PLANTS]: ok({ today: TODAY, plants: [FERN] }), [WATER_FERN]: status(500) });

    // When
    fireEvent.click(await screen.findByRole('button', { name: "Watered: Bulbasaur's fern" }));

    // Then
    expect(
      await screen.findByText("Can't save that Bulbasaur's fern was watered. Try again."),
    ).toBeInTheDocument();

    expect(boardNames()).toEqual(["Bulbasaur's fern"]);
  });

  it('should say so when the watering can no longer be undone', async () => {
    // Given
    const server = serverWith([FERN]);

    openPage({
      [PLANTS]: server.list,
      [WATER_FERN]: () => {
        server.change([WATERED_FERN]);
        return {
          status: 201,
          body: { wateringId: 7, previous: PREVIOUS },
        };
      },
      [UNDO_FERN]: status(409),
    });

    fireEvent.click(await screen.findByRole('button', { name: "Watered: Bulbasaur's fern" }));

    // When
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    // Then
    expect(
      await screen.findByText("Can't undo any more: the plant changed meanwhile."),
    ).toBeInTheDocument();
  });

  it('should postpone a plant by the days chosen and close the choice', async () => {
    // Given
    const server = serverWith([FERN, ALOE]);

    const api = openPage({
      [PLANTS]: server.list,
      [POSTPONE_FERN]: () => {
        server.change([WATERED_FERN, ALOE]);
        return { status: 204 };
      },
    });

    fireEvent.click(await screen.findByRole('button', { name: "Postpone: Bulbasaur's fern" }));
    const choice = screen.getByRole('dialog', { name: "Postpone Bulbasaur's fern" });

    // When
    fireEvent.click(within(choice).getByRole('button', { name: '2 days' }));

    // Then
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(api.callsTo(POSTPONE_FERN)[0]?.body).toEqual({ days: 2 });
    expect(boardNames()).toEqual(["Oddish's aloe"]);
  });

  it('should close the choice and say so when someone else took care of the plant first', async () => {
    // Given
    openPage({ [PLANTS]: ok({ today: TODAY, plants: [FERN] }), [POSTPONE_FERN]: status(409) });
    fireEvent.click(await screen.findByRole('button', { name: "Postpone: Bulbasaur's fern" }));

    // When
    fireEvent.click(screen.getByRole('button', { name: '1 day' }));

    // Then
    expect(
      await screen.findByText("Someone already took care of Bulbasaur's fern."),
    ).toBeInTheDocument();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should keep the choice open and say so when postponing fails', async () => {
    // Given
    openPage({ [PLANTS]: ok({ today: TODAY, plants: [FERN] }), [POSTPONE_FERN]: status(500) });
    fireEvent.click(await screen.findByRole('button', { name: "Postpone: Bulbasaur's fern" }));
    const choice = screen.getByRole('dialog', { name: "Postpone Bulbasaur's fern" });

    // When
    fireEvent.click(within(choice).getByRole('button', { name: '1 day' }));

    // Then
    expect(await within(choice).findByRole('alert')).toHaveTextContent(
      "Can't postpone. Try again.",
    );
  });

  it('should open the details of a plant, without edit or delete', async () => {
    // Given
    openPage({
      [PLANTS]: ok({ today: TODAY, plants: [FERN] }),
      'GET /api/m/plant-assistant/plants/1': ok({ today: TODAY, plant: FERN_DETAILS }),
    });

    // When
    fireEvent.click(await screen.findByRole('button', { name: "Bulbasaur's fern" }));

    // Then
    const details = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
    expect(await within(details).findByText('Likes shade.')).toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
