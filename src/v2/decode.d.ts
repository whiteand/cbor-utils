import { Result } from "resultra";
import { IDecodable, IDecoder } from "./types";
import { Decoder, ThrowOnFailDecoder } from "./Decoder";

/**
 * @param b bytes to decode from
 * @param cb callback that will be called that should throw an error if decoding fails
 * @returns result of decoding, or error if decoding failed
 */
declare const tryDecode: <T>(
  bytes: Uint8Array,
  cb: (e: ThrowOnFailDecoder) => T
) => Result<T, unknown>;

type TDecodeFunction = (<T, E extends Error, C>(
  bytes: Uint8Array | IDecoder,
  cb: (d: Decoder, ctx: C) => Result<T, E>,
  ...args: unknown extends C ? [] | [C] : [C]
) => Result<T, E>) & {
  type: <T, E extends Error, C>(
    bytes: Uint8Array | IDecoder,
    ty: IDecodable<T, E, C>,
    ...args: unknown extends C ? [] | [C] : [C]
  ) => Result<T, E>;
};

/**
 * @param bytes Bytes or Decoder
 * @param cb function that usess passed decoder to decode value
 * @param args optional context argument
 * @returns Result of decoded value
 */
declare const decode: TDecodeFunction;
