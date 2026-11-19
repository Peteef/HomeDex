import type { ErrorRequestHandler } from 'express';
import { BAD_REQUEST, CONFLICT, FORBIDDEN, NOT_FOUND } from '../../../shared/http/status.ts';

const DEFAULT_STATUS_BY_CODE = {
  invalid: BAD_REQUEST,
  not_found: NOT_FOUND,
  forbidden: FORBIDDEN,
  conflict: CONFLICT,
};

type DefaultCode = keyof typeof DEFAULT_STATUS_BY_CODE;

interface DomainError<Code extends string> extends Error {
  code: Code;
}

type DomainErrorClass<Code extends string> = abstract new (...args: never[]) => DomainError<Code>;

type StatusByCode<Code extends string> = Record<Exclude<Code, DefaultCode>, number> &
  Partial<Record<Code, number>>;

// The table may be left out only when every code of the class has a default status; otherwise it
// must name each other code. The brackets stop TypeScript from checking each code on its own.
type StatusesArgument<Code extends string> = [Exclude<Code, DefaultCode>] extends [never]
  ? [statusByCode?: StatusByCode<Code>]
  : [statusByCode: StatusByCode<Code>];

export const domainErrorHandler = <Code extends string>(
  errorClass: DomainErrorClass<Code>,
  ...[statusByCode]: StatusesArgument<Code>
): ErrorRequestHandler => {
  // StatusesArgument has made sure that the defaults and the table cover every code.
  const statuses = { ...DEFAULT_STATUS_BY_CODE, ...statusByCode } as Record<Code, number>;

  return (error, _req, res, next) => {
    if (!(error instanceof errorClass)) {
      next(error);
      return;
    }

    res.status(statuses[error.code]).json({ error: error.message });
  };
};
