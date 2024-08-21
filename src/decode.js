import { catchError } from "resultra/utils";
import { Decoder, ThrowOnFailDecoder } from "./Decoder";

/**
 * @param b bytes to decode from
 * @param cb callback that will be called that should throw an error if decoding fails
 * @returns result of decoding, or error if decoding failed
 */
export const tryDecode = (b, cb) => catchError(cb, new ThrowOnFailDecoder(b));


/**
 * @param bytes Bytes or Decoder
 * @param cb function that usess passed decoder to decode value
 * @param args optional context argument
 * @returns Result of decoded value
 */
export const decode = (
  bytes,
  cb,
  ctx
) => cb(Decoder.from(bytes), ctx)

decode.type = (
  bytes,
  ty,
  ctx,
) => ty.decode(Decoder.from(bytes), ctx)

