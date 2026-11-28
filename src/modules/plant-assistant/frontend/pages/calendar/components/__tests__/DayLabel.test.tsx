import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FERN, novemberWeeks } from '../../__tests__/calendarFixtures.ts';
import { calendarFormat } from '../../internal/calendarFormat.ts';
import { DayLabel } from '../DayLabel.tsx';

const FORMAT = calendarFormat('en');
const [week = []] = novemberWeeks();
const [, , , , friday, saturday] = week;

describe('DayLabel', () => {
  it('should say the date, today and the plants to water', () => {
    // When
    const { container } = render(
      friday === undefined ? null : (
        <DayLabel day={{ ...friday, plants: [FERN] }} format={FORMAT} />
      ),
    );

    // Then
    expect(container).toHaveTextContent('Friday, November 20, today, 1 plant to water');
  });

  it('should say only the date of another day without plants', () => {
    // When
    const { container } = render(
      saturday === undefined ? null : <DayLabel day={saturday} format={FORMAT} />,
    );

    // Then
    expect(container).toHaveTextContent(/^Saturday, November 21$/);
  });
});
