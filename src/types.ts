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

export interface IEncodable<T, EE, EC> {
  __inferEncodedValue: T;
  __inferEncodingCtx: EC;
  __inferEncodingError: EE;
  encode: TEncodeFunction<T, EE, EC>;
}

export type TDecodeFunction<T, DE, DC> = (
  d: IDecoder,
  ...args: unknown extends DC ? [] | [DC] : [DC]
) => Result<T, DE>;

export interface IDecodable<T, DE, DC> {
  __inferDecodedValue: T;
  __inferDecodingCtx: DC;
  __inferDecodingError: DE;
  decode: TDecodeFunction<T, DE, DC>;
}

export interface ICborType<
  ET = any,
  DT = any,
  EE extends Error = Error,
  DE extends Error = Error,
  EC = unknown,
  DC = unknown
> extends IEncodable<ET, EE, EC>,
    IDecodable<DT, DE, DC> {
  nullable: boolean;
}
export type AnyCborTypeCodec = ICborType<any, any, Error, Error, any, any>;

export type AnyDecodableType = IDecodable<any, any, any>;
export type AnyEncodableType = IEncodable<any, any, any>;

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
