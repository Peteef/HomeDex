import { useText } from '../../locales/index.ts';
import { Section } from '../../components/section/Section.tsx';

export const AllPlantsPage = () => {
  const text = useText('allPlants');
  return <Section heading={text.heading} />;
};
