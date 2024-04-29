import { ResultError } from "./ResultError";

export class InvalidCborError extends ResultError {
  constructor(marker: number, position: number) {
    super(`Invalid CBOR item at position: ${position}. Marker: ${marker}`);
  }
}
