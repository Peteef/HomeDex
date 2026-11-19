import { Navigate, Route, Routes } from 'react-router';
import { MainPage } from './pages/main/MainPage.tsx';
import { VIEW_PATHS } from './pages/main/internal/views.ts';

const PlantAssistant = () => (
  <Routes>
    <Route index element={<MainPage view="plants" />} />
    <Route path="today" element={<MainPage view="today" />} />
    <Route path="calendar" element={<MainPage view="calendar" />} />
    <Route path="*" element={<Navigate to={VIEW_PATHS.plants} replace />} />
  </Routes>
);

export default PlantAssistant;
