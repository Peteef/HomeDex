import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, vi } from 'vitest';
import './i18n.ts';

afterEach(async () => {
  cleanup();
  await i18next.changeLanguage('en');
  vi.unstubAllGlobals();
  localStorage.clear();
});
