import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { novemberWeeks } from '../../__tests__/calendarFixtures.ts';
import { calendarFormat } from '../../internal/calendarFormat.ts';
import { WeekdayRow } from '../WeekdayRow.tsx';

describe('WeekdayRow', () => {
  it('should show short weekday names, and the full ones to screen readers', () => {
    // When
    render(
      <table>
        <WeekdayRow week={novemberWeeks()[0] ?? []} format={calendarFormat('en')} />
      </table>,
    );

    // Then
    const [monday] = screen.getAllByRole('columnheader');
    expect(monday?.firstChild).toHaveTextContent('Mon');
    expect(monday?.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(monday?.lastChild).toHaveTextContent('Monday');
  });
});
