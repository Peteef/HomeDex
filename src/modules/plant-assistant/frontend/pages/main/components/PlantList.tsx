import { useText } from '../../../locales/index.ts';
import { Section } from './Section.tsx';

export interface PlantListProps {
  hideHeading?: boolean;
}

export const PlantList = ({ hideHeading = false }: PlantListProps) => {
  const text = useText('main.plantList');
  return <Section heading={text.heading} hideHeading={hideHeading} />;
};
