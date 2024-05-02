import { ResultError } from "./ResultError";

export class UnexpectedValueError<In, V> extends ResultError {
  constructor(
    public readonly expected: V,
    public readonly actual: In,
    message?: string,
  ) {
    const exp = `expected ${expected}, but got ${actual}`;
    super(message ? `${message}: ${exp}` : exp);
  }
}
