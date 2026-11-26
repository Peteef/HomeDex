import { ModulePage } from '#platform/frontend';
import { Outlet } from 'react-router';
import { useText } from './locales/index.ts';
import { TabBar } from './TabBar.tsx';
import { useIsMobile } from './useIsMobile.ts';
import { ViewTabs } from './ViewTabs.tsx';

export const ModuleLayout = () => {
  const text = useText('layout');
  const mobile = useIsMobile();

  return (
    <ModulePage title={text.title} wide>
      {!mobile && <ViewTabs />}
      <Outlet />
      {mobile && <TabBar />}
    </ModulePage>
  );
};
