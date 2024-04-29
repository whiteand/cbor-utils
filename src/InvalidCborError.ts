import { ResultError } from "./ResultError";

export class InvalidCborError extends ResultError {
  constructor(marker: number, position: number, cause?: Error) {
    super(`Invalid CBOR item at position: ${position}. Marker: ${marker}`);
  }
}
