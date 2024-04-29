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
} from "../traits";
import {
  ICborType,
  IDecoder,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "../types";

export function createContextfulType<T, EC, EE, DC, DE>(
  encode: TEncodeFunction<T, EC, EE>,
  decode: TDecodeFunction<T, DC, DE>,
): ICborType<T, EC, EE, DC, DE> {
  return {
    [encodeSymbol]: encode,
    [decodeSymbol]: decode,
    [decodeErrSymbol]: null as never,
    [encodeErrSymbol]: null as never,
    [encodeCtxSymbol]: null as never,
    [decodeCtxSymbol]: null as never,
    [decodeTypeSymbol]: null as never,
    [encodeTypeSymbol]: null as never,
  };
}

export function createType<T, EE, DE>(
  encode: (value: T, e: IEncoder) => Result<null, EE>,
  decode: (d: IDecoder) => Result<T, DE>,
): ICborType<T, unknown, EE, unknown, DE> {
  return createContextfulType(encode, decode);
}
