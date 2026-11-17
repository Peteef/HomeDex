import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from '../Footer.tsx';

describe('Footer', () => {
  it('should credit the developer with the app version when it is shown', () => {
    // When
    render(<Footer version="v1.0.2" />);

    // Then
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'HomeDex v1.0.2 · Developed by Peteef · 2026',
    );
  });
});
