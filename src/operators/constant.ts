import { CborType } from "../base";
import { ICborType } from "../types";
import { ResultError } from "../ResultError";
import { decodeSymbol, encodeSymbol } from "../traits";
import { Result, ok } from "resultra";

export class UnexpectedValue<In, V> extends ResultError {
  constructor(public readonly expected: V, public readonly actual: In) {
    super(`Expected ${expected}, but got ${actual}`);
  }
}

export function constant<In, const V extends In>(
  expectedValue: V,
  isEqual: (exp: NoInfer<V>, b: NoInfer<In>) => boolean = Object.is
): <EC, EE, DC, DE>(
  ty: ICborType<
    In,
    EC,
    EE | UnexpectedValue<In, V>,
    DC,
    DE | UnexpectedValue<In, V>
  >
) => CborType<
  V,
  EC,
  EE | UnexpectedValue<In, V>,
  DC,
  DE | UnexpectedValue<In, V>
> {
  return <EC, EE, DC, DE>(
    ty: ICborType<
      In,
      EC,
      EE | UnexpectedValue<In, V>,
      DC,
      DE | UnexpectedValue<In, V>
    >
  ) =>
    new CborType<
      V,
      EC,
      EE | UnexpectedValue<In, V>,
      DC,
      DE | UnexpectedValue<In, V>
    >(
      (value, e, ctx) => {
        if (!isEqual(value, expectedValue)) {
          return new UnexpectedValue(expectedValue, value).err();
        }
        return ty[encodeSymbol](value, e, ctx);
      },
      (d, ctx): Result<V, DE | UnexpectedValue<In, V>> => {
        const v = ty[decodeSymbol](d, ctx);
        if (!v.ok()) {
          return v;
        }
        if (!isEqual(expectedValue, v.value)) {
          return new UnexpectedValue(expectedValue, v.value).err();
        }
        return ok(v.value as V);
      }
    );
}
