import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextArea } from '../TextArea.tsx';

describe('TextArea', () => {
  it('should be reachable by its label', () => {
    // When
    render(<TextArea label="Description" />);

    // Then
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
  });

  it('should describe the field with the error and mark it invalid when there is an error', () => {
    // When
    render(<TextArea label="Description" error="Use at most 1000 characters." />);

    // Then
    const field = screen.getByRole('textbox', { name: 'Description' });
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('Use at most 1000 characters.');
    expect(screen.getByRole('alert')).toHaveTextContent('Use at most 1000 characters.');
  });

  it('should not be invalid when there is no error', () => {
    // When
    render(<TextArea label="Description" />);

    // Then
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeValid();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should pass textarea attributes through', () => {
    // When
    render(<TextArea label="Description" rows={4} maxLength={1000} />);

    // Then
    const field = screen.getByRole('textbox', { name: 'Description' });
    expect(field).toHaveAttribute('rows', '4');
    expect(field).toHaveAttribute('maxlength', '1000');
  });
});
