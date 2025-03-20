import { err, Result } from "resultra";
import { NotImplementedError } from "./errors";
import { Pipeable } from "./pipe";
import { ICborType, IDecoder, IEncoder, NotImportant } from "./types";

const getDefaultEncode = () => () => err(new NotImplementedError("encode"));
const getDefaultDecode = () => () => err(new NotImplementedError("decode"));

export class CborBuilder<ET, DT, EE extends Error, DE extends Error, EC, DC> {
  private _encode: (
    value: ET,
    e: IEncoder,
    ...args: unknown extends EC ? [] | [EC] : [EC]
  ) => Result<void, EE>;

  private _decode: (
    d: IDecoder,
    ...args: unknown extends DC ? [] | [DC] : [DC]
  ) => Result<DT, DE>;
  private _nullable: boolean;

  constructor() {
    this._encode = getDefaultEncode() as unknown as (
      value: ET,
      e: IEncoder,
      ...args: unknown extends EC ? [] | [EC] : [EC]
    ) => Result<void, EE>;
    this._decode = getDefaultDecode() as unknown as (
      d: IDecoder,
      ...args: unknown extends DC ? [] | [DC] : [DC]
    ) => Result<DT, DE>;
    this._nullable = false;
  }
  encode<NET, NEE extends Error>(
    fn: (v: NET, e: IEncoder) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, unknown, DC>;
  encode<NET, NEE extends Error, NEC>(
    fn: (value: NET, e: IEncoder, ctx: NEC) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, NEC, DC>;
  encode(encode: NotImportant) {
    this._encode = encode;
    return this as CborBuilder<
      NotImportant,
      DT,
      NotImportant,
      DE,
      NotImportant,
      DC
    >;
  }

  decode<NDT, NDE extends Error>(
    fn: (d: IDecoder) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, EC, unknown>;
  decode<NDT, NDE extends Error, NDC>(
    fn: (d: IDecoder, ctx: NDC) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, EC, NDC>;
  decode(decode: NotImportant) {
    this._decode = decode;
    return this as CborBuilder<
      ET,
      NotImportant,
      EE,
      NotImportant,
      EC,
      NotImportant
    >;
  }

  nullable(value = true): this {
    this._nullable = value;
    return this;
  }
  build(): CborType<ET, DT, EE, DE, EC, DC> {
    return new CborType(
      this._encode as (value: ET, e: IEncoder, ctx: EC) => Result<void, EE>,
      this._decode as (d: IDecoder, ctx: DC) => Result<DT, DE>,
      this._nullable
    );
  }
}

/**
 * Core class representing a CBOR type that can encode values to CBOR format and decode them back.
 * Implements the functor pattern through its `convert` method and supports method chaining via `pipe`.
 *
 * Type Parameters:
 * @typeParam ET - Encoded Type. The type of values that can be encoded.
 * @typeParam DT - Decoded Type. The type of values that are produced after decoding.
 * @typeParam EE - Encoding Error. The type of errors that can occur during encoding.
 * @typeParam DE - Decoding Error. The type of errors that can occur during decoding.
 * @typeParam EC - Encoding Context. Additional context needed during encoding.
 * @typeParam DC - Decoding Context. Additional context needed during decoding.
 *
 * Key Features:
 * - Type-safe encoding and decoding
 * - Error handling using Result type
 * - Context-aware operations
 * - Nullable value support
 * - Composable through pipe and convert operations
 */
export class CborType<ET, DT, EE extends Error, DE extends Error, EC, DC>
  extends Pipeable
  implements ICborType<ET, DT, EE, DE, EC, DC>
{
  /** Virtual field just for type inference */
  __inferEncodedValue!: ET;
  /** Virtual field just for type inference */
  __inferEncodingCtx!: EC;
  /** Virtual field just for type inference */
  __inferEncodingError!: EE;
  /**
   * Encodes the value of type `ET` into encoder `e`
   * using context passed as last argument (if necessary)
   *
   * @param value - Value to encode
   * @param e - Encoder to write to
   * @param args - Additional context argument (if necessary)
   * @returns Result of encoding
   */
  encode: (
    value: ET,
    e: IEncoder,
    ...args: unknown extends EC ? [] | [EC] : [EC]
  ) => Result<void, EE>;

  /** Virtual field just for type inference */
  __inferDecodedValue!: DT;
  /** Virtual field just for type inference */
  __inferDecodingCtx!: DC;
  /** Virtual field just for type inference */
  __inferDecodingError!: DE;

  /**
   * Decodes the value of type `DT` from decoder `d`
   * using context passed as last argument (if necessary)
   *
   * @param d - Decoder to read from
   * @param args - Additional context argument (if necessary)
   * @returns Result of decoding
   */
  decode: (
    d: IDecoder,
    ...args: unknown extends DC ? [] | [DC] : [DC]
  ) => Result<DT, DE>;
  public nullable: boolean;

  constructor(
    encode: (value: ET, e: IEncoder, ctx: EC) => Result<void, EE>,
    decode: (d: IDecoder, ctx: DC) => Result<DT, DE>,
    nullable: boolean
  ) {
    super();
    this.encode = encode as (
      value: ET,
      e: IEncoder,
      ...args: unknown extends EC ? [] | [EC] : [EC]
    ) => Result<void, EE>;
    this.decode = decode as (
      d: IDecoder,
      ...args: unknown extends DC ? [] | [DC] : [DC]
    ) => Result<DT, DE>;
    this.nullable = nullable;
  }
  static builder(): CborBuilder<
    never,
    never,
    NotImplementedError,
    NotImplementedError,
    unknown,
    unknown
  > {
    return new CborBuilder();
  }
  static from<ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<ET, DT, EE, DE, EC, DC>
  ): CborType<ET, DT, EE, DE, EC, DC> {
    return ty instanceof CborType
      ? ty
      : CborType.builder()
          .encode(
            (v: ET, e: IEncoder, c: EC): Result<void, EE> => ty.encode(v, e, c)
          )
          .decode((d: IDecoder, c: DC): Result<DT, DE> => ty.decode(d, c))
          .nullable(ty.nullable)
          .build();
  }
  /**
   * Given a source type (`this`) that handles values of type S, creates a target type (`targetTy`)
   * that handles values of type T.
   *
   * NOTE: In functional programming this method makes CborType to become a functor.
   *
   * When decoding: `bytes -> this.decode -> S -> toNewDecodedValue -> T`
   *
   * When encoding: `T -> toOldEncodedValue -> S -> sourceTy.encode -> bytes`
   *
   * @param toNewDecodedValue - Pure function that transforms the decoded value from source type S
   * to target type T. Called after successful decoding to convert the value.
   *
   * @param toOldEncodedValue - Pure function that transforms target type T back to source type S
   * before encoding. Called to prepare the value for encoding.
   *
   *
   * @returns A new CBOR type (targetTy) that handles values of type T while using the original type's
   *          encoding/decoding logic. Inherits error types and context types from the source type.
   *
   * @example
   * ```typescript
   * import { u32 } from '@whiteand/cbor';
   *
   * // Creates a type that handles boolean values using u32 encoding
   * const booleanType = u32.convert(
   *   (num: number) => num !== 0,    // decode: number -> boolean
   *   (bool: boolean) => bool ? 1 : 0 // encode: boolean -> number
   * );
   * ```
   */
  convert<T>(
    toNewDecodedValue: (value: DT) => T,
    toOldEncodedValue: (value: NoInfer<T>) => ET
  ): CborType<T, T, EE, DE, EC, DC> {
    const obj = {
      encode: (value: T, encoder: IEncoder, ctx: EC) => {
        return this.encode(toOldEncodedValue(value), encoder, ctx);
      },
      decode: (decoder: IDecoder, ctx: DC) => {
        return this.decode(decoder, ctx).map(toNewDecodedValue);
      },
    };

    Reflect.setPrototypeOf(obj, this);

    return obj as CborType<T, T, EE, DE, EC, DC>;
  }
}
