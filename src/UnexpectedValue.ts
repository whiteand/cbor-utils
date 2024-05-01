import { ResultError } from "./ResultError";

export class UnexpectedValue<In, V> extends ResultError {
  constructor(
    public readonly expected: V,
    public readonly actual: In,
  ) {
    super(`Expected ${expected}, but got ${actual}`);
  }
}
