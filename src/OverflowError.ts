import { BaseError } from "./BaseError";

/**
 * Represents a situation when a value is greater then the defined maximum value.
 */
export class OverflowError extends BaseError {
  constructor(maxValue: number | bigint, passedValue: number | bigint) {
    super(`Expected value to be <= ${maxValue}, but got ${passedValue}`);
  }
}
