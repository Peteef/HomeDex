import type { Page, Route } from '@playwright/test';

export const PLANT_ASSISTANT_PATH = '/m/plant-assistant';

const TODAY = '2026-11-20';

export interface E2EPlant {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  photoId: number | null;
  lastWateredOn: string;
  nextWateringOn: string;
  daysUntil: number;
  urgency: 'overdue' | 'today' | 'soon' | 'later';
  summerIntervalDays: number;
  winterIntervalDays: number;
  currentSeason: 'summer' | 'winter';
}

const plant = (
  id: number,
  name: string,
  overrides: Partial<E2EPlant> & Pick<E2EPlant, 'nextWateringOn' | 'daysUntil' | 'urgency'>,
): E2EPlant => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-10',
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  currentSeason: 'winter',
  ...overrides,
});

// One plant per urgency, a long name and many tags, for the screen checks.
export const SAMPLE_PLANTS: E2EPlant[] = [
  plant(1, "Bulbasaur's fern", {
    description: 'Likes shade.\nMist the leaves on warm days.',
    tags: ['Living room', 'Shade'],
    nextWateringOn: '2026-11-17',
    daysUntil: -3,
    urgency: 'overdue',
  }),
  plant(2, "Oddish's aloe", { nextWateringOn: TODAY, daysUntil: 0, urgency: 'today' }),
  plant(3, "Cacnea's cactus", {
    nextWateringOn: '2026-11-21',
    daysUntil: 1,
    urgency: 'soon',
    summerIntervalDays: 21,
    winterIntervalDays: 45,
  }),
  plant(4, "Bellsprout's trailing pothos on the top shelf of the tall bookcase", {
    tags: ['Bookcase', 'Living room', 'Trailing', 'Low light', 'Easy care', 'Gift from Misty'],
    nextWateringOn: '2026-11-22',
    daysUntil: 2,
    urgency: 'soon',
  }),
  plant(5, "Tangela's ivy", { nextWateringOn: '2026-11-29', daysUntil: 9, urgency: 'later' }),
];

// Fixed plants for the screen checks: every project shares one server and one user, so the real
// plants would change under parallel tests. The list gets the details too; the page ignores them.
export const stubPlants = async (page: Page, plants: E2EPlant[]): Promise<void> => {
  const listPlants = (route: Route) => route.fulfill({ json: { today: TODAY, plants } });

  const getPlant = (route: Route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').at(-1));
    const found = plants.find((candidate) => candidate.id === id);

    return found === undefined
      ? route.fulfill({ status: 404, json: { error: 'Plant not found' } })
      : route.fulfill({ json: { today: TODAY, plant: found } });
  };

  await page.route('**/api/m/plant-assistant/plants', listPlants);
  await page.route('**/api/m/plant-assistant/plants/*', getPlant);
};
