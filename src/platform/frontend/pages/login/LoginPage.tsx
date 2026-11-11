import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import {
  forgetAccount,
  redirectTarget,
  rememberedAccount,
  useAccounts,
  useSession,
} from '../../features/auth/index.ts';
import { Panel } from '../../components/panel/Panel.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';
import { AccountPicker } from './AccountPicker.tsx';
import { PasswordStep } from './PasswordStep.tsx';

// Two steps: pick your account, then prove it with the password. A device that remembers who
// signed in last opens the password step for that account directly.
export const LoginPage = () => {
  const location = useLocation();
  const session = useSession();
  const accounts = useAccounts();
  const [remembered, setRemembered] = useState(rememberedAccount);
  const [picked, setPicked] = useState<string | null>(null);

  if (session.data) {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  const usernames = accounts.data?.map(({ username }) => username);
  // A remembered account that is gone (archived, renamed) falls back to the picker.
  const welcomeBack = picked === null && remembered !== null && usernames?.includes(remembered);
  const chosen = welcomeBack ? remembered : picked;

  const switchAccount = () => {
    forgetAccount();
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
          welcomeBack={welcomeBack === true}
          onSwitch={switchAccount}
        />
      ) : (
        <AccountPicker
          usernames={usernames}
          failed={accounts.isError}
          onRetry={() => {
            void accounts.refetch();
          }}
          onPick={setPicked}
        />
      )}
    </Panel>
  );
};
