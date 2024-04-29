import { ResultError } from "./ResultError";

export class OverflowError extends ResultError {
  constructor(maxValue: number | bigint, passedValue: number | bigint) {
    super(`Expected value to be <= ${maxValue}, but got ${passedValue}`);
  }
}
