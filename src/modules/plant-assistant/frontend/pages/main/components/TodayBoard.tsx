import { useText } from '../../../locales/index.ts';
import { Section } from './Section.tsx';

export const TodayBoard = () => {
  const text = useText('main.todayBoard');
  return <Section heading={text.heading} />;
};
