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
  CtxParam,
  ICborType,
  ICborTypeCodec,
  IDecoder,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";
import { Pipeable } from "./pipe";

export class CborType<T, EE extends Error, DE extends Error, EC, DC>
  extends Pipeable
  implements ICborTypeCodec<T, EE, DE, EC, DC>
{
  [decodeTypeSymbol]: T = null as never;
  [decodeCtxSymbol]: DC = null as never;
  [decodeErrSymbol]: DE = null as never;
  [encodeTypeSymbol]: T = null as never;
  [encodeCtxSymbol]: EC = null as never;
  [encodeErrSymbol]: EE = null as never;
  [encodeSymbol]: TEncodeFunction<T, EE, EC> = null as never;
  [decodeSymbol]: TDecodeFunction<T, DE, DC> = null as never;
  constructor(
    enc: TEncodeFunction<T, EE, EC>,
    dec: TDecodeFunction<T, DE, DC>,
  ) {
    super();
    this[encodeSymbol] = enc;
    this[decodeSymbol] = dec;
  }

  decode(d: IDecoder, ctx: CtxParam<DC>): Result<T, DE> {
    return this[decodeSymbol](d, ctx as DC);
  }
  encode(value: T, e: IEncoder, ctx: CtxParam<EC>): Result<void, EE> {
    return this[encodeSymbol](value, e, ctx as EC);
  }

  static from<T, EE extends Error, DE extends Error, EC, DC>(
    enc: TEncodeFunction<T, EE, EC>,
    dec: TDecodeFunction<T, DE, DC>,
  ): CborType<T, EE, DE, EC, DC>;
  static from<T, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<T, EE, DE, EC, DC>,
  ): CborType<T, EE, DE, EC, DC>;
  static from(encOrTy: any, dec?: any): any {
    if (encOrTy instanceof CborType) {
      return encOrTy;
    }
    if (typeof encOrTy === "function" && typeof dec === "function") {
      return new CborType(encOrTy, dec);
    }
    return new CborType(
      (v, e, c) => encOrTy[encodeSymbol](v, e, c),
      (d, c) => encOrTy[decodeSymbol](d, c),
    );
  }
}
