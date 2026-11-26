import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import type { FakeResponse } from '#platform/frontend/testing';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PlantDetails, PlantSummary } from '../../../features/plants/index.ts';
import { AllPlantsPage } from '../AllPlantsPage.tsx';

const PLANTS = 'GET /api/m/plant-assistant/plants';
const FERN_PATH = 'GET /api/m/plant-assistant/plants/1';
const TAGS = 'GET /api/m/plant-assistant/tags';
const CREATE = 'POST /api/m/plant-assistant/plants';
const EDIT = 'PUT /api/m/plant-assistant/plants/1';
const DELETE = 'DELETE /api/m/plant-assistant/plants/1';
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
    [TAGS]: ok({ tags: ['Living room', 'Shade'] }),
    ...routes,
  });

  render(withProviders(<AllPlantsPage />));
  return api;
};

const openDetails = async () => {
  fireEvent.click(await screen.findByRole('button', { name: /Bulbasaur's fern/ }));
  const dialog = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
  await within(dialog).findByText('Likes shade.');
  return dialog;
};

const fieldIn = (dialog: HTMLElement, label: string) => within(dialog).getByLabelText(label);

describe('AllPlantsPage', () => {
  it('should list the plants by name in the current language', async () => {
    // When
    openPage([ALOE, FERN, CACTUS]);

    // Then
    await screen.findByText("Bulbasaur's fern");

    expect(
      within(screen.getByRole('list'))
        .getAllByRole('button', { name: /fern|cactus|aloe/ })
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
      'No plants yet.Add the first one with “Add plant”.',
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

  it('should close the dialog of a plant someone else deletes', async () => {
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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

  describe('adding a plant', () => {
    it('should add a plant and close the form', async () => {
      // Given
      const api = openPage([FERN], {
        [CREATE]: { status: 201, body: { plant: { ...FERN_DETAILS, id: 4, name: 'Oddish' } } },
      });

      fireEvent.click(await screen.findByRole('button', { name: 'Add plant' }));
      const form = screen.getByRole('dialog', { name: 'Add a plant' });

      // When
      fireEvent.change(fieldIn(form, 'Name'), { target: { value: ' Oddish ' } });
      fireEvent.change(fieldIn(form, 'New tag'), { target: { value: 'Shade' } });
      fireEvent.click(within(form).getByRole('button', { name: 'Add' }));
      fireEvent.change(fieldIn(form, 'Summer'), { target: { value: '5' } });
      fireEvent.change(fieldIn(form, 'Winter'), { target: { value: '10' } });
      fireEvent.change(fieldIn(form, 'Last watered'), { target: { value: '2026-11-18' } });
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));

      // Then
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(api.callsTo(CREATE)[0]?.body).toEqual({
        name: 'Oddish',
        description: null,
        tags: ['Shade'],
        summerIntervalDays: 5,
        winterIntervalDays: 10,
        lastWateredOn: '2026-11-18',
      });

      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });

    it('should start last watered today and suggest the tags in use', async () => {
      // Given
      openPage([]);

      // When
      fireEvent.click(await screen.findByRole('button', { name: 'Add plant' }));

      // Then
      const form = screen.getByRole('dialog', { name: 'Add a plant' });
      expect(fieldIn(form, 'Last watered')).toHaveValue('2026-11-20');

      await waitFor(() => {
        expect(form.querySelectorAll('datalist option')).toHaveLength(2);
      });
    });

    it('should show what is wrong and send nothing', async () => {
      // Given
      const api = openPage([FERN]);
      fireEvent.click(await screen.findByRole('button', { name: 'Add plant' }));
      const form = screen.getByRole('dialog', { name: 'Add a plant' });

      // When
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));

      // Then
      expect(fieldIn(form, 'Name')).toHaveAccessibleDescription('Enter a name.');
      expect(api.callsTo(CREATE)).toHaveLength(0);
    });

    it('should keep the form open and say so when saving fails', async () => {
      // Given
      openPage([FERN], { [CREATE]: status(500) });
      fireEvent.click(await screen.findByRole('button', { name: 'Add plant' }));
      const form = screen.getByRole('dialog', { name: 'Add a plant' });
      fireEvent.change(fieldIn(form, 'Name'), { target: { value: 'Oddish' } });
      fireEvent.change(fieldIn(form, 'Summer'), { target: { value: '5' } });
      fireEvent.change(fieldIn(form, 'Winter'), { target: { value: '10' } });

      // When
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));

      // Then
      expect(await within(form).findByRole('alert')).toHaveTextContent(
        "Can't save the plant. Try again.",
      );
    });
  });

  describe('editing a plant', () => {
    it('should open the form from the details, save the changes and go back to the details', async () => {
      // Given
      const api = openPage([FERN], {
        [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }),
        [EDIT]: { status: 204 },
      });

      const details = await openDetails();
      fireEvent.click(within(details).getByRole('button', { name: 'Edit' }));
      const form = screen.getByRole('dialog', { name: "Edit Bulbasaur's fern" });
      expect(fieldIn(form, 'Winter')).toHaveValue(21);

      // When
      fireEvent.change(fieldIn(form, 'Winter'), { target: { value: '28' } });
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));

      // Then
      expect(await screen.findByRole('dialog', { name: "Bulbasaur's fern" })).toBeInTheDocument();
      expect(screen.getAllByRole('dialog')).toHaveLength(1);

      expect(api.callsTo(EDIT)[0]?.body).toEqual({
        name: "Bulbasaur's fern",
        description: 'Likes shade.',
        tags: [],
        summerIntervalDays: 7,
        winterIntervalDays: 28,
        nextWateringOn: '2026-11-25',
      });

      expect(api.callsTo(FERN_PATH)).toHaveLength(2);
    });

    it('should title the details with the new name after a rename', async () => {
      // Given
      let renamed = false;

      const listPlants = () =>
        ok({ today: TODAY, plants: [renamed ? { ...FERN, name: 'Ivysaur fern' } : FERN] });

      openPage(listPlants, {
        [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }),
        [EDIT]: () => {
          renamed = true;
          return { status: 204 };
        },
      });

      const details = await openDetails();
      fireEvent.click(within(details).getByRole('button', { name: 'Edit' }));
      const form = screen.getByRole('dialog', { name: "Edit Bulbasaur's fern" });

      // When
      fireEvent.change(fieldIn(form, 'Name'), { target: { value: 'Ivysaur fern' } });
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));

      // Then
      expect(await screen.findByRole('dialog', { name: 'Ivysaur fern' })).toBeInTheDocument();
    });

    it('should go back to the details when the form is closed', async () => {
      // Given
      openPage([FERN], { [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }) });
      const details = await openDetails();
      fireEvent.click(within(details).getByRole('button', { name: 'Edit' }));

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      // Then
      expect(screen.getByRole('dialog', { name: "Bulbasaur's fern" })).toBeInTheDocument();
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });
  });

  describe('deleting a plant', () => {
    it('should ask first, then delete the plant and close everything', async () => {
      // Given
      const api = openPage([FERN], {
        [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }),
        [DELETE]: { status: 204 },
      });

      const details = await openDetails();
      fireEvent.click(within(details).getByRole('button', { name: 'Delete' }));
      const question = screen.getByRole('dialog', { name: "Delete Bulbasaur's fern?" });

      // When
      fireEvent.click(within(question).getByRole('button', { name: 'Delete' }));

      // Then
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(api.callsTo(DELETE)).toHaveLength(1);
      expect(api.callsTo(PLANTS)).toHaveLength(2);
      expect(document.documentElement.style.overflow).toBe('');
    });

    it('should go back to the details when deleting is cancelled', async () => {
      // Given
      const api = openPage([FERN], { [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }) });
      const details = await openDetails();
      fireEvent.click(within(details).getByRole('button', { name: 'Delete' }));
      const question = screen.getByRole('dialog', { name: "Delete Bulbasaur's fern?" });

      // When
      fireEvent.click(within(question).getByRole('button', { name: 'Cancel' }));

      // Then
      expect(screen.getByRole('dialog', { name: "Bulbasaur's fern" })).toBeInTheDocument();
      expect(api.callsTo(DELETE)).toHaveLength(0);
    });

    it('should keep the question open and say so when deleting fails', async () => {
      // Given
      openPage([FERN], {
        [FERN_PATH]: ok({ today: TODAY, plant: FERN_DETAILS }),
        [DELETE]: status(500),
      });

      const details = await openDetails();
      fireEvent.click(within(details).getByRole('button', { name: 'Delete' }));
      const question = screen.getByRole('dialog', { name: "Delete Bulbasaur's fern?" });

      // When
      fireEvent.click(within(question).getByRole('button', { name: 'Delete' }));

      // Then
      expect(await within(question).findByRole('alert')).toHaveTextContent(
        "Can't delete the plant. Try again.",
      );
    });
  });

  describe('searching and filtering', () => {
    const ZOLW = plant(4, 'Żółw plant', { tags: ['Shade'] });
    const SHADY_FERN = { ...FERN, tags: ['Shade', 'Living room'] };

    const rowNames = () =>
      screen
        .queryAllByRole('button', { name: /(overdue|In \d+ days)$/ })
        .map((row) => row.textContent);

    it('should filter the list by what is typed', async () => {
      // Given
      openPage([SHADY_FERN, CACTUS, ZOLW]);
      await screen.findByText("Bulbasaur's fern");

      // When
      fireEvent.change(screen.getByRole('searchbox', { name: 'Search plants' }), {
        target: { value: 'zolw' },
      });

      // Then
      expect(rowNames()).toEqual(['Żółw plantIn 5 days']);
    });

    it('should filter the list by a tag selected in a row, and clear it', async () => {
      // Given
      openPage([SHADY_FERN, CACTUS, ZOLW]);
      await screen.findByText("Bulbasaur's fern");

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Show plants tagged Living room' }));

      // Then
      expect(screen.getByText('Tag:')).toBeInTheDocument();
      expect(rowNames()).toEqual(["Bulbasaur's fern3 days overdue"]);

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Clear the tag filter' }));

      // Then
      expect(rowNames()).toHaveLength(3);
    });

    it('should close the details and filter the list by a tag selected in them', async () => {
      // Given
      openPage([SHADY_FERN, CACTUS, ZOLW], {
        [FERN_PATH]: ok({ today: TODAY, plant: { ...FERN_DETAILS, tags: ['Living room'] } }),
      });

      const details = await openDetails();

      // When
      fireEvent.click(
        within(details).getByRole('button', { name: 'Show plants tagged Living room' }),
      );

      // Then
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(rowNames()).toEqual(["Bulbasaur's fern3 days overdue"]);
    });

    it('should say when no plant matches and clear the search and the filter', async () => {
      // Given
      openPage([SHADY_FERN, CACTUS, ZOLW]);
      await screen.findByText("Bulbasaur's fern");
      fireEvent.click(screen.getByRole('button', { name: 'Show plants tagged Living room' }));

      fireEvent.change(screen.getByRole('searchbox', { name: 'Search plants' }), {
        target: { value: 'cactus' },
      });

      expect(screen.getByRole('status')).toHaveTextContent('No plants match.');

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Show all plants' }));

      // Then
      expect(rowNames()).toHaveLength(3);
      expect(screen.getByRole('searchbox', { name: 'Search plants' })).toHaveValue('');
      expect(screen.queryByText('Tag:')).not.toBeInTheDocument();
    });

    it('should offer no search while there are no plants', async () => {
      // When
      openPage([]);

      // Then
      await screen.findByText('No plants yet.');
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
  });
});
