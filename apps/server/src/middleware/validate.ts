import type { NextFunction, Request, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiError } from '../lib/errors';

/**
 * Returns middleware that validates `req.body` against a Zod schema and
 * replaces it with the parsed (typed, defaulted) value. On failure it throws a
 * 400 ApiError carrying the field-level issues.
 */
export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        ApiError.badRequest('Request validation failed', formatIssues(result.error)),
      );
    }
    req.body = result.data;
    next();
  };
}

/** Validates `req.query`, writing the parsed result onto `res.locals.query`. */
export function validateQuery<S extends ZodTypeAny>(schema: S) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        ApiError.badRequest('Invalid query parameters', formatIssues(result.error)),
      );
    }
    res.locals.query = result.data;
    next();
  };
}

function formatIssues(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}
