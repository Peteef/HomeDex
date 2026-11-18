import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { Scene } from './components/scene/Scene.tsx';
import { applyTimeOfDay, useTimeOfDay } from './features/time-of-day/index.ts';
import { PageFrame } from './PageFrame.tsx';
import { SCENE_LAYERS } from './sceneLayers.ts';

export const AppLayout = () => {
  const { timeOfDay } = useTimeOfDay();

  useEffect(() => {
    applyTimeOfDay(timeOfDay);
  }, [timeOfDay]);

  // The key gives each scene a fresh Scene, so its pan waits for its own layers to load.
  return (
    <>
      <Scene key={timeOfDay} layers={SCENE_LAYERS[timeOfDay]} />
      <PageFrame>
        <Outlet />
      </PageFrame>
    </>
  );
};
