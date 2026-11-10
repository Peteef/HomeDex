import { Outlet } from 'react-router';
import { Scene } from '../scene/Scene.tsx';

export const ShellLayout = () => {
  return (
    <>
      <Scene />
      <main className="safe-area flex min-h-dvh items-center justify-center">
        <Outlet />
      </main>
    </>
  );
};
