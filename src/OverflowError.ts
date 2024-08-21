import { BaseError } from "./BaseError";

export class OverflowError extends BaseError {
  constructor(maxValue: number | bigint, passedValue: number | bigint) {
    super(`Expected value to be <= ${maxValue}, but got ${passedValue}`);
  }
}
