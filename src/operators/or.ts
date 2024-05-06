import { Result, err } from "resultra";
import { CborType } from "../base";
import { ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ResultError } from "../ResultError";

type InferOrType<TS> = TS extends []
  ? never
  : TS extends [infer Ty, ...infer RS]
    ? Ty extends ICborType<infer T, any, any, any, any>
      ? T | InferOrType<RS>
      : InferOrType<RS>
    : never;

class OrError<Errs extends Error> extends ResultError {
  constructor(public readonly errors: Errs[]) {
    super(
      `failed or error: ${errors.map((e) => `"${e.message}"`).join(" & ")}`,
    );
  }
}

export function or<
  EE extends Error,
  DE extends Error,
  EC,
  DC,
  Types extends ICborType<any, EE, DE, EC, DC>[],
>(
  ...types: Types
): CborType<InferOrType<Types>, OrError<EE>, OrError<DE>, EC, DC> {
  return new CborType<InferOrType<Types>, OrError<EE>, OrError<DE>, EC, DC>(
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
      return err(new OrError(errors));
    },
    (d, c): Result<InferOrType<Types>, OrError<DE>> => {
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
      return err(new OrError(errors));
    },
  );
}
