import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults/Uint8ArrayReader";
import { Result } from "./result";

export function decode<R>(
  bytes: Uint8Array,
  cb: (d: Decoder<Uint8ArrayReader>) => Result<R>
): Result<R> {
  const decoder = new Decoder(new Uint8ArrayReader(bytes));
  const result = cb(decoder);
  return result;
}
