/**
 * Thrown values in API routes / services (not necessarily Error instances).
 * Use only via `as LooseThrown` in catch blocks — never as input typing.
 */
export type LooseThrown = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  name?: string;
  stack?: string;
  code?: string;
  meta?: unknown;
  data?: unknown;
  response?: unknown;
};
