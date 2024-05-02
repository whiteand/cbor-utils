import { Result, err } from "resultra";
import { CborType } from "../base";
import { ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";

type InferOrType<TS> = TS extends []
  ? never
  : TS extends [infer Ty, ...infer RS]
    ? Ty extends ICborType<infer T, any, any, any, any>
      ? T | InferOrType<RS>
      : InferOrType<RS>
    : never;

export function or<
  EC,
  EE,
  DC,
  DE,
  Types extends ICborType<any, void, EE, void, DE>[],
>(...types: Types): CborType<InferOrType<Types>, void, EE[], void, DE[]>;
export function or<
  EC,
  EE,
  DC,
  DE,
  Types extends ICborType<any, EC, EE, DC, DE>[],
>(...types: Types): CborType<InferOrType<Types>, EC, EE[], DC, DE[]> {
  return new CborType<InferOrType<Types>, EC, EE[], DC, DE[]>(
    (v, e, ctx) => {
      const p = e.save();
      const errors: EE[] = [];
      for (const ty of types) {
        const res = ty[encodeSymbol](v, e, ctx);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          e.restore(p);
        }
      }
      return err(errors);
    },
    (d, c): Result<InferOrType<Types>, DE[]> => {
      const p = d.ptr;
      const errors: DE[] = [];
      for (const ty of types) {
        const res = ty[decodeSymbol](d, c);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          d.ptr = p;
        }
      }
      return err(errors);
    },
  );
}
