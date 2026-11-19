import type { ErrorRequestHandler } from 'express';

interface DomainError<Code extends string> extends Error {
  code: Code;
}

type DomainErrorClass<Code extends string> = abstract new (...args: never[]) => DomainError<Code>;

export const domainErrorHandler =
  <Code extends string>(
    errorClass: DomainErrorClass<Code>,
    statusByCode: Record<Code, number>,
  ): ErrorRequestHandler =>
  (error, _req, res, next) => {
    if (!(error instanceof errorClass)) {
      next(error);
      return;
    }

    res.status(statusByCode[error.code]).json({ error: error.message });
  };
