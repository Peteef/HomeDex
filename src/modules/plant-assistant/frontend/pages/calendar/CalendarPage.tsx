import { useText } from '../../locales/index.ts';
import { Section } from '../../components/section/Section.tsx';

export const CalendarPage = () => {
  const text = useText('calendar');
  return <Section heading={text.heading} />;
};
