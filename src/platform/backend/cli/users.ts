import path from 'node:path';
import { parseArgs } from 'node:util';
import { AccountError, createAccountsService } from '../accounts/accountsService.ts';
import type { Account, AccountsService } from '../accounts/accountsService.ts';
import { loadConfig, loadEnvFile } from '../config.ts';
import { openStorage } from '../storage/index.ts';
import { ask, askHidden, confirm, hasTerminal, readPipedPassword } from './prompt.ts';

const USAGE = `Usage: npm run users -- <command> [options]

Commands:
  list [--all]                         List accounts (--all includes archived ones)
  create [username] [--password <pw>]  Create an account
  edit <username> [--username <new>] [--password <pw>]
                                       Change the username and/or the password
                                       (a new password signs out all of that user's devices)
  archive <username> [--yes]           Block an account from logging in, keeping its data
  restore <username>                   Let an archived account log in again

Without options, create and edit ask for the values. Passwords can also be piped through stdin.`;

const EXIT_FAILURE = 1;
const DATE_LOCALE = 'sv-SE';

class UsageError extends Error {}

const options = {
  username: { type: 'string' },
  password: { type: 'string' },
  yes: { type: 'boolean' },
  all: { type: 'boolean' },
} as const;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(DATE_LOCALE);
}

function printAccounts(accounts: Account[]): void {
  if (accounts.length === 0) {
    console.log('No accounts yet. Create one with: npm run users -- create');
    return;
  }
  for (const account of accounts) {
    const status = account.archivedAt === null ? '' : '  (archived)';
    console.log(`${account.username}  created ${formatDate(account.createdAt)}${status}`);
  }
}

async function readNewPassword(flag: string | undefined, label: string): Promise<string> {
  if (flag !== undefined) return flag;
  if (!hasTerminal()) return readPipedPassword();
  const password = await askHidden(`${label}: `);
  if (password === '') return password;
  if ((await askHidden('Repeat password: ')) !== password) {
    throw new UsageError('The passwords do not match');
  }
  return password;
}

function requireTerminal(missing: string): never {
  throw new UsageError(`Missing ${missing}, and there is no terminal to ask for it`);
}

async function create(
  accounts: AccountsService,
  positional: string[],
  flags: { username?: string | undefined; password?: string | undefined },
): Promise<void> {
  const username =
    flags.username ??
    positional[0] ??
    (hasTerminal() ? await ask('Username: ') : requireTerminal('username'));
  const password = await readNewPassword(flags.password, 'Password');
  const account = await accounts.create(username, password);
  console.log(`Created account "${account.username}".`);
}

async function edit(
  accounts: AccountsService,
  positional: string[],
  flags: { username?: string | undefined; password?: string | undefined },
): Promise<void> {
  const [target] = positional;
  if (!target) throw new UsageError('edit needs a username');
  let { username, password } = flags;
  if (username === undefined && password === undefined) {
    if (!hasTerminal())
      throw new UsageError('Nothing to change: pass --username and/or --password');
    const answer = await ask(`New username (empty keeps "${target}"): `);
    if (answer !== '') username = answer;
    const newPassword = await readNewPassword(
      undefined,
      'New password (empty keeps the current one)',
    );
    if (newPassword !== '') password = newPassword;
  }
  if (username === undefined && password === undefined) {
    console.log('Nothing changed.');
    return;
  }
  const changes = {
    ...(username !== undefined && { username }),
    ...(password !== undefined && { password }),
  };
  const account = await accounts.edit(target, changes);
  console.log(`Updated account "${account.username}".`);
  if (password !== undefined) console.log("All of this user's devices were signed out.");
}

async function archive(
  accounts: AccountsService,
  positional: string[],
  flags: { yes?: boolean | undefined },
): Promise<void> {
  const [target] = positional;
  if (!target) throw new UsageError('archive needs a username');
  if (!flags.yes) {
    if (!hasTerminal()) throw new UsageError('Pass --yes to archive without a terminal');
    const question = `Archive "${target}"? They will be signed out and unable to log in.`;
    if (!(await confirm(question))) {
      console.log('Cancelled.');
      return;
    }
  }
  const account = accounts.archive(target);
  console.log(`Archived account "${account.username}".`);
}

async function run(argv: string[]): Promise<void> {
  const {
    values,
    positionals: [command, ...positional],
  } = parseArgs({ args: argv, options, allowPositionals: true });
  if (!command) throw new UsageError(USAGE);

  loadEnvFile();
  const config = loadConfig();
  const db = openStorage(path.resolve(config.DATA_DIR));
  try {
    const accounts = createAccountsService(db);
    switch (command) {
      case 'list':
        printAccounts(accounts.list({ includeArchived: values.all ?? false }));
        break;
      case 'create':
        await create(accounts, positional, values);
        break;
      case 'edit':
        await edit(accounts, positional, values);
        break;
      case 'archive':
        await archive(accounts, positional, values);
        break;
      case 'restore': {
        const [target] = positional;
        if (!target) throw new UsageError('restore needs a username');
        console.log(`Restored account "${accounts.restore(target).username}".`);
        break;
      }
      default:
        throw new UsageError(`Unknown command "${command}"\n\n${USAGE}`);
    }
  } finally {
    db.close();
  }
}

try {
  await run(process.argv.slice(2));
} catch (error) {
  if (error instanceof UsageError || error instanceof AccountError) {
    console.error(error.message);
  } else if (error instanceof TypeError && 'code' in error) {
    // Bad command-line options from util.parseArgs.
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = EXIT_FAILURE;
}
