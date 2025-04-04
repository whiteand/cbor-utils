/**
 * Makes the passed function to become a single called function
 */
export const singleton: <T>(fn: () => T, inst?: T | null) => (() => T) =
  <T>(fn: () => T, inst?: T | null): (() => T) =>
  () =>
    (inst ??= fn());
