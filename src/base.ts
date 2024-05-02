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
import {
  ICborType,
  IDecoder,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";
import { Pipeable } from "./pipe";

export class CborType<T, EC, EE, DC, DE>
  extends Pipeable
  implements ICborType<T, EC, EE, DC, DE>
{
  [decodeTypeSymbol]: T = null as never;
  [decodeCtxSymbol]: DC = null as never;
  [decodeErrSymbol]: DE = null as never;
  [encodeTypeSymbol]: T = null as never;
  [encodeCtxSymbol]: EC = null as never;
  [encodeErrSymbol]: EE = null as never;
  [encodeSymbol]: TEncodeFunction<T, EC, EE> = null as never;
  [decodeSymbol]: TDecodeFunction<T, DC, DE> = null as never;
  constructor(
    enc: TEncodeFunction<T, EC, EE>,
    dec: TDecodeFunction<T, DC, DE>,
  ) {
    super();
    this[encodeSymbol] = enc;
    this[decodeSymbol] = dec;
  }

  encode(value: T, e: IEncoder, ctx: EC): Result<null, EE> {
    return this[encodeSymbol](value, e, ctx);
  }
  decode(d: IDecoder, ctx: DC): Result<T, DE> {
    return this[decodeSymbol](d, ctx);
  }
}

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
