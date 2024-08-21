import { BaseError } from "./BaseError";
import { getTypeString } from "./getTypeString";
import { getInfo } from "./marker";

export class InvalidCborError extends BaseError {
  constructor(marker: number, position: number, cause?: Error) {
    super(
      `Invalid CBOR item at position: ${position}. Type: ${getTypeString(
        marker
      )}.Info: ${getInfo(marker)}`,
      { cause }
    );
  }
}
