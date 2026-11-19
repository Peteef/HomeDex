import { useText } from '../../../locales/index.ts';
import { Section } from './Section.tsx';

export interface CalendarViewProps {
  hideHeading?: boolean;
}

export const CalendarView = ({ hideHeading = false }: CalendarViewProps) => {
  const text = useText('main.calendarView');
  return <Section heading={text.heading} hideHeading={hideHeading} />;
};
