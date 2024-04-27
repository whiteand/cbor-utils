import { Result, err } from "resultra";

export class InvalidCborError extends Error {
  constructor(marker: number, position: number) {
    super(`Invalid CBOR item at position: ${position}. Marker: ${marker}`);
  }
  /**
   * Wraps error into the result
   */
  err<T>(): Result<T, InvalidCborError> {
    return err(this);
  }
}
