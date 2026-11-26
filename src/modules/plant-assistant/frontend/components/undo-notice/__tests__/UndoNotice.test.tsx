import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UndoNotice } from '../UndoNotice.tsx';

const handlers = () => ({
  onPause: vi.fn(),
  onResume: vi.fn(),
});

describe('UndoNotice', () => {
  it('should keep an empty live region while there is no message', () => {
    // When
    render(<UndoNotice message={null} {...handlers()} />);

    // Then
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('should show the message with Undo', () => {
    // Given
    const onUndo = vi.fn();
    render(<UndoNotice message="Bulbasaur's fern watered." onUndo={onUndo} {...handlers()} />);
    expect(screen.getByRole('status')).toHaveTextContent("Bulbasaur's fern watered.");

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('should show a message without Undo', () => {
    // When
    render(<UndoNotice message="Someone already took care of it." {...handlers()} />);

    // Then
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should disable Undo while undoing', () => {
    // When
    render(<UndoNotice message="Watered." undoing onUndo={vi.fn()} {...handlers()} />);

    // Then
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('should pause while it has the pointer or the focus, and resume after', () => {
    // Given
    const { onPause, onResume } = handlers();

    render(
      <UndoNotice message="Watered." onUndo={vi.fn()} onPause={onPause} onResume={onResume} />,
    );

    const undo = screen.getByRole('button', { name: 'Undo' });

    // When
    fireEvent.pointerEnter(undo);
    fireEvent.pointerLeave(undo);
    fireEvent.focus(undo);
    fireEvent.blur(undo);

    // Then
    expect(onPause).toHaveBeenCalledTimes(2);
    expect(onResume).toHaveBeenCalledTimes(2);
  });
});
