import { useLayoutEffect } from 'react';
import { Outlet } from 'react-router';
import { Scene } from './components/scene/Scene.tsx';
import { useTimeOfDay } from './features/time-of-day/index.ts';
import { applyTheme } from './lib/theme/index.ts';
import { PageFrame } from './PageFrame.tsx';
import { SCENE_LAYERS } from './sceneLayers.ts';

export const AppLayout = () => {
  const { theme } = useTimeOfDay();

  // A layout effect runs before the browser paints, so a night visit never flashes the day theme.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // The key gives each scene a fresh Scene, so its pan waits for its own layers to load.
  return (
    <>
      <Scene key={theme} layers={SCENE_LAYERS[theme]} />
      <PageFrame>
        <Outlet />
      </PageFrame>
    </>
  );
};
