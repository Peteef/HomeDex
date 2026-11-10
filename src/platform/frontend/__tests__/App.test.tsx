import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App.tsx';

describe('App', () => {
  it('shows the HomeDex placeholder page', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'HomeDex' })).toBeInTheDocument();
  });
});

describe('import aliases', () => {
  it('resolves #platform/frontend through package.json imports', async () => {
    const api = await import('#platform/frontend');
    expect(typeof api).toBe('object');
  });
});
