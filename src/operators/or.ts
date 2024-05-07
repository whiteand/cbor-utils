import { Result, err } from "resultra";
import { CborType } from "../base";
import { DecodeError, EncodeError, EncodedType, ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ResultError } from "../ResultError";
import { TupleVals } from "../utils/TupleVals";

type InferOrType<TS extends readonly ICborType[]> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;

type OrEncodeErrors<TS extends readonly ICborType[]> = {
  [ind in keyof TS]: EncodeError<TS[ind]>;
};
type OrDecodeErrors<TS extends readonly ICborType[]> = {
  [ind in keyof TS]: DecodeError<TS[ind]>;
};

class OrError<Errs extends readonly Error[]> extends ResultError {
  constructor(public readonly errors: Errs) {
    super(
      `failed or error: ${errors.map((e) => `"${e.message}"`).join(" & ")}`,
    );
  }
}

export function or<
  EC,
  DC,
  Types extends readonly ICborType<any, any, any, EC, DC>[],
>(
  ...types: Types
): CborType<
  InferOrType<Types>,
  OrError<OrEncodeErrors<Types>>,
  OrError<OrDecodeErrors<Types>>,
  EC,
  DC
> {
  return new CborType<
    InferOrType<Types>,
    OrError<OrEncodeErrors<Types>>,
    OrError<OrDecodeErrors<Types>>,
    EC,
    DC
  >(
    (v, e, ctx) => {
      const p = e.save();
      const errors: unknown[] = [];
      for (const ty of types) {
        const res = ty[encodeSymbol](v, e, ctx);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          e.restore(p);
        }
      }
      return err(new OrError(errors as OrEncodeErrors<Types>));
    },
    (d, c): Result<InferOrType<Types>, OrError<OrDecodeErrors<Types>>> => {
      const p = d.ptr;
      const errors: unknown[] = [];
      for (const ty of types) {
        const res = ty[decodeSymbol](d, c);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          d.ptr = p;
        }
      }
      return err(new OrError(errors as OrDecodeErrors<Types>));
    },
  );
}
