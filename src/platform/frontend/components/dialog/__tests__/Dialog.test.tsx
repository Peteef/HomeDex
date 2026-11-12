import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from '../Dialog.tsx';

const renderDialog = (open: boolean, onClose = vi.fn()) => {
  const view = render(
    <Dialog open={open} title="Add tile" onClose={onClose}>
      <button type="button">Inside</button>
    </Dialog>,
  );

  return {
    ...view,
    onClose,
  };
};

const dialog = () => screen.getByRole('dialog', { hidden: true });

const WithOpener = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Dialog
        open={open}
        title="Add tile"
        onClose={() => {
          setOpen(false);
        }}
      >
        <p>Content</p>
      </Dialog>
    </>
  );
};

describe('Dialog', () => {
  it('should open as a modal named by its title', () => {
    // When
    renderDialog(true);

    // Then
    expect(screen.getByRole('dialog', { name: 'Add tile' })).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument();
  });

  it('should take the focus itself when it opens, not its first button', () => {
    // When
    renderDialog(true);

    // Then
    expect(dialog()).toHaveFocus();
  });

  it('should render neither the open state nor the content when closed', () => {
    // When
    renderDialog(false);

    // Then
    expect(dialog()).not.toHaveAttribute('open');
    expect(screen.queryByRole('button', { name: 'Inside', hidden: true })).not.toBeInTheDocument();
  });

  it('should ask to close when the close button is clicked', () => {
    // Given
    const { onClose } = renderDialog(true);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Then
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should ask to close on Escape instead of closing by itself', () => {
    // Given
    const { onClose } = renderDialog(true);
    const escape = new Event('cancel', { cancelable: true });

    // When
    dialog().dispatchEvent(escape);

    // Then
    expect(onClose).toHaveBeenCalledOnce();
    expect(escape.defaultPrevented).toBe(true);
  });

  it('should ask to close when the backdrop is clicked', () => {
    // Given
    const { onClose } = renderDialog(true);

    // When
    fireEvent.click(dialog());

    // Then
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should stay open when its content is clicked', () => {
    // Given
    const { onClose } = renderDialog(true);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Inside' }));

    // Then
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should lock the page scroll while open and release it when closed', () => {
    // Given
    const { rerender } = renderDialog(true);
    expect(document.documentElement.style.overflow).toBe('hidden');

    // When
    rerender(
      <Dialog open={false} title="Add tile" onClose={vi.fn()}>
        <p>Content</p>
      </Dialog>,
    );

    // Then
    expect(document.documentElement.style.overflow).toBe('');
    expect(dialog()).not.toHaveAttribute('open');
  });

  it('should give the focus back to the opener when closed', () => {
    // Given
    render(<WithOpener />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    fireEvent.click(opener);
    screen.getByRole('button', { name: 'Close' }).focus();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Then
    expect(opener).toHaveFocus();
  });
});
