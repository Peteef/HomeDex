import type { Account, AccountsService } from '../../domain/accounts/index.ts';
import { UsageError } from './errors.ts';
import type { TerminalPrompts } from './prompt.ts';
import { definedProps } from '../../../shared/objects/definedProps.ts';

const DATE_LOCALE = 'sv-SE';

interface UserCommands {
  list: (flags: { all?: boolean | undefined }) => void;
  create: (
    positional: string[],
    flags: { username?: string | undefined; password?: string | undefined },
  ) => Promise<void>;
  edit: (
    positional: string[],
    flags: { username?: string | undefined; password?: string | undefined },
  ) => Promise<void>;
  archive: (positional: string[], flags: { yes?: boolean | undefined }) => Promise<void>;
  restore: (positional: string[]) => void;
}

export const userCommands = (
  accounts: AccountsService,
  { ask, askHidden, confirm, hasTerminal, readPipedPassword }: TerminalPrompts,
): UserCommands => {
  const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleDateString(DATE_LOCALE);

  const printAccounts = (list: Account[]): void => {
    if (list.length === 0) {
      console.log('No accounts yet. Create one with: npm run users -- create');
      return;
    }

    for (const account of list) {
      const status = account.archivedAt === null ? '' : '  (archived)';
      console.log(`${account.username}  created ${formatDate(account.createdAt)}${status}`);
    }
  };

  const readNewPassword = async (flag: string | undefined, label: string): Promise<string> => {
    if (flag !== undefined) {
      return flag;
    }

    if (!hasTerminal()) {
      return readPipedPassword();
    }

    const password = await askHidden(`${label}: `);

    if (password === '') {
      return password;
    }

    if ((await askHidden('Repeat password: ')) !== password) {
      throw new UsageError('The passwords do not match');
    }

    return password;
  };

  const requireTerminal = (missing: string): never => {
    throw new UsageError(`Missing ${missing}, and there is no terminal to ask for it`);
  };

  const list: UserCommands['list'] = (flags) => {
    printAccounts(accounts.list({ includeArchived: flags.all ?? false }));
  };

  const create: UserCommands['create'] = async (positional, flags) => {
    const username =
      flags.username ??
      positional[0] ??
      (hasTerminal() ? await ask('Username: ') : requireTerminal('username'));

    const password = await readNewPassword(flags.password, 'Password');
    const account = await accounts.create(username, password);
    console.log(`Created account "${account.username}".`);
  };

  const edit: UserCommands['edit'] = async (positional, flags) => {
    const [target] = positional;

    if (!target) {
      throw new UsageError('edit needs a username');
    }

    let { username, password } = flags;

    if (username === undefined && password === undefined) {
      if (!hasTerminal()) {
        throw new UsageError('Nothing to change: pass --username and/or --password');
      }

      const answer = await ask(`New username (empty keeps "${target}"): `);

      if (answer !== '') {
        username = answer;
      }

      const newPassword = await readNewPassword(
        undefined,
        'New password (empty keeps the current one)',
      );

      if (newPassword !== '') {
        password = newPassword;
      }
    }

    if (username === undefined && password === undefined) {
      console.log('Nothing changed.');
      return;
    }

    const account = await accounts.edit(target, definedProps({ username, password }));
    console.log(`Updated account "${account.username}".`);

    if (password !== undefined) {
      console.log("All of this user's devices were signed out.");
    }
  };

  const archive: UserCommands['archive'] = async (positional, flags) => {
    const [target] = positional;

    if (!target) {
      throw new UsageError('archive needs a username');
    }

    if (!flags.yes) {
      if (!hasTerminal()) {
        throw new UsageError('Pass --yes to archive without a terminal');
      }

      const question = `Archive "${target}"? They will be signed out and unable to log in.`;

      if (!(await confirm(question))) {
        console.log('Cancelled.');
        return;
      }
    }

    const account = accounts.archive(target);
    console.log(`Archived account "${account.username}".`);
  };

  const restore: UserCommands['restore'] = (positional) => {
    const [target] = positional;

    if (!target) {
      throw new UsageError('restore needs a username');
    }

    console.log(`Restored account "${accounts.restore(target).username}".`);
  };

  return {
    list,
    create,
    edit,
    archive,
    restore,
  };
};
