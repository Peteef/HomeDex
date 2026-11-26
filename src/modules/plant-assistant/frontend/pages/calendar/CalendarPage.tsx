import { LoadFailed, LoadingStatus } from '#platform/frontend';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlantDetailsDialog } from '../../components/plant-details/PlantDetailsDialog.tsx';
import { Section } from '../../components/section/Section.tsx';
import { TagChip } from '../../components/tag-chip/TagChip.tsx';
import {
  addMonths,
  findPlant,
  monthOf,
  nextMonth,
  previousMonth,
  useCalendarMonth,
} from '../../features/calendar/index.ts';
import type { CalendarMonth, CalendarPlant } from '../../features/calendar/index.ts';
import { usePlant } from '../../features/plants/index.ts';
import { useText } from '../../locales/index.ts';
import { DayPlants } from './components/DayPlants.tsx';
import { DesktopMonthGrid } from './components/DesktopMonthGrid.tsx';
import { MonthHeader } from './components/MonthHeader.tsx';
import { PhoneMonthGrid } from './components/PhoneMonthGrid.tsx';
import { calendarFormat } from './internal/calendarFormat.ts';

const MAX_MONTHS_AHEAD = 12;

export const CalendarPage = () => {
  const text = useText('calendar');
  const { i18n } = useTranslation();
  // Until one is picked, the server's current month and today are shown.
  const [pickedMonth, setPickedMonth] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const calendar = useCalendarMonth(pickedMonth);
  const openPlant = usePlant(openedId);

  // The calendar names the open plant, so a plant deleted elsewhere closes its dialog.
  const openedPlant =
    openedId === null || calendar.data === undefined
      ? undefined
      : findPlant(calendar.data, openedId);

  const showMonth = (shown: string | null): void => {
    setPickedMonth(shown);
    setPickedDay(null);
  };

  const openDetails = (plant: CalendarPlant): void => {
    setOpenedId(plant.id);
  };

  const showToday = (): void => {
    showMonth(null);
  };

  const closeDetails = (): void => {
    setOpenedId(null);
  };

  const renderTag = (tag: string) => <TagChip tag={tag} />;

  const retry = (): void => {
    void calendar.refetch();
  };

  const retryOpenPlant = (): void => {
    void openPlant.refetch();
  };

  const renderMonth = ({ today, month: shown, weeks }: CalendarMonth) => {
    const currentMonth = monthOf(today);
    const days = weeks.flat();
    const selectedDate = pickedDay ?? days.find((day) => day.isToday)?.date ?? null;
    const selectedDay = days.find((day) => day.date === selectedDate);

    return (
      <>
        <MonthHeader
          title={calendarFormat(i18n.language).monthTitle(shown)}
          canGoBack={shown !== currentMonth}
          canGoForward={shown !== addMonths(currentMonth, MAX_MONTHS_AHEAD)}
          onPrevious={() => {
            showMonth(previousMonth(shown));
          }}
          onNext={() => {
            showMonth(nextMonth(shown));
          }}
          onToday={showToday}
        />
        <div className="lg:hidden">
          <PhoneMonthGrid weeks={weeks} selected={selectedDate} onSelect={setPickedDay} />
        </div>
        <div className="hidden lg:block">
          <DesktopMonthGrid
            weeks={weeks}
            selected={selectedDate}
            onSelect={setPickedDay}
            onOpen={openDetails}
          />
        </div>
        {selectedDay !== undefined && <DayPlants day={selectedDay} onOpen={openDetails} />}
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
      {openedPlant !== undefined && (
        <PlantDetailsDialog
          title={openedPlant.name}
          plant={openPlant.data?.plant}
          renderTag={renderTag}
          actions={null}
          failed={openPlant.isError}
          onRetry={retryOpenPlant}
          onClose={closeDetails}
        />
      )}
    </Section>
  );
};
