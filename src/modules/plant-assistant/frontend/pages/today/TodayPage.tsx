import { useText } from '../../locales/index.ts';
import { Section } from '../../components/section/Section.tsx';

export const TodayPage = () => {
  const text = useText('today');
  return <Section heading={text.heading} />;
};
