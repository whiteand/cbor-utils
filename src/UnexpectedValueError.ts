import { ResultError } from "./ResultError";

export class UnexpectedValueError<In, V> extends ResultError {
  constructor(
    public readonly expected: V,
    public readonly actual: In,
    message?: string,
  ) {
    super(
      message
        ? `${message}: expected ${expected}, but got ${actual}`
        : `expected ${expected}, but got ${actual}`,
    );
  }
}
