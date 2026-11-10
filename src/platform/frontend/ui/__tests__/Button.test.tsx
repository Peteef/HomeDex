import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button.tsx';

describe('Button', () => {
  it('should call onClick when it is clicked', () => {
    // Given
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Then
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should not submit a form when no type is given', () => {
    // When
    render(<Button>Save</Button>);

    // Then
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('should not call onClick when it is disabled', () => {
    // Given
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Then
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should keep a 44 pt touch target for every variant', () => {
    // When
    render(
      <>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
      </>,
    );

    // Then
    expect(screen.getByRole('button', { name: 'Primary' })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: 'Secondary' })).toHaveClass('min-h-11');
  });
});
