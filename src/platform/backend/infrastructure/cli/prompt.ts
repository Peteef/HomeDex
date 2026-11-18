import readline from 'node:readline/promises';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const BACKSPACE = '\u007f';
const EXIT_INTERRUPTED = 130;
const YES = /^y(es)?$/i;

// What the prompts need from a terminal; process.stdin and process.stdout fit.
interface PromptIo {
  input: NodeJS.ReadableStream & { isTTY?: boolean; setRawMode: (mode: boolean) => unknown };
  output: NodeJS.WritableStream;
}

export interface TerminalPrompts {
  hasTerminal: () => boolean;
  ask: (question: string) => Promise<string>;
  confirm: (question: string) => Promise<boolean>;
  askHidden: (question: string) => Promise<string>;
  readPipedPassword: () => Promise<string>;
}

export const terminalPrompts = (
  { input, output }: PromptIo = { input: process.stdin, output: process.stdout },
): TerminalPrompts => {
  const hasTerminal = (): boolean => input.isTTY === true;

  const ask = async (question: string): Promise<string> => {
    const rl = readline.createInterface({ input, output });

    try {
      return (await rl.question(question)).trim();
    } finally {
      rl.close();
    }
  };

  const confirm = async (question: string): Promise<boolean> =>
    YES.test(await ask(`${question} [y/N] `));

  const askHidden = (question: string): Promise<string> => {
    output.write(question);
    input.setRawMode(true);
    input.setEncoding('utf8');
    input.resume();
    return new Promise((resolve) => {
      let value = '';

      const finish = (): void => {
        input.off('data', onData);
        input.setRawMode(false);
        input.pause();
        output.write('\n');
      };

      const onData = (chunk: string): void => {
        for (const char of chunk) {
          if (char === '\r' || char === '\n' || char === CTRL_D) {
            finish();
            resolve(value);
            return;
          }

          if (char === CTRL_C) {
            finish();
            process.exit(EXIT_INTERRUPTED);
          }

          value = char === BACKSPACE ? value.slice(0, -1) : value + char;
        }
      };

      input.on('data', onData);
    });
  };

  const readPipedPassword = async (): Promise<string> => {
    const chunks: Buffer[] = [];

    for await (const chunk of input) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks)
      .toString('utf8')
      .replace(/\r?\n$/, '');
  };

  return {
    hasTerminal,
    ask,
    confirm,
    askHidden,
    readPipedPassword,
  };
};
