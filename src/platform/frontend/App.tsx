import { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { LoadingStatus } from './components/loading-status/LoadingStatus.tsx';
import { MODULE_PAGES } from './features/modules/index.ts';
import { HomePage } from './pages/home/HomePage.tsx';
import { LoginPage } from './pages/login/LoginPage.tsx';
import { NotFoundPage } from './pages/not-found/NotFoundPage.tsx';
import { AppLayout } from './AppLayout.tsx';
import { RequireAuth } from './RequireAuth.tsx';
import { HOME_PATH, LOGIN_PATH } from './routes.ts';

export const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path={LOGIN_PATH} element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path={HOME_PATH} element={<HomePage />} />
        {MODULE_PAGES.map(({ id, route, Page }) => (
          <Route
            key={id}
            path={`${route}/*`}
            element={
              <Suspense fallback={<LoadingStatus />}>
                <Page />
              </Suspense>
            }
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);
