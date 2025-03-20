import { BaseError } from "./BaseError";
import { getTypeString } from "./getTypeString";
import { getInfo } from "./marker";

/** Represents the situation when the decoded bytes are not a valid CBOR */
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
