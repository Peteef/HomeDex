import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeEach, vi } from 'vitest';
import './i18n.ts';

// jsdom has no modal dialog API. These only toggle the open attribute; focus trapping and the
// inert page are checked by the e2e tests in real browsers.
Object.assign(HTMLDialogElement.prototype, {
  showModal(this: HTMLDialogElement) {
    this.open = true;
  },
  close(this: HTMLDialogElement) {
    this.open = false;
  },
});

// jsdom has no matchMedia; tests run as a touch device unless they stub it themselves.
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(async () => {
  cleanup();
  await i18next.changeLanguage('en');
  vi.unstubAllGlobals();
  localStorage.clear();
});
