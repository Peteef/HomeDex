import { Outlet } from 'react-router';
import { Scene } from './components/scene/Scene.tsx';
import { SCENE_LAYERS } from './sceneLayers.ts';

export const AppLayout = () => (
  <>
    <Scene layers={SCENE_LAYERS} />
    <main className="safe-area flex min-h-dvh items-center justify-center">
      <Outlet />
    </main>
  </>
);
