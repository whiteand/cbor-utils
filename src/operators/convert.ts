import { Result } from "resultra";
import { ICborType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";

export function convert<T, EncodedAs>(
  toEncodedValue: (value: T) => NoInfer<EncodedAs>,
  fromEncodedValue: (value: EncodedAs) => T,
): <EC, EE, DC, DE>(
  ty: ICborType<EncodedAs, EC, EE, DC, DE>,
) => CborType<T, EC, EE, DC, DE> {
  return <EC, EE, DC, DE>(
    ty: ICborType<EncodedAs, EC, EE, DC, DE>,
  ): CborType<T, EC, EE, DC, DE> =>
    new CborType(
      (value: T, e: IEncoder, ctx: EC): Result<void, EE> =>
        ty[encodeSymbol](toEncodedValue(value), e, ctx),
      (d: IDecoder, ctx: DC): Result<T, DE> =>
        ty[decodeSymbol](d, ctx).map(fromEncodedValue),
    );
}
