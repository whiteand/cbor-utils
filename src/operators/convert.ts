import { Result } from "resultra";
import { ICborType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";

export function convert<T, EncodedAs>(
  toEncodedValue: (value: T) => NoInfer<EncodedAs>,
  fromEncodedValue: (value: EncodedAs) => T,
): <EE, DE>(
  ty: ICborType<EncodedAs, void, EE, void, DE>,
) => CborType<T, void, EE, void, DE>;
export function convert<T, EncodedAs>(
  toEncodedValue: (value: T) => NoInfer<EncodedAs>,
  fromEncodedValue: (value: EncodedAs) => T,
): <EC, EE, DC, DE>(
  ty: ICborType<EncodedAs, EC, EE, DC, DE>,
) => CborType<T, EC, EE, DC, DE>;
export function convert<T, EncodedAs>(
  toEncodedValue: (value: T) => NoInfer<EncodedAs>,
  fromEncodedValue: (value: EncodedAs) => T,
): <EE, DE>(
  ty: ICborType<EncodedAs, any, EE, any, DE>,
) => CborType<T, any, EE, any, DE> {
  return <EE, DE>(
    ty: ICborType<EncodedAs, any, EE, any, DE>,
  ): CborType<T, any, EE, any, DE> =>
    new CborType(
      (value: T, e: IEncoder, ctx: any): Result<void, EE> =>
        ty[encodeSymbol](toEncodedValue(value), e, ctx),
      (d: IDecoder, ctx: any): Result<T, DE> =>
        ty[decodeSymbol](d, ctx).map(fromEncodedValue),
    );
}
