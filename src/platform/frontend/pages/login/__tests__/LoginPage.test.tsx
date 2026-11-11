import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { rememberedAccount } from '../../../features/auth/index.ts';
import {
  accountsList,
  fakeApi,
  renderApp,
  signedIn,
  signedOut,
  status,
  TEST_USER,
} from '../../../__tests__/helpers.tsx';
import type { FakeResponse } from '../../../__tests__/helpers.tsx';

const LOGIN = 'POST /api/auth/login';
const ACCOUNTS = 'GET /api/auth/accounts';
const PICKER_HEADING = "Who's there, Trainer?";
const REMEMBERED_KEY = 'homedex.rememberedAccount';

const openLogin = ({
  login = signedIn(),
  accounts = accountsList('Brock', 'Misty'),
  path = '/login',
}: {
  login?: FakeResponse | (() => Promise<FakeResponse>);
  accounts?: FakeResponse | (() => FakeResponse);
  path?: string;
} = {}) => {
  const api = fakeApi({ 'GET /api/auth/me': signedOut(), [ACCOUNTS]: accounts, [LOGIN]: login });
  renderApp(path);
  return api;
};

const pickerHeading = () => screen.findByRole('heading', { level: 1, name: PICKER_HEADING });

const pick = async (username: string) => {
  fireEvent.click(await screen.findByRole('button', { name: username }));
};

const typePassword = (value: string) => {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value } });
};

const submit = () => {
  fireEvent.click(screen.getByRole('button', { name: 'I choose you!' }));
};

const pickAndSubmit = async () => {
  await pick('Misty');
  typePassword('fake-password');
  submit();
};

describe('LoginPage', () => {
  describe('account picker', () => {
    it('should ask who is there and show a tile for every account', async () => {
      // When
      openLogin();

      // Then
      expect(await pickerHeading()).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Brock' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Misty' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('should keep the picker when there is only one account', async () => {
      // When
      openLogin({ accounts: accountsList('Misty') });

      // Then
      expect(await screen.findByRole('button', { name: 'Misty' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('should explain how to add an account when there are none', async () => {
      // When
      openLogin({ accounts: accountsList() });

      // Then
      expect(await screen.findByText(/No Trainers yet/)).toBeInTheDocument();
      expect(screen.getByText('npm run users -- create').tagName).toBe('CODE');
    });

    it('should offer a retry when the accounts cannot be loaded', async () => {
      // Given
      let reachable = false;
      openLogin({ accounts: () => (reachable ? accountsList('Misty') : status(500)) });
      const retry = await screen.findByRole('button', { name: 'Try again' });
      expect(screen.getByRole('alert')).toHaveTextContent("Can't load the Trainers.");

      // When
      reachable = true;
      fireEvent.click(retry);

      // Then
      expect(await screen.findByRole('button', { name: 'Misty' })).toBeInTheDocument();
    });

    it('should ask for the password of the picked account', async () => {
      // Given
      openLogin();

      // When
      await pick('Misty');

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'Hi, Misty!' })).toBeInTheDocument();
      expect(screen.getByText("Prove it's you.")).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveFocus();
    });
  });

  describe('password step', () => {
    it('should give password managers the username and ask for the current password', async () => {
      // Given
      openLogin();

      // When
      await pick('Misty');

      // Then
      const username = document.querySelector('input[autocomplete="username"]');
      expect(username).toHaveValue('Misty');
      expect(username).not.toBeVisible();
      expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('should sign in, remember the account and open the home screen when the password is right', async () => {
      // Given
      const api = openLogin();

      // When
      await pickAndSubmit();

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: /Hello Misty!/ }),
      ).toBeInTheDocument();

      expect(api.callsTo(LOGIN)[0]?.body).toEqual({ username: 'Misty', password: 'fake-password' });
      expect(rememberedAccount()).toBe('Misty');
    });

    it('should ask for the password and send nothing when it is empty', async () => {
      // Given
      const api = openLogin();
      await pick('Misty');

      // When
      submit();

      // Then
      expect(screen.getByText('Enter your password.')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveFocus();
      expect(api.callsTo(LOGIN)).toHaveLength(0);
    });

    it('should say the password is wrong, then clear and focus it, when the server answers 401', async () => {
      // Given
      openLogin({ login: signedOut() });

      // When
      await pickAndSubmit();

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(
        "That's not the right password. Try again.",
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toHaveFocus();
      });

      expect(screen.getByLabelText('Password')).toHaveValue('');
    });

    it('should ask to wait when there were too many failed attempts', async () => {
      // Given
      openLogin({ login: status(429) });

      // When
      await pickAndSubmit();

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Too many failed attempts. Try again in a few minutes.',
      );
    });

    it('should show a general message when the server fails', async () => {
      // Given
      openLogin({ login: status(500) });

      // When
      await pickAndSubmit();

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Something went wrong. Try again.',
      );
    });

    it('should disable the button while the login is on its way', async () => {
      // Given
      let answer: (response: FakeResponse) => void = () => undefined;

      openLogin({
        login: () =>
          new Promise<FakeResponse>((resolve) => {
            answer = resolve;
          }),
      });

      // When
      await pickAndSubmit();

      // Then
      const button = await screen.findByRole('button', { name: 'Signing in…' });
      expect(button).toBeDisabled();
      answer(signedIn());
      expect(await screen.findByRole('heading', { name: /Hello Misty!/ })).toBeInTheDocument();
    });

    it('should go back to the picker when the user switches Trainer', async () => {
      // Given
      openLogin();
      await pick('Misty');

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Not Misty? Switch Trainer' }));

      // Then
      expect(await pickerHeading()).toBeInTheDocument();
    });
  });

  describe('remembered account', () => {
    it('should welcome the remembered account back and ask only for the password', async () => {
      // Given
      localStorage.setItem(REMEMBERED_KEY, 'Misty');

      // When
      openLogin();

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Welcome back, Misty!' }),
      ).toBeInTheDocument();

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should forget the remembered account and show the picker when the user switches Trainer', async () => {
      // Given
      localStorage.setItem(REMEMBERED_KEY, 'Misty');
      openLogin();

      // When
      fireEvent.click(await screen.findByRole('button', { name: 'Not Misty? Switch Trainer' }));

      // Then
      expect(await pickerHeading()).toBeInTheDocument();
      expect(rememberedAccount()).toBeNull();
    });

    it('should show the picker when the remembered account no longer exists', async () => {
      // Given
      localStorage.setItem(REMEMBERED_KEY, 'Gary');

      // When
      openLogin();

      // Then
      expect(await screen.findByRole('button', { name: 'Misty' })).toBeInTheDocument();
      expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
    });
  });

  it('should open the screen that asked for the login when it succeeds', async () => {
    // Given
    openLogin({ path: '/nowhere' });

    // When
    await pickAndSubmit();

    // Then
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
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

  describe('language', () => {
    it('should switch the page to the language the user picks and remember it', async () => {
      // Given
      openLogin();
      await pickerHeading();

      // When
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
        target: { value: 'pl' },
      });

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Który Trener tym razem?' }),
      ).toBeInTheDocument();

      expect(document.documentElement.lang).toBe('pl');
      expect(localStorage.getItem('homedex.language')).toBe('pl');
    });
  });
});
