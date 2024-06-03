import { Result } from "resultra";
import { catchError } from "resultra/utils";
import { ThrowOnFailDecoder, Decoder } from "./Decoder";
import { IDecodableType, IDecoder } from "./types";
import { decodeSymbol } from "./traits";

/**
 * @param b bytes to decode from
 * @param cb callback that will be called that should throw an error if decoding fails
 * @returns result of decoding, or error if decoding failed
 */
export const tryDecode: <T>(
  bytes: Uint8Array,
  cb: (e: ThrowOnFailDecoder) => T
) => Result<T, unknown> = (b, cb) => {
  return catchError(cb, new ThrowOnFailDecoder(b));
};

/**
 * @param bytes Bytes or Decoder
 * @param cb CborType or function that decodes something
 * @param args optional context argument
 * @returns Result of decoded value
 */
export function decode<T, E extends Error, C>(
  bytes: Uint8Array | IDecoder,
  cb:
    | ((e: Decoder) => Result<T, E>)
    | ((e: Decoder, ctx: C) => Result<T, E>)
    | IDecodableType<T, E, unknown>,
  ...args: unknown extends C ? [] | [C] : [C]
): Result<T, E> {
  let decoder = Decoder.from(bytes);
  if (decodeSymbol in cb) {
    const ctx = (args as [C])[0];
    return cb[decodeSymbol](decoder, ctx);
  }

  const ctx = (args as [C])[0];
  return cb(decoder, ctx);
}
