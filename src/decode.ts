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

type TDecodeFunction = (<T, E extends Error, C>(
  bytes: Uint8Array | IDecoder,
  cb: (d: Decoder, ctx: C) => Result<T, E>,
  ...args: unknown extends C ? [] | [C] : [C]
) => Result<T, E>) & {
  type: <T, E extends Error, C>(
    bytes: Uint8Array | IDecoder,
    ty: IDecodableType<T, E, C>,
    ...args: unknown extends C ? [] | [C] : [C]
  ) => Result<T, E>;
};

/**
 * @param bytes Bytes or Decoder
 * @param cb function that usess passed decoder to decode value
 * @param args optional context argument
 * @returns Result of decoded value
 */
export const decode: TDecodeFunction = Object.assign(
  <T, E extends Error, C>(
    bytes: Uint8Array | IDecoder,
    cb: (d: Decoder, ctx: C) => Result<T, E>,
    ...args: unknown extends C ? [] | [C] : [C]
  ): Result<T, E> => {
    let decoder = Decoder.from(bytes);
    const ctx = (args as [C])[0];
    return cb(decoder, ctx);
  },
  {
    type: <T, E extends Error, C>(
      bytes: Uint8Array | IDecoder,
      ty: IDecodableType<T, E, C>,
      ...args: unknown extends C ? [] | [C] : [C]
    ): Result<T, E> => {
      let decoder = Decoder.from(bytes);
      const ctx = (args as [C])[0];
      return ty[decodeSymbol](decoder, ctx);
    },
  }
);
