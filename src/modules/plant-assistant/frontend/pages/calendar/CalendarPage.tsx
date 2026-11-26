import { LoadFailed, LoadingStatus } from '#platform/frontend';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlantDetailsDialog } from '../../components/plant-details/PlantDetailsDialog.tsx';
import { Section } from '../../components/section/Section.tsx';
import { addMonths, monthOf, useCalendarMonth } from '../../features/calendar/index.ts';
import type { CalendarMonth, CalendarPlant } from '../../features/calendar/index.ts';
import { usePlant } from '../../features/plants/index.ts';
import { useText } from '../../locales/index.ts';
import { DayPlants } from './components/DayPlants.tsx';
import { DesktopMonthGrid } from './components/DesktopMonthGrid.tsx';
import { MonthHeader } from './components/MonthHeader.tsx';
import { PhoneMonthGrid } from './components/PhoneMonthGrid.tsx';
import { calendarFormat } from './internal/calendarFormat.ts';

const MAX_MONTHS_AHEAD = 12;

// The month starts as the server's current one (null) and the day as today; both reset when the
// page opens again (owner, 2026-11-20).
export const CalendarPage = () => {
  const text = useText('calendar');
  const { i18n } = useTranslation();
  const [month, setMonth] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [opened, setOpened] = useState<CalendarPlant | null>(null);
  const calendar = useCalendarMonth(month);
  const openPlant = usePlant(opened?.id ?? null);

  const showMonth = (shown: string | null): void => {
    setMonth(shown);
    setSelected(null);
  };

  const showToday = (): void => {
    showMonth(null);
  };

  const closeDetails = (): void => {
    setOpened(null);
  };

  const retry = (): void => {
    void calendar.refetch();
  };

  const retryOpenPlant = (): void => {
    void openPlant.refetch();
  };

  const renderMonth = ({ today, month: shown, weeks }: CalendarMonth) => {
    const currentMonth = monthOf(today);
    const days = weeks.flat();
    const selectedDate = selected ?? days.find((day) => day.isToday)?.date ?? null;
    const selectedDay = days.find((day) => day.date === selectedDate);

    return (
      <>
        <MonthHeader
          title={calendarFormat(i18n.language).monthTitle(shown)}
          canGoBack={shown !== currentMonth}
          canGoForward={shown !== addMonths(currentMonth, MAX_MONTHS_AHEAD)}
          onPrevious={() => {
            showMonth(addMonths(shown, -1));
          }}
          onNext={() => {
            showMonth(addMonths(shown, 1));
          }}
          onToday={showToday}
        />
        <div className="lg:hidden">
          <PhoneMonthGrid weeks={weeks} selected={selectedDate} onSelect={setSelected} />
        </div>
        <div className="hidden lg:block">
          <DesktopMonthGrid
            weeks={weeks}
            selected={selectedDate}
            onSelect={setSelected}
            onOpen={setOpened}
          />
        </div>
        {selectedDay === undefined ? null : <DayPlants day={selectedDay} onOpen={setOpened} />}
      </>
    );
  };

  const renderCalendar = () => {
    if (calendar.data !== undefined) {
      return renderMonth(calendar.data);
    }

    if (calendar.isError) {
      return <LoadFailed message={text.loadFailed} onRetry={retry} />;
    }

    return <LoadingStatus />;
  };

  return (
    <Section heading={text.heading}>
      {renderCalendar()}
      {opened === null ? null : (
        <PlantDetailsDialog
          title={openPlant.data?.plant.name ?? opened.name}
          plant={openPlant.data?.plant}
          failed={openPlant.isError}
          onRetry={retryOpenPlant}
          onClose={closeDetails}
        />
      )}
    </Section>
  );
};
