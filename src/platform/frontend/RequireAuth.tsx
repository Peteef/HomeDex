import { Navigate, Outlet, useLocation } from 'react-router';
import { CurrentUserContext, redirectState, useSession } from './features/auth/index.ts';
import { SessionUnavailablePage } from './pages/session-unavailable/SessionUnavailablePage.tsx';
import { LOGIN_PATH } from './routes.ts';

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
      <SessionUnavailablePage
        onRetry={() => {
          void session.refetch();
        }}
      />
    );
  }

  return <Navigate to={LOGIN_PATH} replace state={redirectState(location)} />;
};
