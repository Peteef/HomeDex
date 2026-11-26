import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { calendarFormat } from '../../internal/calendarFormat.ts';
import { DesktopPastDayCell } from '../DesktopPastDayCell.tsx';

describe('DesktopPastDayCell', () => {
  it('should show the day, named for screen readers, without a button', () => {
    // When
    render(
      <table>
        <tbody>
          <tr>
            <DesktopPastDayCell
              day={{ date: '2026-11-19', inMonth: true, isToday: false, isPast: true, plants: [] }}
              format={calendarFormat('en')}
            />
          </tr>
        </tbody>
      </table>,
    );

    // Then
    expect(screen.getByText('Thursday, November 19')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
