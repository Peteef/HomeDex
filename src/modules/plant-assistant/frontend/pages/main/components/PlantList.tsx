import { useText } from '../../../locales/index.ts';
import { Section } from './Section.tsx';

export const PlantList = () => {
  const text = useText('main.plantList');
  return <Section heading={text.heading} />;
};
