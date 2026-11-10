export interface Logger {
  info(message: string, ...details: unknown[]): void;
  warn(message: string, ...details: unknown[]): void;
  error(message: string, ...details: unknown[]): void;
}

function info(message: string, ...details: unknown[]): void {
  console.log(message, ...details);
}

function warn(message: string, ...details: unknown[]): void {
  console.warn(message, ...details);
}

function error(message: string, ...details: unknown[]): void {
  console.error(message, ...details);
}

export const logger: Logger = { info, warn, error };
