import { BaseError } from "./BaseError";

/**
 * Represents an error when we expected exact value, but got
 * something else
 *
 * @typeParam In - Type of actual value
 * @typeParam V - Type of expected value
 */
export class UnexpectedValueError<In, V> extends BaseError {
  constructor(
    public readonly expected: V,
    public readonly actual: In,
    message?: string
  ) {
    const exp = `expected ${expected}, but got ${actual}`;
    super(message ? `${message}: ${exp}` : exp);
  }
}
