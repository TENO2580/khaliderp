import { AsyncLocalStorage } from 'node:async_hooks';

export interface CurrentUserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

const asyncLocalStorage = new AsyncLocalStorage<CurrentUserContext>();

/**
 * Set the authenticated user in the current execution context.
 */
export function setCurrentUser(user: CurrentUserContext) {
  try {
    asyncLocalStorage.enterWith(user);
  } catch (err) {
    // enterWith might fail in non-standard environments, fail gracefully
  }
}

/**
 * Run a function with the specified user context.
 */
export function runWithUser<T>(user: CurrentUserContext, fn: () => T): T {
  return asyncLocalStorage.run(user, fn);
}

/**
 * Get the current user from the execution context.
 */
export function getCurrentUser(): CurrentUserContext | undefined {
  return asyncLocalStorage.getStore();
}
