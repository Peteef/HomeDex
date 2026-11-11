import { getJson, isUnauthorized, post, postJson } from '../http/client.ts';

export interface CurrentUser {
  id: number;
  username: string;
}

export interface Credentials {
  username: string;
  password: string;
}

interface UserResponse {
  user: CurrentUser;
}

const ME_PATH = '/auth/me';
const LOGIN_PATH = '/auth/login';
const LOGOUT_PATH = '/auth/logout';

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
  (await postJson<UserResponse>(LOGIN_PATH, credentials)).user;

export const logout = (): Promise<void> => post(LOGOUT_PATH);
