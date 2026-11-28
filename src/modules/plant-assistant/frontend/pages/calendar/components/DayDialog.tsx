import { Dialog } from '#platform/frontend';
import { useTranslation } from 'react-i18next';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import { DayPlantList } from './DayPlantList.tsx';

export interface DayDialogProps {
  day: CalendarDay;
  onOpen: (plant: CalendarPlant) => void;
  onClose: () => void;
}

export const DayDialog = ({ day, onOpen, onClose }: DayDialogProps) => {
  const { i18n } = useTranslation();
  const title = calendarFormat(i18n.language).fullDate(day.date);

  return (
    <Dialog open title={title} onClose={onClose}>
      <DayPlantList day={day} onOpen={onOpen} />
    </Dialog>
  );
};
