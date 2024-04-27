export class TypeMismatchError extends Error {
  constructor(expectedType: string, actualType: string) {
    super(`Expected ${expectedType}, but got ${actualType}`);
  }
}
