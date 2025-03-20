import { BaseError } from "./BaseError";

/**
 * Represents the situation when actual data type does not match the expected one.
 */
export class TypeMismatchError extends BaseError {
  constructor(expectedType: string, actualType: string) {
    super(`Expected ${expectedType}, but got ${actualType}`);
  }
}
