import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountsService } from '../../../domain/accounts/index.ts';
import { createTestDatabase, TEST_PASSWORD, testServices } from '../../__tests__/helpers.ts';
import { UsageError } from '../errors.ts';
import type { TerminalPrompts } from '../prompt.ts';
import { userCommands } from '../userCommands.ts';

const NEW_PASSWORD = 'another-password';

const fakeTerminal = ({ answers = [] as string[], hidden = [] as string[], confirmed = false }) => {
  const ask = vi.fn<TerminalPrompts['ask']>();
  const askHidden = vi.fn<TerminalPrompts['askHidden']>();

  for (const answer of answers) {
    ask.mockResolvedValueOnce(answer);
  }

  for (const answer of hidden) {
    askHidden.mockResolvedValueOnce(answer);
  }

  return {
    hasTerminal: () => true,
    ask,
    askHidden,
    confirm: vi.fn<TerminalPrompts['confirm']>().mockResolvedValue(confirmed),
    readPipedPassword: vi.fn<TerminalPrompts['readPipedPassword']>(),
  };
};

describe('userCommands', () => {
  let accounts: AccountsService;
  let printed: () => string;

  beforeEach(() => {
    accounts = testServices(createTestDatabase()).accounts;
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    printed = () => log.mock.calls.flat().join('\n');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should ask for the username and the password twice when no values are given', async () => {
      // Given
      const terminal = fakeTerminal({ answers: ['ash'], hidden: [TEST_PASSWORD, TEST_PASSWORD] });

      // When
      await userCommands(accounts, terminal).create([], {});

      // Then
      expect(terminal.ask).toHaveBeenCalledWith('Username: ');
      expect(terminal.askHidden).toHaveBeenCalledWith('Password: ');
      expect(terminal.askHidden).toHaveBeenCalledWith('Repeat password: ');
      expect(printed()).toContain('Created account "ash".');
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).not.toBeNull();
    });

    it('should fail and create nothing when the repeated password does not match', async () => {
      // Given
      const terminal = fakeTerminal({ hidden: [TEST_PASSWORD, NEW_PASSWORD] });

      // When
      const creating = userCommands(accounts, terminal).create(['ash'], {});

      // Then
      await expect(creating).rejects.toThrow(new UsageError('The passwords do not match'));
      expect(accounts.list({ includeArchived: true })).toEqual([]);
    });
  });

  describe('edit', () => {
    beforeEach(async () => {
      await accounts.create('ash', TEST_PASSWORD);
    });

    it('should change nothing when both answers are empty', async () => {
      // Given
      const terminal = fakeTerminal({ answers: [''], hidden: [''] });

      // When
      await userCommands(accounts, terminal).edit(['ash'], {});

      // Then
      expect(terminal.ask).toHaveBeenCalledWith('New username (empty keeps "ash"): ');
      expect(terminal.askHidden).toHaveBeenCalledTimes(1);
      expect(printed()).toBe('Nothing changed.');
    });

    it('should rename the account when only a new username is typed', async () => {
      // Given
      const terminal = fakeTerminal({ answers: ['misty'], hidden: [''] });

      // When
      await userCommands(accounts, terminal).edit(['ash'], {});

      // Then
      expect(printed()).toBe('Updated account "misty".');
      expect(await accounts.authenticate('misty', TEST_PASSWORD)).not.toBeNull();
    });

    it('should change the password and say the devices were signed out when a new one is typed twice', async () => {
      // Given
      const terminal = fakeTerminal({ answers: [''], hidden: [NEW_PASSWORD, NEW_PASSWORD] });

      // When
      await userCommands(accounts, terminal).edit(['ash'], {});

      // Then
      expect(terminal.askHidden).toHaveBeenCalledWith(
        'New password (empty keeps the current one): ',
      );

      expect(printed()).toContain("All of this user's devices were signed out.");
      expect(await accounts.authenticate('ash', NEW_PASSWORD)).not.toBeNull();
    });

    it('should fail and keep the password when the repeated password does not match', async () => {
      // Given
      const terminal = fakeTerminal({ answers: [''], hidden: [NEW_PASSWORD, TEST_PASSWORD] });

      // When
      const editing = userCommands(accounts, terminal).edit(['ash'], {});

      // Then
      await expect(editing).rejects.toThrow(new UsageError('The passwords do not match'));
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).not.toBeNull();
    });
  });

  describe('archive', () => {
    beforeEach(async () => {
      await accounts.create('ash', TEST_PASSWORD);
    });

    it('should archive the account when the confirmation is accepted', async () => {
      // Given
      const terminal = fakeTerminal({ confirmed: true });

      // When
      await userCommands(accounts, terminal).archive(['ash'], {});

      // Then
      expect(terminal.confirm).toHaveBeenCalledWith(
        'Archive "ash"? They will be signed out and unable to log in.',
      );

      expect(printed()).toBe('Archived account "ash".');
      expect(accounts.list({ includeArchived: false })).toEqual([]);
    });

    it('should keep the account active when the confirmation is declined', async () => {
      // Given
      const terminal = fakeTerminal({ confirmed: false });

      // When
      await userCommands(accounts, terminal).archive(['ash'], {});

      // Then
      expect(printed()).toBe('Cancelled.');
      expect(accounts.list({ includeArchived: false })).toHaveLength(1);
    });
  });
});
