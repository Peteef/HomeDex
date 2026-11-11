import { useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { redirectTarget } from '../../auth/redirect.ts';
import { useLogin, useSession } from '../../auth/session.ts';
import { Button } from '../../components/button/Button.tsx';
import { Panel } from '../../components/panel/Panel.tsx';
import { TextInput } from '../../components/text-input/TextInput.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';
import { fieldErrors, loginFailureMessage } from './loginMessages.ts';
import type { FieldErrors } from './loginMessages.ts';

export const LoginPage = () => {
  const location = useLocation();
  const session = useSession();
  const login = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);

  if (session.data) {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  const focusFirstInvalid = (invalid: FieldErrors) => {
    (invalid.username ? usernameInput : passwordInput).current?.focus();
  };

  const retryPassword = () => {
    setPassword('');
    passwordInput.current?.focus();
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = fieldErrors(username, password);
    setErrors(invalid);
    if (invalid.username ?? invalid.password) {
      focusFirstInvalid(invalid);
      return;
    }
    login.mutate({ username, password }, { onError: retryPassword });
  };

  return (
    <Panel className="flex flex-col gap-4">
      <Wordmark />
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold">Sign in</h1>
        <p className="text-dex-ink-muted text-base">Welcome back, Trainer</p>
      </div>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextInput
          ref={usernameInput}
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
          }}
          {...(errors.username && { error: errors.username })}
        />
        <TextInput
          ref={passwordInput}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          {...(errors.password && { error: errors.password })}
        />
        {login.isError ? (
          <p role="alert" className="text-dex-red-deep text-base font-bold">
            {loginFailureMessage(login.error)}
          </p>
        ) : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Panel>
  );
};
