import { useText } from '../../../locales/index.ts';
import { Section } from './Section.tsx';

export const CalendarView = () => {
  const text = useText('main.calendarView');
  return <Section heading={text.heading} />;
};
