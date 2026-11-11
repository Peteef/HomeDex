import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '../components/button/Button.tsx';
import { Panel } from '../components/panel/Panel.tsx';
import { Wordmark } from '../components/wordmark/Wordmark.tsx';
import { LOGIN_PATH } from '../routes.ts';
import { CurrentUserContext } from './currentUser.ts';
import { redirectState } from './redirect.ts';
import { useSession } from './session.ts';

interface SessionUnavailableProps {
  onRetry: () => void;
}

const SessionUnavailable = ({ onRetry }: SessionUnavailableProps) => (
  <Panel className="flex flex-col gap-3">
    <Wordmark />
    <h1 className="text-3xl font-extrabold">Can&apos;t reach HomeDex</h1>
    <p className="text-dex-ink-muted text-base">Check your connection and try again.</p>
    <Button className="self-start" onClick={onRetry}>
      Try again
    </Button>
  </Panel>
);

export const RequireAuth = () => {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <p role="status" className="sr-only">
        Loading…
      </p>
    );
  }
  if (session.data) {
    return (
      <CurrentUserContext value={session.data}>
        <Outlet />
      </CurrentUserContext>
    );
  }
  if (session.isError) {
    return (
      <SessionUnavailable
        onRetry={() => {
          void session.refetch();
        }}
      />
    );
  }
  return <Navigate to={LOGIN_PATH} replace state={redirectState(location)} />;
};
