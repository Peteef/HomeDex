import { Outlet } from 'react-router';
import { Scene } from './components/scene/Scene.tsx';
import { PageFrame } from './PageFrame.tsx';
import { SCENE_LAYERS } from './sceneLayers.ts';

export const AppLayout = () => (
  <>
    <Scene layers={SCENE_LAYERS} />
    <PageFrame>
      <Outlet />
    </PageFrame>
  </>
);
