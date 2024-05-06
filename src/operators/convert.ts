import { Result } from "resultra";
import { ICborType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";

export function convert<T, EncodedAs>(
  toEncodedValue: (value: T) => NoInfer<EncodedAs>,
  fromEncodedValue: (value: EncodedAs) => T,
): <EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<EncodedAs, EE, DE, EC, DC>,
) => CborType<T, EE, DE, EC, DC> {
  return <EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<EncodedAs, EE, DE, EC, DC>,
  ): CborType<T, EE, DE, EC, DC> =>
    new CborType(
      (value: T, e: IEncoder, ctx: any): Result<void, EE> =>
        ty[encodeSymbol](toEncodedValue(value), e, ctx),
      (d: IDecoder, ctx: any): Result<T, DE> =>
        ty[decodeSymbol](d, ctx).map(fromEncodedValue),
    );
}
