import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { definedProps } from '../../../../shared/objects/definedProps.ts';
import { Tile } from '../Tile.tsx';
import type { TileProps } from '../Tile.tsx';

const renderTile = (props: Partial<TileProps> = {}) => {
  const all: TileProps = {
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
      <Tile {...all} />
    </MemoryRouter>,
  );

  return all;
};

describe('Tile', () => {
  it('should pad the Dex number to three digits', () => {
    // When
    renderTile({ dexNo: 42 });

    // Then
    expect(screen.getByText('No. 042')).toBeInTheDocument();
  });

  it('should not cut a Dex number longer than three digits', () => {
    // When
    renderTile({ dexNo: 1234 });

    // Then
    expect(screen.getByText('No. 1234')).toBeInTheDocument();
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

  it('should show the badge and say its count in the link name when there is a badge', () => {
    // When
    renderTile({ countOnBadge: 3 });

    // Then
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAccessibleName(/Finances, 3 waiting/);
  });

  it('should say the full count in the link name when the badge shows 99+', () => {
    // When
    renderTile({ countOnBadge: 100 });

    // Then
    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAccessibleName(/Finances, 100 waiting/);
  });

  it.each([
    [1, '1 czeka'],
    [3, '3 czekają'],
    [5, '5 czeka'],
    [22, '22 czekają'],
  ])('should say %i in Polish as "%s" when the language is Polish', async (countOnBadge, words) => {
    // Given
    await i18next.changeLanguage('pl');

    // When
    renderTile({ countOnBadge });

    // Then
    expect(screen.getByRole('link')).toHaveAccessibleName(new RegExp(`Finances, ${words}`));
  });

  it.each([undefined, 0])('should show no badge when the count is %s', (countOnBadge) => {
    // When
    renderTile(definedProps({ countOnBadge }));

    // Then
    expect(screen.getByRole('link')).not.toHaveAccessibleName(/waiting/);
    expect(screen.queryByText(/^\d+\+?$/)).not.toBeInTheDocument();
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

  it('should offer no edit button without onEdit', () => {
    // When
    renderTile();

    // Then
    expect(screen.queryByRole('button', { name: 'Edit Finances' })).not.toBeInTheDocument();
  });

  it('should call onEdit when the edit button is clicked', () => {
    // Given
    const onEdit = vi.fn();
    renderTile({ onEdit });

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Edit Finances' }));

    // Then
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('should call onEdit when the tile is held', () => {
    // Given
    vi.useFakeTimers();
    const onEdit = vi.fn();
    renderTile({ onEdit });

    // When
    fireEvent.pointerDown(screen.getByRole('link'), { pointerType: 'touch' });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Then
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.getByRole('article')).toHaveAttribute('data-press', 'held');
    vi.useRealTimers();
  });

  it('should show the hold while a touch is held', () => {
    // Given
    renderTile({ onEdit: vi.fn() });

    // When
    fireEvent.pointerDown(screen.getByRole('link'), { pointerType: 'touch' });

    // Then
    expect(screen.getByRole('article')).toHaveAttribute('data-press', 'holding');
  });
});
