import readline from 'node:readline/promises';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const BACKSPACE = '\u007f';
const EXIT_INTERRUPTED = 130;
const YES = /^y(es)?$/i;

export const hasTerminal = (): boolean => process.stdin.isTTY;

export const ask = async (question: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
};

export const confirm = async (question: string): Promise<boolean> => {
  return YES.test(await ask(`${question} [y/N] `));
};

export const askHidden = (question: string): Promise<string> => {
  process.stdout.write(question);
  const { stdin } = process;
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();
  return new Promise((resolve) => {
    let value = '';
    const finish = (): void => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
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
    stdin.on('data', onData);
  });
};

export const readPipedPassword = async (): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks)
    .toString('utf8')
    .replace(/\r?\n$/, '');
};
