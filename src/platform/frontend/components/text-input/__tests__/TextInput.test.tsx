import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextInput } from '../TextInput.tsx';

describe('TextInput', () => {
  it('should be reachable by its label', () => {
    // When
    render(<TextInput label="Username" />);

    // Then
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('should keep the label for screen readers when it is hidden', () => {
    // When
    render(<TextInput label="Find a tile" hideLabel />);

    // Then
    expect(screen.getByText('Find a tile')).toHaveClass('sr-only');
    expect(screen.getByLabelText('Find a tile')).toBeInTheDocument();
  });

  it('should describe the input with the error and mark it invalid when there is an error', () => {
    // When
    render(<TextInput label="Username" error="Username is required" />);

    // Then
    const input = screen.getByLabelText('Username');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Username is required');
    expect(screen.getByRole('alert')).toHaveTextContent('Username is required');
  });

  it('should not be invalid when there is no error', () => {
    // When
    render(<TextInput label="Username" />);

    // Then
    expect(screen.getByLabelText('Username')).toBeValid();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should pass input attributes through', () => {
    // When
    render(<TextInput label="Password" type="password" placeholder="Secret" />);

    // Then
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByPlaceholderText('Secret')).toBeInTheDocument();
  });
});
