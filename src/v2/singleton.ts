/**
 * Makes the passed function to become a single called function
 */
export const singleton =
  <T>(fn: () => T, inst?: T | null) =>
  () =>
    (inst ??= fn());
