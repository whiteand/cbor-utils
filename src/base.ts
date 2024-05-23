import { Result } from "resultra";
import {
  decodeCtxSymbol,
  decodeErrSymbol,
  decodeSymbol,
  decodeTypeSymbol,
  encodeCtxSymbol,
  encodeErrSymbol,
  encodeSymbol,
  encodeTypeSymbol,
} from "./traits";
import {
  CtxParam,
  ICborType,
  ICborTypeCodec,
  IDecoder,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";
import { Pipeable } from "./pipe";

/**
 * A class that represents a CBOR type.
 *
 * It can encode and decode values of type T.
 *
 * EE - is an encoding error.
 * DE - is a decoding error.
 * EC - is an encoding context.
 * DC - is a decoding context.
 *
 * Example:
 *
 * ```ts
 * import { u8, CborType, UnexpectedValueError } from '@whiteand/cbor'
 *
 * const two = CborType.from(
 *   (value: 2, e) => u8.encode(2, e),
 *   (d): Result<2, UnexpectedValueError<number, 2> | DecodingError> => {
 *     const res = u8.decode(d);
 *     if (!res.ok()) return res;
 *     if (res.value !== 2)
 *       return new UnexpectedValueError(2, res.value).err();
 *     return ok(2);
 *   }
 * );
 *
 * const encoded = encode((e) => two.encode(2, e));
 * expect(encoded).toEqual(new Uint8Array([2]))
 * const decoded = decode(encoded, (d) => two.decode(d)).unwrap();
 *
 * expect(decoded).toBe(2);
 * ```
 */
export class CborType<T, EE extends Error, DE extends Error, EC, DC>
  extends Pipeable
  implements ICborTypeCodec<T, EE, DE, EC, DC>
{
  /**
   * A field just for type inference.
   * It has a type that can be decoded
   * using this cbor type.
   * (but it always has null value)
   */
  [decodeTypeSymbol]: T = null as never;
  /**
   * A field just for type inference.
   * It contains a decoding context type.
   * (but it always has null value)
   */
  [decodeCtxSymbol]: DC = null as never;
  /**
   * A field just for type inference.
   * it contains decoding error type.
   * (but it always has nul value)
   */
  [decodeErrSymbol]: DE = null as never;
  /**
   * A field just for type inference.
   * It contains a type that can be encoded using this cbor type.
   * (but it always has null value)
   */
  [encodeTypeSymbol]: T = null as never;
  /**
   * A field just for type inference.
   * It contains an encoding context type.
   * (but it always has null value)
   */
  [encodeCtxSymbol]: EC = null as never;
  /**
   * A field just for type inference.
   * It contains an encoding error type.
   * (but it always has null value)
   */
  [encodeErrSymbol]: EE = null as never;
  /**
   * A field that contains a function that can encode
   * a value of type T using context of type EC
   * that can be failed because of error of type EE.
   */
  [encodeSymbol]: TEncodeFunction<T, EE, EC> = null as never;
  /**
   * A field that contains a function that can decode
   * a value of type T using context of type DC
   * that can be failed because of error of type DE.
   */
  [decodeSymbol]: TDecodeFunction<T, DE, DC> = null as never;
  /**
   * Creates an instance of CborType using encode and decode functions.
   *
   * Note: Prefer using `CborType.from` instead of this constructor.
   *
   * @param enc Function that encodes value
   * @param dec Function that decodes value
   */
  constructor(
    enc: TEncodeFunction<T, EE, EC>,
    dec: TDecodeFunction<T, DE, DC>
  ) {
    super();
    this[encodeSymbol] = enc;
    this[decodeSymbol] = dec;
  }

  /**
   * @param d Decoder (the object that contains raw bytes and pointer to the current position in the buffer)
   * @param ctx Possible additional context for decoding.
   * @returns Result of decoding.
   */
  decode(d: IDecoder, ctx: CtxParam<DC>): Result<T, DE> {
    return this[decodeSymbol](d, ctx as DC);
  }
  /**
   * @param value Value to encode.
   * @param e Encoder (the object that contains buffer that we fill with new data items during encoding)
   * @param ctx Possible additional context for encoding.
   * @returns Result of encoding.
   */
  encode(value: T, e: IEncoder, ctx: CtxParam<EC>): Result<void, EE> {
    return this[encodeSymbol](value, e, ctx as EC);
  }

  /**
   * it is used to:
   * - create a new instance of CborType from encode and decode function
   * - transform value of ICborType to CborType instance
   * @param enc
   * @param dec
   */
  static from<T, EE extends Error, DE extends Error, EC, DC>(
    enc: TEncodeFunction<T, EE, EC>,
    dec: TDecodeFunction<T, DE, DC>
  ): CborType<T, EE, DE, EC, DC>;
  static from<T, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<T, EE, DE, EC, DC>
  ): CborType<T, EE, DE, EC, DC>;
  static from(encOrTy: any, dec?: any): any {
    if (encOrTy instanceof CborType) {
      return encOrTy;
    }
    if (typeof encOrTy === "function" && typeof dec === "function") {
      return new CborType(encOrTy, dec);
    }
    return new CborType(
      (v, e, c) => encOrTy[encodeSymbol](v, e, c),
      (d, c) => encOrTy[decodeSymbol](d, c)
    );
  }

  /**
   * @param toTarget Maps decoded value to a target type
   * @param fromTarget Maps target type to a value that should be encoded
   * @returns new CborType instance where Target type is one that is encoded and decoded
   */
  convert<Target>(
    toTarget: (source: T) => Target,
    fromTarget: (target: Target) => T
  ): CborType<Target, EE, DE, EC, DC> {
    return new CborType<Target, EE, DE, EC, DC>(
      (v, e, ctx) => this[encodeSymbol](fromTarget(v), e, ctx as EC),
      (d, ctx) => this[decodeSymbol](d, ctx as DC).map(toTarget)
    );
  }
}
