import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { formatDexNo, TileCard } from '../TileCard.tsx';
import type { TileCardProps } from '../TileCard.tsx';

const renderTile = (props: Partial<TileCardProps> = {}) => {
  const all: TileCardProps = {
    dexNo: 7,
    icon: 'wallet',
    title: 'Finances',
    href: 'https://example.com/finances',
    external: true,
    pinned: false,
    onTogglePin: vi.fn(),
    ...props,
  };
  render(
    <MemoryRouter>
      <TileCard {...all} />
    </MemoryRouter>,
  );
  return all;
};

describe('TileCard', () => {
  describe('formatDexNo', () => {
    it('should pad the number to three digits', () => {
      // When / Then
      expect(formatDexNo(7)).toBe('No. 007');
      expect(formatDexNo(42)).toBe('No. 042');
    });

    it('should not cut a number longer than three digits', () => {
      // When / Then
      expect(formatDexNo(1234)).toBe('No. 1234');
    });
  });

  it('should show the Dex number, title and description', () => {
    // When
    renderTile({ description: 'Monthly budget' });

    // Then
    expect(screen.getByText('No. 007')).toBeInTheDocument();
    expect(screen.getByText('Finances')).toBeInTheDocument();
    expect(screen.getByText('Monthly budget')).toBeInTheDocument();
  });

  it('should render without a description', () => {
    // When
    renderTile();

    // Then
    expect(screen.getByRole('link')).toHaveTextContent(/^No\. 007Finances/);
  });

  it('should open an external link in a new tab without leaking the opener', () => {
    // When
    renderTile();

    // Then
    const link = screen.getByRole('link', { name: /Finances/ });
    expect(link).toHaveAttribute('href', 'https://example.com/finances');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it('should navigate inside the app when the link is not external', () => {
    // When
    renderTile({ href: '/m/shopping-list', external: false });

    // Then
    const link = screen.getByRole('link', { name: /Finances/ });
    expect(link).toHaveAttribute('href', '/m/shopping-list');
    expect(link).not.toHaveAttribute('target');
  });

  it('should show whether the tile is pinned', () => {
    // When
    renderTile({ pinned: true });

    // Then
    expect(screen.getByRole('button', { name: 'Pin Finances' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should call onTogglePin when the pin control is clicked', () => {
    // Given
    const { onTogglePin } = renderTile();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Pin Finances' }));

    // Then
    expect(onTogglePin).toHaveBeenCalledOnce();
  });

  it('should not open the link when the pin control is clicked', () => {
    // Given
    renderTile();
    const link = screen.getByRole('link');
    const opened = vi.fn();
    link.addEventListener('click', opened);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Pin Finances' }));

    // Then
    expect(opened).not.toHaveBeenCalled();
  });
});
