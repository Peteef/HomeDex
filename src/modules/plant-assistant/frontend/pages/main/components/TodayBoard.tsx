import { useText } from '../../../locales/index.ts';
import { Section } from './Section.tsx';

export interface TodayBoardProps {
  hideHeading?: boolean;
}

export const TodayBoard = ({ hideHeading = false }: TodayBoardProps) => {
  const text = useText('main.todayBoard');
  return <Section heading={text.heading} hideHeading={hideHeading} />;
};
