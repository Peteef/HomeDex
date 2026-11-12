import { getJson, isUnauthorized, post, postForJson } from '../../../lib/http/index.ts';
import type { Credentials, CurrentUser, SignInAccount } from '../types.ts';

interface UserResponse {
  user: CurrentUser;
}

interface AccountsResponse {
  accounts: SignInAccount[];
}

const ME_PATH = '/auth/me';
const LOGIN_PATH = '/auth/login';
const LOGOUT_PATH = '/auth/logout';
const ACCOUNTS_PATH = '/auth/accounts';

export const fetchCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    return (await getJson<UserResponse>(ME_PATH)).user;
  } catch (error) {
    if (isUnauthorized(error)) {
      return null;
    }

    throw error;
  }
};

export const login = async (credentials: Credentials): Promise<CurrentUser> =>
  (await postForJson<UserResponse>(LOGIN_PATH, credentials)).user;

export const fetchAccounts = async (): Promise<SignInAccount[]> =>
  (await getJson<AccountsResponse>(ACCOUNTS_PATH)).accounts;

export const logout = (): Promise<void> => post(LOGOUT_PATH);
