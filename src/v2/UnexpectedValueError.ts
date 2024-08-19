import { BaseError } from "./BaseError";

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
