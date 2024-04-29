import { ResultError } from "./ResultError";

export class UnderflowError extends ResultError {
  constructor(minValue: number | bigint, passedValue: number | bigint) {
    super(`Expected value to be >= ${minValue}, but got ${passedValue}`);
  }
}
