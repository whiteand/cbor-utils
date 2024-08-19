import { BaseError } from "./BaseError";

export class UnderflowError extends BaseError {
  constructor(minValue: number | bigint, passedValue: number | bigint) {
    super(`Expected value to be >= ${minValue}, but got ${passedValue}`);
  }
}
