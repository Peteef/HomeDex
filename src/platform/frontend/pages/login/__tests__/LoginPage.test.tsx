import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  fakeApi,
  renderApp,
  signedIn,
  signedOut,
  status,
  TEST_USER,
} from '../../../__tests__/helpers.tsx';
import type { FakeResponse } from '../../../__tests__/helpers.tsx';

const LOGIN = 'POST /api/auth/login';

const openLogin = (
  loginResponse: FakeResponse | (() => Promise<FakeResponse>),
  path = '/login',
) => {
  const api = fakeApi({ 'GET /api/auth/me': signedOut(), [LOGIN]: loginResponse });
  renderApp(path);
  return api;
};

const type = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const submit = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

const fillAndSubmit = () => {
  type('Username', 'Misty');
  type('Password', 'fake-password');
  submit();
};

describe('LoginPage', () => {
  it('should greet the trainer above the form', () => {
    // When
    openLogin(signedIn());

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Trainer')).toBeInTheDocument();
  });

  it('should ask the browser to fill a saved login', () => {
    // When
    openLogin(signedIn());

    // Then
    expect(screen.getByLabelText('Username')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Username')).toHaveAttribute('autocapitalize', 'none');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('should send the credentials and open the home screen when they are right', async () => {
    // Given
    const api = openLogin(signedIn());

    // When
    fillAndSubmit();

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: /Hello Misty!/ }),
    ).toBeInTheDocument();
    expect(api.callsTo(LOGIN)[0]?.body).toEqual({ username: 'Misty', password: 'fake-password' });
  });

  it('should show field errors and focus the username when both fields are empty', () => {
    // Given
    const api = openLogin(signedIn());

    // When
    submit();

    // Then
    expect(screen.getByText('Enter your username.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveFocus();
    expect(api.callsTo(LOGIN)).toHaveLength(0);
  });

  it('should focus the password when only the password is missing', () => {
    // Given
    openLogin(signedIn());
    type('Username', 'Misty');

    // When
    submit();

    // Then
    expect(screen.queryByText('Enter your username.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('should treat a username of spaces as missing', () => {
    // Given
    openLogin(signedIn());
    type('Username', '   ');
    type('Password', 'fake-password');

    // When
    submit();

    // Then
    expect(screen.getByText('Enter your username.')).toBeInTheDocument();
  });

  it('should say that the login is wrong without naming the field when the server answers 401', async () => {
    // Given
    openLogin(signedOut());

    // When
    fillAndSubmit();

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password.');
  });

  it('should clear and focus the password when the login fails', async () => {
    // Given
    openLogin(signedOut());

    // When
    fillAndSubmit();

    // Then
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toHaveFocus();
    });
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Username')).toHaveValue('Misty');
  });

  it('should ask to wait when there were too many failed attempts', async () => {
    // Given
    openLogin(status(429));

    // When
    fillAndSubmit();

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many failed attempts. Try again in a few minutes.',
    );
  });

  it('should show a general message when the server fails', async () => {
    // Given
    openLogin(status(500));

    // When
    fillAndSubmit();

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
  });

  it('should disable the button while the login is on its way', async () => {
    // Given
    let answer: (response: FakeResponse) => void = () => undefined;
    openLogin(
      () =>
        new Promise<FakeResponse>((resolve) => {
          answer = resolve;
        }),
    );

    // When
    fillAndSubmit();

    // Then
    const button = await screen.findByRole('button', { name: 'Signing in…' });
    expect(button).toBeDisabled();
    answer(signedIn());
    expect(await screen.findByRole('heading', { name: /Hello Misty!/ })).toBeInTheDocument();
  });

  it('should open the screen that asked for the login when it succeeds', async () => {
    // Given
    openLogin(signedIn(), '/m/shopping-list');
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });

    // When
    fillAndSubmit();

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Module not available' }),
    ).toBeInTheDocument();
  });

  it('should open home when a signed-in user opens the login page', async () => {
    // Given
    fakeApi({ 'GET /api/auth/me': signedIn(TEST_USER) });

    // When
    renderApp('/login');

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: /Hello Misty!/ }),
    ).toBeInTheDocument();
  });
});
