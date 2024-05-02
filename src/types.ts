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
export interface ISmartDecoder extends IDecoder {
  decode<T, E>(t: IDecodableType<T, unknown, E>): Result<T, E>;
  decode<T, C, E>(t: IDecodableType<T, C, E>, c: C): Result<T, E>;
}
export interface IEncoder {
  write(byte: number): this;
  writeSlice(bytes: Uint8Array): this;
  save(): number;
  restore(pos: number): void;
}
export interface ISmartEncoder extends IEncoder {
  encode<T, E>(t: IEncodableType<T, unknown, E>, value: T): Result<null, E>;
  encode<T, C, E>(t: IEncodableType<T, C, E>, value: T, c: C): Result<null, E>;
}
export type TDecodeFunction<T, Ctx, Err> = (
  decoder: IDecoder,
  ctx: Ctx,
) => Result<T, Err>;

export type TEncodeFunction<T, Ctx, Err> = (
  value: T,
  encoder: IEncoder,
  ctx: Ctx,
) => Result<null, Err>;

export interface IDecodableType<T = any, Ctx = any, Err = any> {
  [decodeTypeSymbol]: T;
  [decodeCtxSymbol]: Ctx;
  [decodeErrSymbol]: Err;
  [decodeSymbol]: TDecodeFunction<T, Ctx, Err>;
}

export interface IEncodableType<T = any, Ctx = any, Err = any> {
  [encodeTypeSymbol]: T;
  [encodeCtxSymbol]: Ctx;
  [encodeErrSymbol]: Err;
  [encodeSymbol]: TEncodeFunction<T, Ctx, Err>;
}

export interface ICborType<T, EncodeCtx, EncodeErr, DecodeCtx, DecodeErr>
  extends IDecodableType<T, DecodeCtx, DecodeErr>,
    IEncodableType<T, EncodeCtx, EncodeErr> {}
