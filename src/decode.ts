import { err, Result } from "resultra";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults/Uint8ArrayReader";
import { IDecoder } from "./IDecoder";

export function decode<R>(
  bytes: Uint8Array,
  cb: (d: IDecoder) => Result<R>
): Result<R> {
  const decoder = new Decoder(new Uint8ArrayReader(bytes));
  try {
    const result = cb(decoder);
    return result;
  } catch (error) {
    return err(error);
  }
}
