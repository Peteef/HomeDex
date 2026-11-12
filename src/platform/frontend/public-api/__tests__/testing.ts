// Test kit for a module's frontend tests (as #platform/frontend/testing). It lives in __tests__, so
// the Docker image leaves it out, and lint lets only a module's __tests__ import it.
export { fakeApi, ok, status, withProviders } from '../../__tests__/helpers.tsx';
export type { ApiCall, FakeResponse } from '../../__tests__/helpers.tsx';
