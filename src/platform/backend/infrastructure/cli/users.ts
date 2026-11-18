import path from 'node:path';
import { parseArgs } from 'node:util';
import { AccountError } from '../../domain/accounts/index.ts';
import { domainServices } from '../../domain/services.ts';
import { loadConfig, loadEnvFile } from '../config.ts';
import { ConfigError } from '../errors.ts';
import { MigrationError, openStorage } from '../storage/index.ts';
import { UsageError } from './errors.ts';
import { terminalPrompts } from './prompt.ts';
import { userCommands } from './userCommands.ts';

const USAGE = `Usage: npm run users -- <command> [options]

Commands:
  list [--all]                         List accounts (--all includes archived ones)
  create [username] [--password <pw>]  Create an account
  edit <username> [--username <new>] [--password <pw>]
                                       Change the username and/or the password
                                       (a new password signs out all of that user's devices)
  archive <username> [--yes]           Block an account from logging in, keeping its data
  restore <username>                   Let an archived account log in again

Without options, create and edit ask for the values. Prefer the prompt or a pipe through stdin over --password, which stays in the shell history.`;

const EXIT_FAILURE = 1;

const options = {
  username: { type: 'string' },
  password: { type: 'string' },
  yes: { type: 'boolean' },
  all: { type: 'boolean' },
} as const;

const run = async (argv: string[]): Promise<void> => {
  const {
    values,
    positionals: [command, ...positional],
  } = parseArgs({ args: argv, options, allowPositionals: true });

  if (!command) {
    throw new UsageError(USAGE);
  }

  loadEnvFile();
  const config = loadConfig();
  const db = openStorage(path.resolve(config.DATA_DIR));

  try {
    const { accounts } = domainServices(db, { sessionTtlDays: config.SESSION_TTL_DAYS });
    const { list, create, edit, archive, restore } = userCommands(accounts, terminalPrompts());

    switch (command) {
      case 'list':
        list(values);
        break;
      case 'create':
        await create(positional, values);
        break;
      case 'edit':
        await edit(positional, values);
        break;
      case 'archive':
        await archive(positional, values);
        break;
      case 'restore':
        restore(positional);
        break;
      default:
        throw new UsageError(`Unknown command "${command}"\n\n${USAGE}`);
    }
  } finally {
    db.close();
  }
};

// A mistake the user can fix gets one line. util.parseArgs reports bad options as a TypeError
// with a code.
const isExpected = (error: unknown): error is Error =>
  error instanceof UsageError ||
  error instanceof AccountError ||
  error instanceof ConfigError ||
  error instanceof MigrationError ||
  (error instanceof TypeError && 'code' in error);

try {
  await run(process.argv.slice(2));
} catch (error) {
  if (isExpected(error)) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = EXIT_FAILURE;
}
