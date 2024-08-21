import { Result, err } from "resultra";
import { CborType } from "../base";
import {
  DecodeError,
  EncodeError,
  EncodedType,
  ICborTypeCodec,
} from "../types";
import { BaseError } from "../BaseError";
import { TupleVals } from "../utils/TupleVals";

type InferEncodedOrType<TS extends readonly ICborTypeCodec[]> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;
type InferDecodedOrType<TS extends readonly ICborTypeCodec[]> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;

type OrEncodeErrors<TS extends readonly ICborTypeCodec[]> = {
  [ind in keyof TS]: EncodeError<TS[ind]>;
};
type OrDecodeErrors<TS extends readonly ICborTypeCodec[]> = {
  [ind in keyof TS]: DecodeError<TS[ind]>;
};

class OrError<Errs extends readonly Error[]> extends BaseError {
  constructor(public readonly errors: Errs) {
    super(
      `failed or error: ${errors.map((e) => `"${e.message}"`).join(" & ")}`
    );
  }
}

export function or<
  EC,
  DC,
  Types extends readonly ICborTypeCodec<any, any, any, any, EC, DC>[]
>(
  ...types: Types
): CborType<
  InferEncodedOrType<Types>,
  InferDecodedOrType<Types>,
  OrError<OrEncodeErrors<Types>>,
  OrError<OrDecodeErrors<Types>>,
  EC,
  DC
> {
  const proto = CborType.builder()
    .encode((v, e, ctx) => {
      const p = e.save();
      const errors: unknown[] = [];
      for (const ty of types) {
        const res = ty.encode(v, e, ctx);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          e.restore(p);
        }
      }
      return err(new OrError(errors as OrEncodeErrors<Types>));
    })
    .decode(
      (
        d,
        c
      ): Result<InferEncodedOrType<Types>, OrError<OrDecodeErrors<Types>>> => {
        const p = d.ptr;
        const errors: unknown[] = [];
        for (const ty of types) {
          const res = ty.decode(d, c);
          if (res.ok()) {
            return res;
          } else {
            errors.push(res.error);
            d.ptr = p;
          }
        }
        return err(new OrError(errors as OrDecodeErrors<Types>));
      }
    )
    .nullable(types.some((t) => t.nullable))
    .build();

  return proto;
}
