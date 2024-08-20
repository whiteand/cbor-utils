import { Result } from "resultra";
import { NotImplementedError } from "./errors";
import {
  ICborTypeCodec,
  IDecoder,
  IEncoder,
  TDecodeFunction,
  TEncodeFunction,
} from "./types";
import { Pipeable } from "../pipe";

declare class CborTypeBuilder<ET, DT, EE, DE, EC, DC> {
  encode<NET, NEE>(
    fn: (v: NET, e: IEncoder) => Result<void, NEE>
  ): CborTypeBuilder<NET, DT, NEE, DE, unknown, DC>;
  encode<NET, NEE, NEC>(
    fn: TEncodeFunction<NET, NEE, NEC>
  ): CborTypeBuilder<NET, DT, NEE, DE, NEC, DC>;
  decode<NDT, NDE>(
    fn: (d: IDecoder) => Result<NDT, NDE>
  ): CborTypeBuilder<ET, NDT, EE, NDE, EC, unknown>;
  decode<NDT, NDE, NDC>(
    fn: TDecodeFunction<NDT, NDE, NDC>
  ): CborTypeBuilder<ET, NDT, EE, NDE, EC, NDC>;
  build(): CborType<ET, DT, EE, DE, EC, DC>;
  nullable(): this;
  nullable(isNullable: boolean): this;
}

declare class CborType<ET, DT, EE, DE, EC, DC>
  extends Pipeable
  implements ICborTypeCodec<ET, DT, EE, DE, EC, DC>
{
  public nullable: boolean;
  protected constructor(
    encode: (value: ET, e: EC) => DT,
    decode: (value: DT, d: DC) => ET,
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

  static from<ET, DT, EE, DE, EC, DC>(
    ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
  ): CborType<ET, DT, EE, DE, EC, DC>;

  convert<NET, NDT>(
    toNewDecodedValue: (value: DT) => NDT,
    toOldEncodedValue: (value: NET) => ET
  ): CborType<NET, NDT, EE, DE, EC, DC>;
}
