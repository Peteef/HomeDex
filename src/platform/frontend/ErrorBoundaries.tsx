import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingStatus } from './components/loading-status/LoadingStatus.tsx';
import { Panel } from './components/panel/Panel.tsx';
import { CrashedPage } from './pages/crashed/CrashedPage.tsx';

interface BoundaryProps {
  children: ReactNode;
}

const reload = (): void => {
  window.location.reload();
};

// A module's page: its code is loaded lazily, so both a failed download and a crash land here,
// and the rest of the app keeps working.
export const ModuleBoundary = ({ children }: BoundaryProps) => (
  <ErrorBoundary fallback={<CrashedPage scope="module" onReload={reload} />}>
    <Suspense
      fallback={
        <Panel>
          <LoadingStatus />
        </Panel>
      }
    >
      {children}
    </Suspense>
  </ErrorBoundary>
);

// The last resort around the whole app. It sits outside the layout, so it centres itself.
export const AppBoundary = ({ children }: BoundaryProps) => (
  <ErrorBoundary
    fallback={
      <main className="safe-area flex min-h-dvh items-center justify-center">
        <CrashedPage scope="app" onReload={reload} />
      </main>
    }
  >
    {children}
  </ErrorBoundary>
);
