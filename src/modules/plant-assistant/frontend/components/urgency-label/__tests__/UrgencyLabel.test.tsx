import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import { UrgencyLabel } from '../UrgencyLabel.tsx';
import type { Urgency } from '../UrgencyLabel.tsx';

const renderLabel = (urgency: Urgency, daysUntil: number) =>
  render(<UrgencyLabel urgency={urgency} daysUntil={daysUntil} />);

describe('UrgencyLabel', () => {
  it('should say how many days overdue in red with an alert icon', () => {
    // When
    const { container } = renderLabel('overdue', -3);

    // Then
    const label = screen.getByText('3 days overdue');
    expect(label).toHaveClass('text-dex-red-text', 'bg-dex-red-soft', 'font-extrabold');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should say today in amber on a soft background', () => {
    // When
    renderLabel('today', 0);

    // Then
    expect(screen.getByText('Today')).toHaveClass(
      'text-dex-amber-text',
      'bg-dex-amber-soft',
      'font-extrabold',
    );
  });

  it('should say tomorrow in amber when due in one day', () => {
    // When
    renderLabel('soon', 1);

    // Then
    expect(screen.getByText('Tomorrow')).toHaveClass('text-dex-amber-text');
  });

  it('should say in how many days in amber when due soon', () => {
    // When
    renderLabel('soon', 2);

    // Then
    expect(screen.getByText('In 2 days')).toHaveClass('text-dex-amber-text');
  });

  it('should say in how many days in green when due later', () => {
    // When
    const { container } = renderLabel('later', 9);

    // Then
    expect(screen.getByText('In 9 days')).toHaveClass('text-dex-green-text');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it.each([
    [1, '1 day overdue'],
    [2, '2 days overdue'],
    [5, '5 days overdue'],
    [22, '22 days overdue'],
  ])('should use the English plural when %i days overdue', (days, expected) => {
    // When
    renderLabel('overdue', -days);

    // Then
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    [5, 'In 5 days'],
    [22, 'In 22 days'],
  ])('should use the English plural when due in %i days', (days, expected) => {
    // When
    renderLabel('later', days);

    // Then
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    [1, '1 dzień po terminie'],
    [2, '2 dni po terminie'],
    [5, '5 dni po terminie'],
    [22, '22 dni po terminie'],
  ])('should use the Polish plural when %i days overdue', async (days, expected) => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderLabel('overdue', -days);

    // Then
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    [1, 'Jutro'],
    [2, 'Za 2 dni'],
    [5, 'Za 5 dni'],
    [22, 'Za 22 dni'],
  ])('should use the Polish text when due in %i days', async (days, expected) => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderLabel(days < 3 ? 'soon' : 'later', days);

    // Then
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
