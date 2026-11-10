import { Route, Routes } from 'react-router';
import { HomePage } from './shell/HomePage.tsx';
import { LoginPage } from './shell/LoginPage.tsx';
import { ModulePage } from './shell/ModulePage.tsx';
import { NotFoundPage } from './shell/NotFoundPage.tsx';
import { ShellLayout } from './shell/ShellLayout.tsx';
import { HOME_PATH, LOGIN_PATH, MODULE_ROUTE_PATTERN } from './shell/routes.ts';

export const App = () => {
  return (
    <Routes>
      <Route element={<ShellLayout />}>
        <Route path={HOME_PATH} element={<HomePage />} />
        <Route path={LOGIN_PATH} element={<LoginPage />} />
        <Route path={MODULE_ROUTE_PATTERN} element={<ModulePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
