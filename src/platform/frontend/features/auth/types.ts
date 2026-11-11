export interface CurrentUser {
  id: number;
  username: string;
}

// An account the login page offers to pick.
export interface SignInAccount {
  username: string;
}

export interface Credentials {
  username: string;
  password: string;
}
