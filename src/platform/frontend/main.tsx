import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
import { AppBoundary } from './ErrorBoundaries.tsx';
import { applyTimeOfDay, currentTime, timeOfDayAt } from './features/time-of-day/index.ts';
import { appQueryClient } from './queryClient.ts';
import './i18n.ts';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// Before the first render, so a night visit never flashes the day colours.
applyTimeOfDay(timeOfDayAt(currentTime()));

createRoot(root).render(
  <StrictMode>
    <AppBoundary>
      <QueryClientProvider client={appQueryClient()}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppBoundary>
  </StrictMode>,
);
