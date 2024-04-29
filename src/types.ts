import { Result } from "resultra";
import { EncodingError } from "./EncodingError";
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
  done(): boolean;
}
export interface IEncoder {
  write(byte: number): this;
  writeSlice(bytes: Uint8Array): this;
}

export type TDecodeFunction<T, Ctx, Err> = (
  decoder: IDecoder,
  ctx: Ctx,
) => Result<T, Err>;

export type TEncodeFunction<T, Ctx, Err> = (
  value: T,
  decoder: IEncoder,
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
