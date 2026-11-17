import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { terminalPrompts } from '../prompt.ts';

const fakeTerminal = ({ isTTY = true } = {}) => {
  const setRawMode = vi.fn();
  const input = Object.assign(new PassThrough(), { isTTY, setRawMode });
  const output = new PassThrough();
  const written: string[] = [];
  output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf8')));
  return {
    input,
    output,
    setRawMode,
    shown: () => written.join(''),
  };
};

describe('terminalPrompts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hasTerminal', () => {
    it('should be true when the input is a terminal', () => {
      // Given
      const prompts = terminalPrompts(fakeTerminal());

      // When / Then
      expect(prompts.hasTerminal()).toBe(true);
    });

    it('should be false when the input is a pipe', () => {
      // Given
      const prompts = terminalPrompts(fakeTerminal({ isTTY: false }));

      // When / Then
      expect(prompts.hasTerminal()).toBe(false);
    });
  });

  describe('ask', () => {
    it('should show the question and return the answer without surrounding spaces when it is typed', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.ask('Username: ');
      terminal.input.write('  ash  \n');

      // Then
      expect(await answer).toBe('ash');
      expect(terminal.shown()).toContain('Username: ');
    });
  });

  describe('confirm', () => {
    it('should add [y/N] to the question when it asks', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.confirm('Archive ash?');
      terminal.input.write('n\n');
      await answer;

      // Then
      expect(terminal.shown()).toContain('Archive ash? [y/N] ');
    });

    it.each([
      [true, 'y'],
      [true, 'Y'],
      [true, 'yes'],
      [false, 'n'],
      [false, ''],
      [false, 'maybe'],
    ])('should be %s when the reply is "%s"', async (expected, reply) => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.confirm('Archive ash?');
      terminal.input.write(`${reply}\n`);

      // Then
      expect(await answer).toBe(expected);
    });
  });

  describe('askHidden', () => {
    it('should return what was typed when Enter is pressed', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.askHidden('Password: ');
      terminal.input.write('secret\r');

      // Then
      expect(await answer).toBe('secret');
    });

    it('should never show the typed characters when a password is typed', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.askHidden('Password: ');
      terminal.input.write('secret\r');
      await answer;

      // Then
      expect(terminal.shown()).toBe('Password: \n');
    });

    it('should remove the last character when Backspace is pressed', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.askHidden('Password: ');
      terminal.input.write('secrex\u007ft\r');

      // Then
      expect(await answer).toBe('secret');
    });

    it('should finish when Ctrl+D is pressed', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.askHidden('Password: ');
      terminal.input.write('secret\u0004');

      // Then
      expect(await answer).toBe('secret');
    });

    it('should switch raw mode on while typing and off afterwards when a password is typed', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const answer = prompts.askHidden('Password: ');
      terminal.input.write('secret\r');
      await answer;

      // Then
      expect(terminal.setRawMode.mock.calls).toEqual([[true], [false]]);
    });

    it('should exit with 130 and leave raw mode when Ctrl+C is pressed', async () => {
      // Given
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);
      void prompts.askHidden('Password: ');

      // When
      terminal.input.write('se\u0003');

      // Then
      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(130);
      });

      expect(terminal.setRawMode).toHaveBeenLastCalledWith(false);
    });
  });

  describe('a create session', () => {
    it('should read the username and then the password twice when they are typed in turn', async () => {
      // Given
      const terminal = fakeTerminal();
      const prompts = terminalPrompts(terminal);

      // When
      const username = prompts.ask('Username: ');
      terminal.input.write('ash\n');
      const typedUsername = await username;

      const password = prompts.askHidden('Password: ');
      terminal.input.write('secret-pass\r');
      const typedPassword = await password;

      const repeated = prompts.askHidden('Repeat password: ');
      terminal.input.write('secret-pass\r');
      const typedRepeat = await repeated;

      // Then
      expect([typedUsername, typedPassword, typedRepeat]).toEqual([
        'ash',
        'secret-pass',
        'secret-pass',
      ]);

      expect(terminal.shown()).not.toContain('secret-pass');
    });
  });

  describe('readPipedPassword', () => {
    it('should join the chunks when the password arrives in parts', async () => {
      // Given
      const terminal = fakeTerminal({ isTTY: false });
      const prompts = terminalPrompts(terminal);

      // When
      const password = prompts.readPipedPassword();
      terminal.input.write('correct-');
      terminal.input.end('horse');

      // Then
      expect(await password).toBe('correct-horse');
    });

    it.each([
      ['pw\n', 'pw'],
      ['pw\r\n', 'pw'],
      ['pw\n\n', 'pw\n'],
    ])('should drop only one trailing line break when the input is %j', async (piped, expected) => {
      // Given
      const terminal = fakeTerminal({ isTTY: false });
      const prompts = terminalPrompts(terminal);

      // When
      const password = prompts.readPipedPassword();
      terminal.input.end(piped);

      // Then
      expect(await password).toBe(expected);
    });
  });
});
