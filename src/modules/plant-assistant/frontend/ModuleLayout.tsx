import { ModulePage } from '#platform/frontend';
import { Outlet } from 'react-router';
import { isDue, usePlants } from './features/plants/index.ts';
import { useText } from './locales/index.ts';
import { TabBar } from './TabBar.tsx';
import { useIsMobile } from './useIsMobile.ts';
import { ViewTabs } from './ViewTabs.tsx';

export const ModuleLayout = () => {
  const text = useText('layout');
  const mobile = useIsMobile();
  const plants = usePlants();
  const todayCount = plants.data?.plants.filter(isDue).length ?? 0;

  return (
    <ModulePage title={text.title} wide>
      {!mobile && <ViewTabs todayCount={todayCount} />}
      <Outlet />
      {mobile && <TabBar todayCount={todayCount} />}
    </ModulePage>
  );
};
