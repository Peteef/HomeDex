export const E2E_DATA_DIR = '.e2e-data';
export const E2E_USER = { username: 'Ash', password: 'fake-e2e-password' };
export const E2E_SECOND_USER = { username: 'Misty', password: 'fake-e2e-password' };
export const E2E_ARCHIVED_USER = { username: 'Gary', password: 'fake-e2e-password' };

// The server allows 10 failed logins per 15 minutes from one address, shared by every project.
// Tests that fail a login on purpose run in this project only.
export const FAILED_LOGIN_PROJECT = 'iphone-13-mini';
