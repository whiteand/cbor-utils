import { NotImplementedError } from "./errors";
import { ICborTypeCodec, TDecodeFunction, TEncodeFunction } from "./types";

declare class CborTypeBuilder<ET, DT, EE, DE, EC, DC> {
  encode<NET, NEE>(
    fn: TEncodeFunction<NET, NEE, void>
  ): CborTypeBuilder<NET, DT, NEE, DE, void, DC>;
  encode<NET, NEE, NEC>(
    fn: TEncodeFunction<NET, NEE, NEC>
  ): CborTypeBuilder<NET, DT, NEE, DE, NEC, DC>;
  decode<NDT, NDE>(
    fn: TDecodeFunction<NDT, NDE, void>
  ): CborTypeBuilder<ET, NDT, EE, NDE, EC, void>;
  decode<NDT, NDE, NDC>(
    fn: TDecodeFunction<NDT, NDE, NDC>
  ): CborTypeBuilder<ET, NDT, EE, NDE, EC, NDC>;
  build(): CborType<ET, DT, EE, DE, EC, DC>;
}

declare class CborType<ET, DT, EE, DE, EC, DC>
  implements ICborTypeCodec<ET, DT, EE, DE, EC, DC>
{
  protected constructor(
    encode: (value: ET, e: EC) => DT,
    decode: (value: DT, d: DC) => ET
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
    void,
    void
  >;
}
