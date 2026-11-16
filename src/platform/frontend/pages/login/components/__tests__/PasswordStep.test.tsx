import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PasswordStep } from '../PasswordStep.tsx';
import type { PasswordStepProps } from '../PasswordStep.tsx';

const renderStep = (props: Partial<PasswordStepProps> = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  const onSwitch = props.onSwitch ?? vi.fn();

  const result = render(
    <PasswordStep
      username="Misty"
      welcomeBack={false}
      pending={false}
      failure={null}
      {...props}
      onSubmit={onSubmit}
      onSwitch={onSwitch}
    />,
  );

  return {
    ...result,
    onSubmit,
    onSwitch,
  };
};

const passwordField = () => screen.getByLabelText('Password');

const typePassword = (value: string) => {
  fireEvent.change(passwordField(), { target: { value } });
};

const submit = () => {
  fireEvent.click(screen.getByRole('button', { name: 'I choose you!' }));
};

describe('PasswordStep', () => {
  it('should greet the Trainer by name when the step opens', () => {
    // When
    renderStep();

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Hi, Misty!' })).toBeInTheDocument();
  });

  it('should welcome the Trainer back when the device remembers them', () => {
    // When
    renderStep({ welcomeBack: true });

    // Then
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome back, Misty!' }),
    ).toBeInTheDocument();
  });

  it('should focus the password field when the step opens', () => {
    // When
    renderStep();

    // Then
    expect(passwordField()).toHaveFocus();
  });

  it('should keep a hidden username field when a password manager looks for it', () => {
    // When
    const { container } = renderStep();

    // Then
    expect(container.querySelector('input[name="username"]')).toHaveValue('Misty');
  });

  it('should ask for the password and not submit when the field is empty', () => {
    // Given
    const { onSubmit } = renderStep();

    // When
    submit();

    // Then
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should submit the typed password when the form is sent', () => {
    // Given
    const { onSubmit } = renderStep();
    typePassword('fake-password');

    // When
    submit();

    // Then
    expect(onSubmit).toHaveBeenCalledWith('fake-password');
  });

  it('should clear the field and focus it again when the submit is rejected', async () => {
    // Given
    renderStep({ onSubmit: vi.fn().mockRejectedValue(new Error('no')) });
    typePassword('fake-password');
    screen.getByRole('button', { name: 'I choose you!' }).focus();

    // When
    submit();

    // Then
    await waitFor(() => {
      expect(passwordField()).toHaveValue('');
    });

    expect(passwordField()).toHaveFocus();
  });

  it('should show the failure as an alert when there is one', () => {
    // When
    renderStep({ failure: "That's not the right password. Try again." });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent(
      "That's not the right password. Try again.",
    );
  });

  it('should disable the button and say it is signing in when the login is pending', () => {
    // When
    renderStep({ pending: true });

    // Then
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });

  it('should call onSwitch when the Trainer wants to switch', () => {
    // Given
    const { onSwitch } = renderStep();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Not Misty? Switch Trainer' }));

    // Then
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});
