import { Navigate, Route, Routes } from 'react-router';
import { ModuleLayout } from './ModuleLayout.tsx';
import { AllPlantsPage } from './pages/all-plants/AllPlantsPage.tsx';
import { CalendarPage } from './pages/calendar/CalendarPage.tsx';
import { TodayPage } from './pages/today/TodayPage.tsx';
import { VIEW_PATHS } from './views.ts';

const PlantAssistant = () => (
  <Routes>
    <Route element={<ModuleLayout />}>
      <Route index element={<AllPlantsPage />} />
      <Route path="today" element={<TodayPage />} />
      <Route path="calendar" element={<CalendarPage />} />
    </Route>
    <Route path="*" element={<Navigate to={VIEW_PATHS.plants} replace />} />
  </Routes>
);

export default PlantAssistant;
