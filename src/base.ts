import { err, Result } from "resultra";
import { NotImplementedError } from "./errors";
import { Pipeable } from "./pipe";
import { ICborType, IDecoder, IEncoder, TDecodeFunction, TEncodeFunction } from "./types";

const getDefaultEncode = () => () => err(new NotImplementedError("encode"));
const getDefaultDecode = () => () => err(new NotImplementedError("decode"));

export class CborBuilder<
ET,
DT,
EE extends Error,
DE extends Error,
EC,
DC
> {
  private _encode: TEncodeFunction<ET, EE, EC>
  private _decode: TDecodeFunction<DT, DE, DC>
  private _nullable: boolean

  constructor() {
    this._encode = getDefaultEncode() as unknown as TEncodeFunction<ET, EE, EC>;
    this._decode = getDefaultDecode() as unknown as TDecodeFunction<DT, DE, DC>;
    this._nullable = false;
  }
  encode<NET, NEE extends Error>(
    fn: (v: NET, e: IEncoder) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, unknown, DC>;
  encode<NET, NEE extends Error, NEC>(
    fn: (value: NET, e: IEncoder, ctx: NEC) => Result<void, NEE>
  ): CborBuilder<NET, DT, NEE, DE, NEC, DC>;
  encode(encode: any) {
    this._encode = encode;
    return this as CborBuilder<any, DT, any, DE, any, DC>;
  }
  
  decode<NDT, NDE extends Error>(
    fn: (d: IDecoder) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, EC, unknown>;
  decode<NDT, NDE extends Error, NDC>(
    fn: (d: IDecoder, ctx: NDC) => Result<NDT, NDE>
  ): CborBuilder<ET, NDT, EE, NDE, EC, NDC>;
  decode(decode: any) {
    this._decode = decode;
    return this as CborBuilder<ET, any, EE, any, EC, any>;
  }

  nullable(value = true) {
    this._nullable = value;
    return this;
  }
  build(): CborType<ET, DT, EE, DE, EC, DC> {
    return new CborType(this._encode as (value: ET, e: IEncoder, ctx: EC) => Result<void, EE>, this._decode as  (d: IDecoder, ctx: DC) => Result<DT, DE>, this._nullable);
  }
}


export class CborType<ET, DT, EE extends Error, DE extends Error, EC, DC> extends Pipeable implements ICborType<ET, DT, EE, DE, EC, DC>{
  __inferEncodedValue: ET;
  __inferEncodingCtx: EC;
  __inferEncodingError: EE;
  encode: TEncodeFunction<ET, EE, EC>;
  __inferDecodedValue: DT;
  __inferDecodingCtx: DC;
  __inferDecodingError: DE;
  decode: TDecodeFunction<DT, DE, DC>;
  public nullable: boolean;

  constructor(
    encode: (value: ET, e: IEncoder, ctx: EC) => Result<void, EE>,
    decode: (d: IDecoder, ctx: DC) => Result<DT, DE>,
    nullable: boolean
  ) {
    super()
    this.encode = encode as TEncodeFunction<ET, EE, EC>;
    this.decode = decode as TDecodeFunction<DT, DE, DC>;
    this.nullable = nullable;
  }
  static builder(): CborBuilder<
  never,
  never,
  NotImplementedError,
  NotImplementedError,
  unknown,
  unknown
> {
    return new CborBuilder();
  }
  static from<ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<ET, DT, EE, DE, EC, DC>
  ): CborType<ET, DT, EE, DE, EC, DC> {
    return ty instanceof CborType
      ? ty
      : CborType.builder()
        .encode((v, e, c) => ty.encode(v, e, c))
        .decode((d, c) => ty.decode(d, c))
        .nullable(ty.nullable)
        .build();
  }
  convert<T>(
    toNewDecodedValue: (value: DT) => T,
    toOldEncodedValue: (value: NoInfer<T>) => ET
  ): CborType<T, T, EE, DE, EC, DC> {
    const obj = {
      encode(value, encoder, ctx) {
        return super.encode(toOldEncodedValue(value), encoder, ctx);
      },
      decode(decoder, ctx) {
        return super.decode(decoder, ctx).map(toNewDecodedValue);
      },
    };
  
    Reflect.setPrototypeOf(obj, this);
  
    return obj as CborType<T, T, EE, DE, EC, DC>
  }
}


