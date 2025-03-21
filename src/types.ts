import type { Result } from "resultra";

/**
 * Context is either present or absent based on the type of arguments
 */
export type AnyContextArgs = [] | [NotImportant];

export type AndContextArgs<
  CtxAArgs extends AnyContextArgs,
  CtxBArgs extends AnyContextArgs
> = Extract<
  [...CtxAArgs, ...CtxBArgs] extends [infer A, infer B]
    ? [A & B]
    : [...CtxAArgs, ...CtxBArgs],
  [] | [NotImportant]
>;

export type AndContext<CtxA, CtxB> = unknown extends CtxA
  ? CtxB
  : unknown extends CtxB
  ? CtxA
  : CtxA & CtxB;

/** If args possiblly empty - then context is not necessary,therefore unknown */
export type ContextFromArgs<Args extends AnyContextArgs> = Args extends Args
  ? [] extends Args
    ? unknown
    : Args[0]
  : never;

/** if context is unknown then we do not need to require the passing of context */
export type ArgsFromContext<C> = unknown extends C ? [] | [NotImportant] : [C];

/**
 * Represents the source of the encoded cbor bytes
 * It's a simple wrapper over the array of bytes
 * You can feel free to update it's fields in your CBOR types
 * but just be careful.
 */
export interface IDecoder {
  /**
   * Buffer of bytes to decode
   */
  buf: Uint8Array;

  /**
   * Position of the next byte that will be used in decoding
   * Usually it is incremented by the size of data item
   * after data item is decoded
   */
  ptr: number;
}

/**
 * Represents the receiver of the encoded cbor bytes
 * in the process of encoding
 */
export interface IEncoder {
  /**
   * Writes a byte to the output
   * @param byte - byte to write to the output
   * @returns this for chaining
   */
  write(byte: number): this;
  /**
   * Writes several bytes at once to the output
   *
   * @param bytes - bytes
   * @return this for chaining
   */
  writeSlice(bytes: Uint8Array): this;
  /**
   * Returns current position of the output cursor
   * to be able to return to it later
   *
   * @returns current position
   */
  save(): number;
  /**
   * Return next byte cursor to the provided position
   *
   * @param pos - position to move back to
   */
  restore(pos: number): this;
  /**
   * Ensures that the buffer can hold at least `size` bytes more
   */
  reserve(size: number): this;
}

/** Describes the signature of encode function
 * @typeParam T - Type of value that can be encoded
 * @typeParam EE - Type of error that can be returned when encoding fails
 * @typeParam EC - Type of context that can be passed during encoding
 * @param value - Value to encode
 * @param e - Encoder to write to
 * @param args - Additional context argument (if necessary)
 */
export type TEncodeFunction<in T, out EE, ECArgs extends AnyContextArgs> = (
  value: T,
  e: IEncoder,
  ...args: ECArgs
) => Result<void, EE>;

/**
 * Interface of something that can be encoded.
 *
 * @typeParam T - Type of value that can be encoded
 * @typeParam EE - Type of error that can be returned when encoding fails
 * @typeParam EC - Type of context that can be passed during encoding
 */
export interface IEncodable<T, EE, ECArgs extends AnyContextArgs> {
  /** Virtual fields necessary only for type inference */
  __inferEncodedValue: T;
  /** Virtual fields necessary only for type inference */
  __inferEncodingCtx: ContextFromArgs<ECArgs>;
  /** Virtual fields necessary only for type inference */
  __inferEncodingError: EE;

  /**
   * Encodes the value of type `T` into encoder `e`
   * using context passed as last argument (if necessary)
   *
   * @param value - Value to encode
   * @param e - Encoder to write to
   * @param args - Additional context argument (if necessary)
   * @returns Result of encoding
   */
  encode: (value: T, e: IEncoder, ...args: ECArgs) => Result<void, EE>;
}

