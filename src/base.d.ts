import { Result } from "resultra";
import { NotImplementedError } from "./errors";
import {
  ICborType,
  IDecodable,
  IDecoder,
  IEncodable,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";
import { Pipeable } from "./pipe";

declare class CborTypeBuilder<
  ET,
  DT,
  EE extends Error,
  DE extends Error,
  EC,
  DC
> {
  encode<NET, NEE extends Error>(
    fn: (v: NET, e: IEncoder) => Result<void, NEE>
  ): CborTypeBuilder<NET, DT, NEE, DE, unknown, DC>;
  encode<NET, NEE extends Error, NEC>(
    fn: (value: NET, e: IEncoder, ctx: NEC) => Result<void, NEE>
  ): CborTypeBuilder<NET, DT, NEE, DE, NEC, DC>;
  decode<NDT, NDE extends Error>(
    fn: (d: IDecoder) => Result<NDT, NDE>
  ): CborTypeBuilder<ET, NDT, EE, NDE, EC, unknown>;
  decode<NDT, NDE extends Error, NDC>(
    fn: (d: IDecoder, ctx: NDC) => Result<NDT, NDE>
  ): CborTypeBuilder<ET, NDT, EE, NDE, EC, NDC>;
  build(): CborType<ET, DT, EE, DE, EC, DC>;
  nullable(): this;
  nullable(isNullable: boolean): this;
}

declare class CborType<ET, DT, EE extends Error, DE extends Error, EC, DC>
  extends Pipeable
  implements ICborType<ET, DT, EE, DE, EC, DC>
{
  public nullable: boolean;
  protected constructor(
    encode: (value: ET, e: IEncoder, ctx: EC) => Result<void, EE>,
    decode: (d: IDecoder, ctx: DC) => Result<DT, DE>,
    nullable: boolean
  );

  __inferEncodedValue: ET;
  __inferEncodingCtx: EC;
  __inferEncodingError: EE;
  encode: TEncodeFunction<ET, EE, EC>;
  __inferDecodedValue: DT;
  __inferDecodingCtx: DC;
  __inferDecodingError: DE;
  decode: TDecodeFunction<DT, DE, DC>;

  static builder(): CborTypeBuilder<
    never,
    never,
    NotImplementedError,
    NotImplementedError,
    unknown,
    unknown
  >;

  static from<ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<ET, DT, EE, DE, EC, DC>
  ): CborType<ET, DT, EE, DE, EC, DC>;

  convert<T>(
    toNewDecodedValue: (value: DT) => T,
    toOldEncodedValue: (value: NoInfer<T>) => ET
  ): CborType<T, T, EE, DE, EC, DC>;
}
