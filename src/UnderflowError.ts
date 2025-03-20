import { BaseError } from "./BaseError";

/**
 * Represents an error when a value is smaller than expected minimum
 */
export class UnderflowError extends BaseError {
  constructor(minValue: number | bigint, passedValue: number | bigint) {
    super(`Expected value to be >= ${minValue}, but got ${passedValue}`);
  }
}
