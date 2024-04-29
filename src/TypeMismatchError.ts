import { ResultError } from "./ResultError";

export class TypeMismatchError extends ResultError {
  constructor(expectedType: string, actualType: string) {
    super(`Expected ${expectedType}, but got ${actualType}`);
  }
}
