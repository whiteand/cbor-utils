import { CborType } from "../base";
import { ICborType } from "../types";

export function convert<T, EncodedAs>(
  toEncodedValue: (value: T) => NoInfer<EncodedAs>,
  fromEncodedValue: (value: EncodedAs) => T
): <EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<EncodedAs, EE, DE, EC, DC>
) => CborType<T, EE, DE, EC, DC> {
  return <EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<EncodedAs, EE, DE, EC, DC>
  ): CborType<T, EE, DE, EC, DC> =>
    CborType.from(ty).convert(fromEncodedValue, toEncodedValue);
}
