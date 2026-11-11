import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import {
  forgetAccount,
  redirectTarget,
  rememberedAccount,
  useAccounts,
  useLogin,
  useSession,
} from '../../features/auth/index.ts';
import { Panel } from '../../components/panel/Panel.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';
import { useText } from '../../lib/i18n/index.ts';
import { AccountPicker } from './components/AccountPicker.tsx';
import { PasswordStep } from './components/PasswordStep.tsx';
import { loginFailure } from './loginMessages.ts';

export const LoginPage = () => {
  const errors = useText('login.errors');
  const location = useLocation();
  const session = useSession();
  const accounts = useAccounts();
  const login = useLogin();
  const [remembered, setRemembered] = useState(rememberedAccount);
  const [picked, setPicked] = useState<string | null>(null);

  if (session.data) {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  const usernames = accounts.data?.map(({ username }) => username);
  const rememberedStillExists = remembered !== null && (usernames?.includes(remembered) ?? false);
  const welcomeBack = picked === null && rememberedStillExists;
  const chosen = picked ?? (rememberedStillExists ? remembered : null);

  const pick = (username: string) => {
    login.reset();
    setPicked(username);
  };

  const switchAccount = () => {
    forgetAccount();
    login.reset();
    setRemembered(null);
    setPicked(null);
  };

  return (
    <Panel className="flex flex-col gap-4">
      <Wordmark />
      {chosen ? (
        <PasswordStep
          key={chosen}
          username={chosen}
          welcomeBack={welcomeBack}
          pending={login.isPending}
          failure={login.isError ? errors[loginFailure(login.error)] : null}
          onSubmit={(password) => login.mutateAsync({ username: chosen, password })}
          onSwitch={switchAccount}
        />
      ) : (
        <AccountPicker
          usernames={usernames}
          failed={accounts.isError}
          onRetry={() => {
            void accounts.refetch();
          }}
          onPick={pick}
        />
      )}
    </Panel>
  );
};
