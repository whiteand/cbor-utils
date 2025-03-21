import { err, Result } from "resultra";
import { NotImplementedError } from "./errors";
import { Pipeable } from "./pipe";
import {
  AnyContextArgs,
  ContextFromArgs,
  ICborType,
  IDecoder,
  IEncoder,
  NotImportant,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";

const getDefaultEncode = () => () => err(new NotImplementedError("encode"));
const getDefaultDecode = () => () => err(new NotImplementedError("decode"));

export class CborBuilder<
  ET,
  DT,
  EE extends Error,
  DE extends Error,
  ECArgs extends AnyContextArgs,
  DCArgs extends AnyContextArgs
> {
  private _encode: (
    value: ET,
    e: IEncoder,
    ...args: ECArgs
  ) => Result<void, EE>;

  private _decode: (d: IDecoder, ...args: DCArgs) => Result<DT, DE>;
  private _nullable: boolean;

  constructor() {
    this._encode = getDefaultEncode() as unknown as (
      value: ET,
      e: IEncoder,
      ...args: ECArgs
    ) => Result<void, EE>;
    this._decode = getDefaultDecode() as unknown as (
      d: IDecoder,
      ...args: DCArgs
    ) => Result<DT, DE>;
    this._nullable = false;
  }
  encode<NET, NEE extends Error>(
    fn: (v: NET, e: IEncoder) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, [], DCArgs>;
  encode<NET, NEE extends Error, NEC>(
    fn: (value: NET, e: IEncoder, ctx: NEC) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, [NEC], DCArgs>;
  encode<NET, NEE extends Error, NEC extends AnyContextArgs>(
    fn: (value: NET, e: IEncoder, ctx: any) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, NEC, DCArgs>;
  encode<NET, NEE extends Error, NEC extends AnyContextArgs>(
    fn: (value: NET, e: IEncoder, ...ctx: NEC) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, NEC, DCArgs>;
  encode(encode: NotImportant) {
    this._encode = encode;
    return this as CborBuilder<
      NotImportant,
      DT,
      NotImportant,
      DE,
      NotImportant,
      DCArgs
    >;
  }

  decode<NDT, NDE extends Error>(
    fn: (d: IDecoder) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, ECArgs, [unknown]>;
  decode<NDT, NDE extends Error, NDC>(
    fn: (d: IDecoder, ctx: NDC) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, ECArgs, [NDC]>;
  decode<NDT, NDE extends Error, NDC extends AnyContextArgs>(
    fn: (d: IDecoder, ...ctx: NDC) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, ECArgs, NDC>;
  decode(decode: NotImportant) {
    this._decode = decode;
    return this as CborBuilder<
      ET,
      NotImportant,
      EE,
      NotImportant,
      ECArgs,
      NotImportant
    >;
  }

  nullable(value = true): this {
    this._nullable = value;
    return this;
  }
  build(): CborType<ET, DT, EE, DE, ECArgs, DCArgs> {
    return new CborType(this._encode, this._decode, this._nullable);
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
export class CborType<
    ET,
    DT,
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >
  extends Pipeable
  implements ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
{
  /** Virtual field just for type inference */
  __inferEncodedValue!: ET;
  /** Virtual field just for type inference */
  __inferEncodingCtx!: ContextFromArgs<ECArgs>;
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
  encode: (value: ET, e: IEncoder, ...args: ECArgs) => Result<void, EE>;

  /** Virtual field just for type inference */
  __inferDecodedValue!: DT;
  /** Virtual field just for type inference */
  __inferDecodingCtx!: ContextFromArgs<DCArgs>;
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
  decode: (d: IDecoder, ...args: DCArgs) => Result<DT, DE>;
  public nullable: boolean;

  constructor(
    encode: (value: ET, e: IEncoder, ...ctx: ECArgs) => Result<void, EE>,
    decode: (d: IDecoder, ...ctx: DCArgs) => Result<DT, DE>,
    nullable: boolean
  ) {
    super();
    this.encode = encode;
    this.decode = decode;
    this.nullable = nullable;
  }
  static builder(): CborBuilder<
    never,
    never,
    NotImplementedError,
    NotImplementedError,
    [],
    []
  > {
    return new CborBuilder();
  }
  static from<
    ET,
    DT,
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >(
    ty: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
  ): CborType<ET, DT, EE, DE, ECArgs, DCArgs> {
    return ty instanceof CborType
      ? ty
      : CborType.builder()
          .encode(
            ((v: ET, e: IEncoder, c: NotImportant): Result<void, EE> =>
              (ty.encode as NotImportant)(v, e, c)) as TEncodeFunction<
              ET,
              EE,
              ECArgs
            >
          )
          .decode(
            ((d: IDecoder, c: NotImportant): Result<DT, DE> =>
              (ty.decode as NotImportant)(
                d,
                c
              )) as NotImportant as TDecodeFunction<DT, DE, DCArgs>
          )
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
  ): CborType<T, T, EE, DE, ECArgs, DCArgs> {
    const obj = {
      encode: (value: T, encoder: IEncoder, ctx: ContextFromArgs<ECArgs>) => {
        return (this.encode as NotImportant)(
          toOldEncodedValue(value),
          encoder,
          ctx
        );
      },
      decode: (decoder: IDecoder, ctx: ContextFromArgs<DCArgs>) => {
        return (this.decode as NotImportant)(decoder, ctx).map(
          toNewDecodedValue
        );
      },
    };

    Reflect.setPrototypeOf(obj, this);

    return obj as NotImportant as CborType<T, T, EE, DE, ECArgs, DCArgs>;
  }
}
