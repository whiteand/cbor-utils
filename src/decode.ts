import { err, Result } from "resultra";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults/Uint8ArrayReader";
import { IDecoder } from "./IDecoder";
import { toString } from "./toString";

export function decode<R>(
  bytes: Uint8Array,
  cb: (d: IDecoder<Uint8ArrayReader>) => Result<R>
): Result<R> {
  const decoder = new Decoder(new Uint8ArrayReader(bytes), {
    bufferSize: bytes.byteLength,
  });
  try {
    const result = cb(decoder);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      return err(error);
    }
    return err(
      new Error("Unknown error during decoding was throw: " + toString(error))
    );
  }
}
