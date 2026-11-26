import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import { CalendarPage } from '../CalendarPage.tsx';
import { BUSY_NOVEMBER, novemberWeeks, TODAY } from './calendarFixtures.ts';

const CALENDAR = 'GET /api/m/plant-assistant/calendar';
const NOVEMBER = { today: TODAY, month: '2026-11', weeks: novemberWeeks(BUSY_NOVEMBER) };

type Routes = Parameters<typeof fakeApi>[0];

const openPage = (routes: Routes = {}) => {
  const api = fakeApi({ [CALENDAR]: ok(NOVEMBER), ...routes });
  render(withProviders(<CalendarPage />));
  return api;
};

// Phones and desktops each get their own grid; the page shows one by screen width, so both are
// in the document here. The phone grid comes first.
const phoneGrid = () => within(screen.getAllByRole('table')[0] ?? document.body);
const desktopGrid = () => within(screen.getAllByRole('table')[1] ?? document.body);

const dayList = () =>
  within(screen.getByRole('heading', { level: 4 }).parentElement ?? document.body);

describe('CalendarPage', () => {
  it("should show today's month, with today selected and its plants listed", async () => {
    // When
    openPage();

    // Then
    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Friday, November 20');

    expect(
      dayList()
        .getAllByRole('button')
        .map((row) => row.textContent),
    ).toEqual(["Bulbasaur's fern3 days overdue", "Oddish's aloeToday"]);
  });

  it('should be the Upcoming waterings section, a phone grid and a desktop grid', async () => {
    // When
    openPage();

    // Then
    expect(screen.getByRole('region', { name: 'Upcoming waterings' })).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'November 2026' });
    expect(screen.getAllByRole('table')[0]?.parentElement).toHaveClass('lg:hidden');
    expect(screen.getAllByRole('table')[1]?.parentElement).toHaveClass('hidden lg:block');
  });

  it("should list another day's plants when it is selected", async () => {
    // Given
    openPage();
    await screen.findByRole('heading', { name: 'November 2026' });

    // When
    fireEvent.click(phoneGrid().getByRole('button', { name: /^Tuesday, November 24/ }));

    // Then
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Tuesday, November 24');
    expect(dayList().getAllByRole('button')).toHaveLength(5);
  });

  it('should not go back before the current month', async () => {
    // When
    openPage();

    // Then
    expect(await screen.findByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeEnabled();
  });

  it('should show the next month, then come back to today', async () => {
    // Given
    const december = { today: TODAY, month: '2026-12', weeks: novemberWeeks() };
    const api = openPage({ [`${CALENDAR}?month=2026-12`]: ok(december) });
    fireEvent.click(await screen.findByRole('button', { name: 'Next month' }));
    expect(await screen.findByRole('heading', { name: 'December 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));

    // Then
    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
    expect(api.callsTo(`${CALENDAR}?month=2026-12`)).toHaveLength(1);
  });

  it('should not go further than 12 months ahead', async () => {
    // When
    openPage({ [CALENDAR]: ok({ ...NOVEMBER, today: '2025-11-20' }) });

    // Then
    expect(await screen.findByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('should open the details of a plant, without edit or delete', async () => {
    // Given
    openPage({
      'GET /api/m/plant-assistant/plants/1': ok({
        today: TODAY,
        plant: {
          id: 1,
          name: "Bulbasaur's fern",
          description: 'Likes shade.',
          tags: [],
          photoId: null,
          lastWateredOn: '2026-11-10',
          nextWateringOn: '2026-11-17',
          daysUntil: -3,
          urgency: 'overdue',
          summerIntervalDays: 7,
          winterIntervalDays: 7,
          currentSeason: 'winter',
        },
      }),
    });

    await screen.findByRole('heading', { name: 'November 2026' });

    // When
    fireEvent.click(desktopGrid().getByRole('button', { name: /^Bulbasaur's fern/ }));

    // Then
    const details = screen.getByRole('dialog', { name: "Bulbasaur's fern" });
    expect(await within(details).findByText('Likes shade.')).toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('should offer to try again when the calendar cannot be loaded', async () => {
    // Given
    const api = openPage({ [CALENDAR]: status(400) });
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't load the calendar.");

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => {
      expect(api.callsTo(CALENDAR)).toHaveLength(2);
    });
  });

  it('should show the month in Polish', async () => {
    // Given
    openPage();
    await screen.findByRole('heading', { name: 'November 2026' });

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(screen.getByRole('heading', { name: 'listopad 2026' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Najbliższe podlewanie' })).toBeInTheDocument();
  });
});