/** Describes the signature of decode function */
export type TDecodeFunction<T, DE, DCArgs extends AnyContextArgs> = (
  d: IDecoder,
  ...args: DCArgs
) => Result<T, DE>;

/**
 * Interface of something that can be decoded.
 *
 * @typeParam T - Type of value that can be decoded
 * @typeParam DE - Type of error that can be returned when decoding fails
 * @typeParam DC - Type of context that can be passed during decoding
 */
export interface IDecodable<T, DE, DCArgs extends AnyContextArgs> {
  /** Virtual fields necessary only for type inference */
  __inferDecodedValue: T;
  /** Virtual fields necessary only for type inference */
  __inferDecodingCtx: ContextFromArgs<DCArgs>;
  /** Virtual fields necessary only for type inference */
  __inferDecodingError: DE;

  /**
   * Decodes the value of type `T` from decoder `d`
   * using context passed as last argument (if necessary)
   *
   * @param d - Decoder to read from
   * @param args - Additional context argument (if necessary)
   * @returns Result of decoding
   */
  decode: (d: IDecoder, ...args: DCArgs) => Result<T, DE>;
}

/**
 * Describes the interface of CBOR Type
 *
 * @typeParam ET - Encoded Type
 * @typeParam DT - Decoded Type
 * @typeParam EE - Encoding Error
 * @typeParam DE - Decoding Error
 * @typeParam EC - Encoding Context
 * @typeParam DC - Decoding Context
 */
export interface ICborType<
  ET = NotImportant,
  DT = NotImportant,
  EE extends Error = Error,
  DE extends Error = Error,
  ECArgs extends AnyContextArgs = AnyContextArgs,
  DCArgs extends AnyContextArgs = AnyContextArgs
> extends IEncodable<ET, EE, ECArgs>,
    IDecodable<DT, DE, DCArgs> {
  /** if true the underlying cbor can consist of a single Null data item. */
  nullable: boolean;
}
/** All CBOR types are assignable to a variable for type `AnyCborTypeCodec` */
export type AnyCborTypeCodec = ICborType<
  NotImportant,
  NotImportant,
  Error,
  Error,
  NotImportant,
  NotImportant
>;

/** All decodable types are assignable to a variable of type `AnyDecodableType` */
export type AnyDecodableType = IDecodable<
  NotImportant,
  NotImportant,
  [] | [NotImportant]
>;

/** All encodable types are assignable to a variable of type `AnyEncodableType` */
export type AnyEncodableType = IEncodable<
  NotImportant,
  NotImportant,
  [] | [NotImportant]
>;

/** Infers decoded type from the passed cbor type */
export type DecodedType<T extends { __inferDecodedValue: NotImportant }> =
  T extends T ? T["__inferDecodedValue"] : never;
/** Infers encoded tpye from the passed cbor type */
export type EncodedType<T extends { __inferEncodedValue: NotImportant }> =
  T extends T ? T["__inferEncodedValue"] : never;

/** Infers decoding error type from the passed cbor type */
export type DecodeError<T extends { __inferDecodingError: NotImportant }> =
  T extends T ? T["__inferDecodingError"] : never;

/** Infers decoding context type from the passed cbor type */
export type DecodeContext<T extends { __inferDecodingCtx: NotImportant }> =
  T extends T ? T["__inferDecodingCtx"] : never;

/** Infers encoding error type from the passed cbor type */
export type EncodeError<T extends { __inferEncodingError: NotImportant }> =
  T extends T ? T["__inferEncodingError"] : never;

/** Infers encoding context type from the passed cbor type */
export type EncodeContext<T extends { __inferEncodingCtx: NotImportant }> =
  T extends T ? T["__inferEncodingCtx"] : never;

/** Helper that allows to use either specific type or default one if not proper */
export type Assume<T, U> = T extends U ? T : U;

/** Just an alias for any which is used when we are not interested in the exact type details */
// deno-lint-ignore no-explicit-any
export type NotImportant = any;
