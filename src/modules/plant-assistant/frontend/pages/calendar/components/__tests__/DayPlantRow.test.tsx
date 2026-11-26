import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FERN } from '../../__tests__/calendarFixtures.ts';
import { DayPlantRow } from '../DayPlantRow.tsx';

const renderRow = () => {
  const onOpen = vi.fn();

  render(
    <ul>
      <DayPlantRow plant={FERN} onOpen={onOpen} />
    </ul>,
  );

  return onOpen;
};

describe('DayPlantRow', () => {
  it('should show the plant with its urgency', () => {
    // When
    renderRow();

    // Then
    expect(screen.getByRole('button')).toHaveTextContent("Bulbasaur's fern3 days overdue");
  });

  it('should open the plant', () => {
    // Given
    const onOpen = renderRow();

    // When
    fireEvent.click(screen.getByRole('button'));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });
});
