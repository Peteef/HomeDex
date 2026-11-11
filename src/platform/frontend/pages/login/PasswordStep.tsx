import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useLogin } from '../../features/auth/index.ts';
import { Avatar } from '../../components/avatar/Avatar.tsx';
import { Button } from '../../components/button/Button.tsx';
import { TextInput } from '../../components/text-input/TextInput.tsx';
import { loginFailureMessage, passwordError } from './loginMessages.ts';

export interface PasswordStepProps {
  username: string;
  welcomeBack: boolean;
  onSwitch: () => void;
}

export const PasswordStep = ({ username, welcomeBack, onSwitch }: PasswordStepProps) => {
  const login = useLogin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const passwordInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordInput.current?.focus();
  }, []);

  const retryPassword = () => {
    setPassword('');
    passwordInput.current?.focus();
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = passwordError(password);
    setError(missing);

    if (missing) {
      passwordInput.current?.focus();
      return;
    }

    login.mutate({ username, password }, { onError: retryPassword });
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar name={username} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-3xl font-extrabold break-words">
            {welcomeBack ? `Welcome back, ${username}!` : `Hi, ${username}!`}
          </h1>
          <p className="text-dex-ink-muted text-base">Prove it&apos;s you.</p>
        </div>
      </div>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        {/* Password managers match a saved password by its username field. */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          readOnly
          hidden
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
          {...(error && { error })}
        />
        {login.isError ? (
          <p role="alert" className="text-dex-red-deep text-base font-bold">
            {loginFailureMessage(login.error)}
          </p>
        ) : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'I choose you!'}
        </Button>
      </form>
      <Button variant="secondary" onClick={onSwitch}>
        Not {username}? Switch Trainer
      </Button>
    </>
  );
};
