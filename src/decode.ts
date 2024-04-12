import { err, Result } from "resultra";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults/Uint8ArrayReader";
import { IDecoder } from "./IDecoder";
import { toString } from "./toString";
import { DecodeRuntimeError } from "./errors";

export function decode<R, E>(
  bytes: Uint8Array,
  cb: (d: IDecoder<never, Uint8ArrayReader>) => Result<R, E>
): Result<R, E | DecodeRuntimeError> {
  const decoder = new Decoder(new Uint8ArrayReader(bytes), {
    bufferSize: bytes.byteLength,
  });
  try {
    const result = cb(decoder);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      return err(new DecodeRuntimeError(error.message, error));
    }
    return err(
      new DecodeRuntimeError(
        "Unknown error during decoding was throw: " + toString(error),
        error
      )
    );
  }
}
