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
import { u8 } from "./default/smallInts";

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

  static from<T, EE, DE>(
    enc: (value: T, encoder: IEncoder) => Result<void, EE>,
    dec: (d: IDecoder) => Result<T, DE>,
  ): CborType<T, void, EE, void, DE>;
  static from<T, EE, DC, DE>(
    enc: (value: T, encoder: IEncoder) => Result<void, EE>,
    dec: TDecodeFunction<T, DC, DE>,
  ): CborType<T, void, EE, DC, DE>;
  static from<T, EC, EE, DE>(
    enc: TEncodeFunction<T, EC, EE>,
    dec: (d: IDecoder) => Result<T, DE>,
  ): CborType<T, EC, EE, void, DE>;
  static from<T, EC, EE, DC, DE>(
    enc: TEncodeFunction<T, EC, EE>,
    dec: TDecodeFunction<T, DC, DE>,
  ): CborType<T, EC, EE, DC, DE>;
  static from<T, EC, EE, DC, DE>(
    ty: ICborType<T, EC, EE, DC, DE>,
  ): CborType<T, EC, EE, DC, DE>;
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
