import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MonthHeaderProps } from '../MonthHeader.tsx';
import { MonthHeader } from '../MonthHeader.tsx';

const renderHeader = (props: Partial<MonthHeaderProps> = {}) => {
  const handlers = {
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onToday: vi.fn(),
  };

  render(<MonthHeader title="November 2026" canGoBack canGoForward {...handlers} {...props} />);
  return handlers;
};

describe('MonthHeader', () => {
  it('should show the month', () => {
    // When
    renderHeader();

    // Then
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
  });

  it.each([
    ['Previous month', 'onPrevious'],
    ['Next month', 'onNext'],
    ['Today', 'onToday'],
  ] as const)('should move with %s', (button, handler) => {
    // Given
    const handlers = renderHeader();

    // When
    fireEvent.click(screen.getByRole('button', { name: button }));

    // Then
    expect(handlers[handler]).toHaveBeenCalledOnce();
  });

  it('should not go back before the current month or past the last one', () => {
    // When
    renderHeader({ canGoBack: false, canGoForward: false });

    // Then
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });
});
