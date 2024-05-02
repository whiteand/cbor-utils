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
  ICborTypeCodec,
  IDecoder,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";
import { Pipeable } from "./pipe";

export class CborType<T, EC, EE, DC, DE>
  extends Pipeable
  implements ICborTypeCodec<T, EC, EE, DC, DE>
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

  decode(d: IDecoder, ctx: DC): Result<T, DE> {
    return this[decodeSymbol](d, ctx);
  }
  encode(value: T, e: IEncoder, ctx: EC): Result<void, EE> {
    return this[encodeSymbol](value, e, ctx);
  }

  static from<T, EC, EE, DC, DE>(
    t: ICborType<T, EC, EE, DC, DE>,
  ): CborType<T, EC, EE, DC, DE> {
    if (t instanceof CborType) {
      return t;
    }
    return new CborType(
      (v, e, c) => t[encodeSymbol](v, e, c),
      (d, c) => t[decodeSymbol](d, c),
    );
  }
}
