import type { Result } from "resultra";

export interface IDecoder {
  buf: Uint8Array;
  ptr: number;
}

export interface IEncoder {
  write(byte: number): this;
  writeSlice(bytes: Uint8Array): this;
  save(): number;
  restore(pos: number): void;
}

export type TEncodeFunction<in T, out EE, EC> = (
  value: T,
  e: IEncoder,
  ...args: unknown extends EC ? [] | [EC] : [EC]
) => Result<void, EE>;

/**
 * Interface of something that can be encoded.
 *
 * @typeParam T - Type of value that can be encoded
 * @typeParam EE - Type of error that can be returned when encoding fails
 * @typeParam EC - Type of context that can be passed during encoding
 */
export interface IEncodable<T, EE, EC> {
  /** Virtual fields necessary only for type inference */
  __inferEncodedValue: T;
  /** Virtual fields necessary only for type inference */
  __inferEncodingCtx: EC;
  /** Virtual fields necessary only for type inference */
  __inferEncodingError: EE;

  encode: (
    value: T,
    e: IEncoder,
    ...args: unknown extends EC ? [] | [EC] : [EC]
  ) => Result<void, EE>;
}

export type TDecodeFunction<T, DE, DC> = (
  d: IDecoder,
  ...args: unknown extends DC ? [] | [DC] : [DC]
) => Result<T, DE>;

export interface IDecodable<T, DE, DC> {
  __inferDecodedValue: T;
  __inferDecodingCtx: DC;
  __inferDecodingError: DE;
  decode: (
    d: IDecoder,
    ...args: unknown extends DC ? [] | [DC] : [DC]
  ) => Result<T, DE>;
}

export interface ICborType<
  ET = NotImportant,
  DT = NotImportant,
  EE extends Error = Error,
  DE extends Error = Error,
  EC = unknown,
  DC = unknown
> extends IEncodable<ET, EE, EC>,
    IDecodable<DT, DE, DC> {
  nullable: boolean;
}
export type AnyCborTypeCodec = ICborType<
  NotImportant,
  NotImportant,
  Error,
  Error,
  NotImportant,
  NotImportant
>;

export type AnyDecodableType = IDecodable<
  NotImportant,
  NotImportant,
  NotImportant
>;
export type AnyEncodableType = IEncodable<
  NotImportant,
  NotImportant,
  NotImportant
>;

export type DecodedType<T extends AnyDecodableType> = T extends T
  ? T["__inferDecodedValue"]
  : never;
export type EncodedType<T extends AnyEncodableType> = T extends T
  ? T["__inferEncodedValue"]
  : never;
export type DecodeError<T extends AnyDecodableType> = T extends T
  ? T["__inferDecodingError"]
  : never;

export type DecodeContext<T extends AnyDecodableType> = T extends T
  ? T["__inferDecodingCtx"]
  : never;

export type EncodeError<T extends AnyEncodableType> = T extends T
  ? T["__inferEncodingError"]
  : never;

export type EncodeContext<T extends AnyEncodableType> = T extends T
  ? T["__inferEncodingCtx"]
  : never;

export type CtxParam<C> = C extends unknown ? void : C;

export type Assume<T, U> = T extends U ? T : U;

// deno-lint-ignore no-explicit-any
export type NotImportant = any;
