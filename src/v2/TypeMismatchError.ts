import { BaseError } from "./BaseError";

export class TypeMismatchError extends BaseError {
  constructor(expectedType: string, actualType: string) {
    super(`Expected ${expectedType}, but got ${actualType}`);
  }
}
