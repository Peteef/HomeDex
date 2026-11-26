import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PostponeChoice } from '../PostponeChoice.tsx';

const renderChoice = (props: { postponing?: boolean; failed?: boolean } = {}) => {
  const onPostpone = vi.fn();
  render(<PostponeChoice postponing={false} failed={false} onPostpone={onPostpone} {...props} />);
  return onPostpone;
};

const postponeByOther = (days: string) => {
  fireEvent.change(screen.getByLabelText('Other number of days'), { target: { value: days } });
  fireEvent.click(screen.getByRole('button', { name: 'Postpone' }));
};

describe('PostponeChoice', () => {
  it.each([
    ['1 day', 1],
    ['2 days', 2],
    ['3 days', 3],
  ])('should postpone by %s in one tap', (button, days) => {
    // Given
    const onPostpone = renderChoice();

    // When
    fireEvent.click(screen.getByRole('button', { name: button }));

    // Then
    expect(onPostpone).toHaveBeenCalledWith(days);
  });

  it.each([
    ['1', 1],
    ['30', 30],
  ])('should postpone by another number of days, %s', (text, days) => {
    // Given
    const onPostpone = renderChoice();

    // When
    postponeByOther(text);

    // Then
    expect(onPostpone).toHaveBeenCalledWith(days);
  });

  it.each(['0', '31'])('should refuse %s days with a message', (text) => {
    // Given
    const onPostpone = renderChoice();

    // When
    postponeByOther(text);

    // Then
    expect(onPostpone).not.toHaveBeenCalled();

    expect(screen.getByLabelText('Other number of days')).toHaveAccessibleDescription(
      'Enter whole days from 1 to 30.',
    );
  });

  it('should disable the choices while postponing', () => {
    // When
    renderChoice({ postponing: true });

    // Then
    expect(screen.getByRole('button', { name: '1 day' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Postpone' })).toBeDisabled();
  });

  it('should say so when postponing failed', () => {
    // When
    renderChoice({ failed: true });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent("Can't postpone. Try again.");
  });
});
