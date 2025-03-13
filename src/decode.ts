import { catchError } from "resultra/utils";
import { Decoder, ThrowOnFailDecoder } from "./Decoder";
import { Result } from "resultra";
import { IDecodable, IDecoder, NotImportant } from "./types";

type TDecodeFunction = (<T, E extends Error, C>(
  bytes: Uint8Array | IDecoder,
  cb: (d: Decoder, ctx: C) => Result<T, E>,
  ...args: unknown extends C ? [] | [C] : [C]
) => Result<T, E>) & {
  type: <const T, const E extends Error, const C>(
    bytes: Uint8Array | IDecoder,
    ty: IDecodable<T, E, C>,
    ...args: unknown extends C ? [] | [C] : [C]
  ) => Result<T, E>;
};


/**
 * @param b bytes to decode from
 * @param cb callback that will be called that should throw an error if decoding fails
 * @returns result of decoding, or error if decoding failed
 */
export const tryDecode: <T>(
  bytes: Uint8Array,
  cb: (e: ThrowOnFailDecoder) => T
) => Result<T, unknown> = (b, cb) => catchError(cb, new ThrowOnFailDecoder(b));


/**
 * @param bytes Bytes or Decoder
 * @param cb function that usess passed decoder to decode value
 * @param args optional context argument
 * @returns Result of decoded value
 */
export const decode: TDecodeFunction = ((
  bytes,
  cb,
  ctx
) => cb(Decoder.from(bytes), ctx as NotImportant)) as TDecodeFunction

decode.type = ((
  bytes,
  ty,
  ctx,
) => ty.decode(Decoder.from(bytes), ctx as NotImportant)) as TDecodeFunction['type']

