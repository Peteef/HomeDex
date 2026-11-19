import express from 'express';
import type { RequestHandler } from 'express';

const DEFAULT_LIMIT_KB = 100;
const BYTES_PER_KB = 1024;

export const jsonBody = (limitKb = DEFAULT_LIMIT_KB): RequestHandler =>
  express.json({ limit: limitKb * BYTES_PER_KB });
