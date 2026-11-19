import { ModulePage } from '#platform/frontend';
import { useText } from '../../locales/index.ts';
import { CalendarView } from './components/CalendarView.tsx';
import { PlantList } from './components/PlantList.tsx';
import { TabBar } from './components/TabBar.tsx';
import { TodayBoard } from './components/TodayBoard.tsx';
import { ViewSwitch } from './components/ViewSwitch.tsx';
import { useWideLayout } from './internal/useWideLayout.ts';
import type { View } from './internal/views.ts';

export interface MainPageProps {
  view: View;
}

export const MainPage = ({ view }: MainPageProps) => {
  const text = useText('main');
  const wide = useWideLayout();

  const sections = {
    today: <TodayBoard />,
    plants: <PlantList />,
    calendar: <CalendarView />,
  };

  if (!wide) {
    return (
      <ModulePage title={text.title} wide>
        {sections[view]}
        <TabBar />
      </ModulePage>
    );
  }

  const sideView = view === 'calendar' ? 'calendar' : 'plants';

  return (
    <ModulePage title={text.title} wide>
      <div className="grid grid-cols-2 gap-6">
        {sections.today}
        <div className="flex flex-col gap-4">
          <ViewSwitch current={sideView} />
          {sections[sideView]}
        </div>
      </div>
    </ModulePage>
  );
};
