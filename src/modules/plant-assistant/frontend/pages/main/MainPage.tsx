import { ModulePage } from '#platform/frontend';
import { useText } from '../../locales/index.ts';
import { CalendarView } from './components/CalendarView.tsx';
import { PlantList } from './components/PlantList.tsx';
import { TabBar } from './components/TabBar.tsx';
import { TodayBoard } from './components/TodayBoard.tsx';
import { ViewTabs } from './components/ViewTabs.tsx';
import { useWideLayout } from './internal/useWideLayout.ts';
import type { View } from './internal/views.ts';

export interface MainPageProps {
  view: View;
}

export const MainPage = ({ view }: MainPageProps) => {
  const text = useText('main');
  const wide = useWideLayout();

  const views = {
    today: <TodayBoard hideHeading={wide} />,
    plants: <PlantList hideHeading={wide} />,
    calendar: <CalendarView hideHeading={wide} />,
  };

  return (
    <ModulePage title={text.title} wide>
      {wide ? <ViewTabs /> : null}
      {views[view]}
      {wide ? null : <TabBar />}
    </ModulePage>
  );
};
