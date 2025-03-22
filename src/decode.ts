import { catchError } from "resultra/utils";
import { Decoder, ThrowOnFailDecoder } from "./Decoder";
import { Result } from "resultra";
import { AnyContextArgs, IDecodable, IDecoder, Z } from "./types";

/** A type of the decode function */
type TDecodeFunction = (<T, E extends Error, C>(
  bytes: Uint8Array | IDecoder,
  cb: (d: Decoder, ctx: C) => Result<T, E>,
  ...args: unknown extends C ? [] | [C] : [C]
) => Result<T, E>) & {
  type: <const T, const E extends Error, CArgs extends AnyContextArgs>(
    bytes: Uint8Array | IDecoder,
    ty: IDecodable<T, E, CArgs>,
    ...args: CArgs
  ) => Result<T, E>;
};

/**
 * A function that creates decoder and passes it to the callback
 * the result of callback call is returned as ok result.
 *
 * Underlying decoder throws an error if decoding fails.
 * This error is catched and returned as a error result.
 *
 * @param b bytes to decode from
 * @param cb callback that will be called that should throw an error if decoding fails
 * @returns result of decoding, or error if decoding failed
 */
export const tryDecode: <T>(
  bytes: Uint8Array,
  cb: (e: ThrowOnFailDecoder) => T
) => Result<T, unknown> = (b, cb) => catchError(cb, new ThrowOnFailDecoder(b));

/**
 * A function that creates decoder and passes it to the callback
 * the result of callback as a result of decoding.
 *
 * You can use `decode.type` to decode a specific CBOR Type without usage of callback.
 *
 * @param bytes Bytes or Decoder
 * @param cb function that usess passed decoder to decode value
 * @param args optional context argument
 * @returns Result of decoded value
 */
export const decode: TDecodeFunction = ((bytes, cb, ctx) =>
  cb(Decoder.from(bytes), ctx as Z)) as TDecodeFunction;

decode.type = ((bytes, ty, ctx) =>
  (ty.decode as Z)(Decoder.from(bytes), ctx)) as TDecodeFunction["type"];
