import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageFrame } from '../PageFrame.tsx';

describe('PageFrame', () => {
  it('should show the page inside main', () => {
    // When
    render(
      <PageFrame>
        <h1>Hi</h1>
      </PageFrame>,
    );

    // Then
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Hi' }));
  });

  it('should show the footer with the app version below the page', () => {
    // When
    render(
      <PageFrame>
        <h1>Hi</h1>
      </PageFrame>,
    );

    // Then
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'HomeDex v0.0.0-test · Developed by Peteef · 2026',
    );

    expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('contentinfo'));
  });
});
