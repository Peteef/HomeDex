import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../components/avatar/Avatar.tsx';
import { Button } from '../../../components/button/Button.tsx';
import { TextInput } from '../../../components/text-input/TextInput.tsx';
import { passwordError } from '../loginMessages.ts';
import type { LoginMessage } from '../loginMessages.ts';

export interface PasswordStepProps {
  username: string;
  welcomeBack: boolean;
  pending: boolean;
  failure: string | null;
  onSubmit: (password: string) => Promise<unknown>;
  onSwitch: () => void;
}

export const PasswordStep = ({
  username,
  welcomeBack,
  pending,
  failure,
  onSubmit,
  onSwitch,
}: PasswordStepProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<LoginMessage>();
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

    onSubmit(password).catch(retryPassword);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar name={username} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-3xl font-extrabold break-words">
            {t(welcomeBack ? 'login.password.welcomeBack' : 'login.password.greeting', {
              username,
            })}
          </h1>
          <p className="text-dex-ink-muted text-base">{t('login.password.prompt')}</p>
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
          label={t('login.password.label')}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          {...(error && { error: t(error) })}
        />
        {failure ? (
          <p role="alert" className="text-dex-red-deep text-base font-bold">
            {failure}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {t(pending ? 'login.password.submitting' : 'login.password.submit')}
        </Button>
      </form>
      <Button variant="quiet" className="-mt-3 -mb-2 self-center" onClick={onSwitch}>
        {t('login.password.switchTrainer', { username })}
      </Button>
    </>
  );
};
