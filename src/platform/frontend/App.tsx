import { Route, Routes } from 'react-router';
import { HomePage } from './pages/home/HomePage.tsx';
import { LoginPage } from './pages/login/LoginPage.tsx';
import { ModulePage } from './pages/module/ModulePage.tsx';
import { NotFoundPage } from './pages/not-found/NotFoundPage.tsx';
import { AppLayout } from './AppLayout.tsx';
import { RequireAuth } from './RequireAuth.tsx';
import { HOME_PATH, LOGIN_PATH, MODULE_ROUTE_PATTERN } from './routes.ts';

export const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path={LOGIN_PATH} element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path={HOME_PATH} element={<HomePage />} />
        <Route path={MODULE_ROUTE_PATTERN} element={<ModulePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);
