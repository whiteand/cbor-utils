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

export type TDecodeFunction<out T, out Err, in Ctx> = (
  decoder: IDecoder,
  ctx: Ctx
) => Result<T, Err>;

export type TEncodeFunction<in T, out Err, in Ctx> = (
  value: T,
  encoder: IEncoder,
  ctx: Ctx
) => Result<void, Err>;

export interface IDecodableType<
  T = any,
  Err extends Error = Error,
  Ctx = unknown
> {
  readonly [decodeTypeSymbol]: T;
  readonly [decodeCtxSymbol]: Ctx;
  readonly [decodeErrSymbol]: Err;
  readonly [decodeSymbol]: TDecodeFunction<T, Err, Ctx>;
}

export type AnyDecodableType = IDecodableType<any, any, any>;
export type AnyEncodableType = IEncodableType<any, any, any>;

export type DecodedType<T extends AnyDecodableType> = T extends T
  ? T[typeof decodeTypeSymbol]
  : never;
export type EncodedType<T extends AnyEncodableType> = T extends T
  ? T[typeof encodeTypeSymbol]
  : never;
export type DecodeError<T extends AnyDecodableType> = T extends T
  ? T[typeof decodeErrSymbol]
  : never;

export type DecodeContext<T extends AnyDecodableType> = T extends T
  ? T[typeof decodeCtxSymbol]
  : never;

export type EncodeError<T extends AnyEncodableType> = T extends T
  ? T[typeof encodeErrSymbol]
  : never;

export type EncodeContext<T extends AnyEncodableType> = T extends T
  ? T[typeof encodeCtxSymbol]
  : never;

export type CtxParam<C> = C extends unknown ? void : C;

export interface IDecodableTypeDecoder<
  T = any,
  Err extends Error = Error,
  Ctx = unknown
> extends IDecodableType<T, Err, Ctx> {
  decode(
    d: IDecoder,
    ...args: unknown extends Ctx ? [] | [Ctx] : [Ctx]
  ): Result<T, Err>;
}

export interface IEncodableType<
  T = any,
  Err extends Error = Error,
  Ctx = unknown
> {
  readonly [encodeTypeSymbol]: T;
  readonly [encodeCtxSymbol]: Ctx;
  readonly [encodeErrSymbol]: Err;
  readonly [encodeSymbol]: TEncodeFunction<T, Err, Ctx>;
}
export interface IEncodableTypeEncoder<
  T = any,
  Err extends Error = Error,
  Ctx = unknown
> extends IEncodableType<T, Err, Ctx> {
  encode(
    value: T,
    e: IEncoder,
    ...args: unknown extends Ctx ? [] | [Ctx] : [Ctx]
  ): Result<void, Err>;
}

export interface ICborType<
  T = any,
  EncodeErr extends Error = Error,
  DecodeErr extends Error = Error,
  EncodeCtx = any,
  DecodeCtx = any
> extends IDecodableType<T, DecodeErr, DecodeCtx>,
    IEncodableType<T, EncodeErr, EncodeCtx> {}

export interface ICborTypeCodec<
  T = any,
  EncodeErr extends Error = Error,
  DecodeErr extends Error = Error,
  EncodeCtx = any,
  DecodeCtx = any
> extends IDecodableTypeDecoder<T, DecodeErr, DecodeCtx>,
    IEncodableTypeEncoder<T, EncodeErr, EncodeCtx> {}
