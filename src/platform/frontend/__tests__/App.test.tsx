import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App.tsx';

describe('App', () => {
  it('should show the HomeDex placeholder page', () => {
    // When
    render(<App />);

    // Then
    expect(screen.getByRole('heading', { name: 'HomeDex' })).toBeInTheDocument();
  });

  describe('import aliases', () => {
    it('should resolve #platform/frontend through package.json imports', async () => {
      // When
      const api = await import('#platform/frontend');

      // Then
      expect(typeof api).toBe('object');
    });
  });
});
