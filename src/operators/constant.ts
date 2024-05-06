import { CborType } from "../base";
import { ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { Result, ok } from "resultra";
import { UnexpectedValueError } from "../UnexpectedValueError";

export function constant<In, const V extends In>(
  expectedValue: V,
  isEqual: (exp: NoInfer<V>, b: NoInfer<In>) => boolean = Object.is,
): <EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<
    In,
    EE | UnexpectedValueError<In, V>,
    DE | UnexpectedValueError<In, V>,
    EC,
    DC
  >,
) => CborType<
  V,
  EE | UnexpectedValueError<In, V>,
  DE | UnexpectedValueError<In, V>,
  EC,
  DC
> {
  return <EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<
      In,
      EE | UnexpectedValueError<In, V>,
      DE | UnexpectedValueError<In, V>,
      EC,
      DC
    >,
  ) =>
    new CborType<
      V,
      EE | UnexpectedValueError<In, V>,
      DE | UnexpectedValueError<In, V>,
      EC,
      DC
    >(
      (value, e, ctx) => {
        if (!isEqual(value, expectedValue)) {
          return new UnexpectedValueError(expectedValue, value).err();
        }
        return ty[encodeSymbol](value, e, ctx);
      },
      (d, ctx): Result<V, DE | UnexpectedValueError<In, V>> => {
        const v = ty[decodeSymbol](d, ctx);
        if (!v.ok()) {
          return v;
        }
        if (!isEqual(expectedValue, v.value)) {
          return new UnexpectedValueError(expectedValue, v.value).err();
        }
        return ok(v.value as V);
      },
    );
}
