/**
 * Augments Express's Request with the authenticated user id resolved by the
 * auth middleware. `userId` is null when the request is unauthenticated.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string | null;
    }
  }
}

export {};
