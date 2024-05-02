import { Result, err, ok } from "resultra";
import { CborType } from "../base";
import { ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { getJsType } from "../utils/getJsType";
import { TypeMismatchError } from "../TypeMismatchError";
import { success } from "../success";

export type InferSeqType<TS> = TS extends readonly []
  ? []
  : TS extends readonly [infer Ty, ...infer RS]
    ? Ty extends ICborType<infer T, any, any, any, any>
      ? [T, ...InferSeqType<RS>]
      : InferSeqType<RS>
    : [];

type InferSeqEE<TS> = TS extends readonly []
  ? never
  : TS extends readonly [infer Ty, ...infer RS]
    ? Ty extends ICborType<any, any, infer T, any, any>
      ? T | InferSeqEE<RS>
      : InferSeqEE<RS>
    : never;
type InferSeqDE<TS> = TS extends readonly []
  ? never
  : TS extends readonly [infer Ty, ...infer RS]
    ? Ty extends ICborType<any, any, any, any, infer T>
      ? T | InferSeqDE<RS>
      : InferSeqDE<RS>
    : never;

export function seq<
  Types extends readonly ICborType<any, void, any, void, any>[],
>(
  types: Types,
): CborType<
  InferSeqType<Types>,
  void,
  InferSeqEE<Types> | TypeMismatchError,
  void,
  InferSeqDE<Types>
>;
export function seq<
  EC,
  DC,
  Types extends readonly ICborType<any, EC, any, DC, any>[],
>(
  types: Types,
): CborType<
  InferSeqType<Types>,
  EC,
  InferSeqEE<Types> | TypeMismatchError,
  DC,
  InferSeqDE<Types>
> {
  const n = types.length;
  const typeStr = `array[${n}]`;
  return new CborType<
    InferSeqType<Types>,
    EC,
    InferSeqEE<Types> | TypeMismatchError,
    DC,
    InferSeqDE<Types>
  >(
    (v, e, ctx) => {
      if (!v || typeof v.length != "number")
        return new TypeMismatchError(typeStr, getJsType(v)).err();
      if (v.length !== n) {
        return new TypeMismatchError(typeStr, `array[${v.length}]`).err();
      }
      for (let i = 0; i < n; i++) {
        const item = v[i];
        const itemTy = types[i];
        const res = itemTy[encodeSymbol](item, e, ctx);
        if (!res.ok()) return res as InferSeqEE<Types>;
      }
      return success;
    },
    (d, c) => {
      const tuple: unknown[] = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        const res = types[i][decodeSymbol](d, c);
        if (!res.ok()) return res;
        (tuple as any[])[i] = res.value;
      }
      return ok(tuple as InferSeqType<Types>);
    },
  );
}
