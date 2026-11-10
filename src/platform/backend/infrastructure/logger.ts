export interface Logger {
  info(message: string, ...details: unknown[]): void;
  warn(message: string, ...details: unknown[]): void;
  error(message: string, ...details: unknown[]): void;
}

export const logger: Logger = {
  info: (message, ...details) => {
    console.log(message, ...details);
  },
  warn: (message, ...details) => {
    console.warn(message, ...details);
  },
  error: (message, ...details) => {
    console.error(message, ...details);
  },
};
