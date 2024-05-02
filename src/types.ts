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

export type TDecodeFunction<T, Ctx, Err> = (
  decoder: IDecoder,
  ctx: Ctx,
) => Result<T, Err>;

export type TEncodeFunction<T, Ctx, Err> = (
  value: T,
  encoder: IEncoder,
  ctx: Ctx,
) => Result<void, Err>;

export interface IDecodableType<T = any, Ctx = void, Err = any> {
  [decodeTypeSymbol]: T;
  [decodeCtxSymbol]: Ctx;
  [decodeErrSymbol]: Err;
  [decodeSymbol]: TDecodeFunction<T, Ctx, Err>;
}
export interface IDecodableTypeDecoder<T = any, Ctx = void, Err = any>
  extends IDecodableType<T, Ctx, Err> {
  decode(d: IDecoder, ctx: Ctx): Result<T, Err>;
}

export interface IEncodableType<T = any, Ctx = any, Err = any> {
  [encodeTypeSymbol]: T;
  [encodeCtxSymbol]: Ctx;
  [encodeErrSymbol]: Err;
  [encodeSymbol]: TEncodeFunction<T, Ctx, Err>;
}
export interface IEncodableTypeEncoder<T = any, Ctx = void, Err = any>
  extends IEncodableType<T, Ctx, Err> {
  encode(value: T, e: IEncoder, ctx: Ctx): Result<void, Err>;
}

export interface ICborType<T, EncodeCtx, EncodeErr, DecodeCtx, DecodeErr>
  extends IDecodableType<T, DecodeCtx, DecodeErr>,
    IEncodableType<T, EncodeCtx, EncodeErr> {}

export interface ICborTypeCodec<T, EncodeCtx, EncodeErr, DecodeCtx, DecodeErr>
  extends IDecodableTypeDecoder<T, DecodeCtx, DecodeErr>,
    IEncodableTypeEncoder<T, EncodeCtx, EncodeErr> {}
