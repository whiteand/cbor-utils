import { ok } from "resultra";
import { CborType } from "../base";
import { DecodeError, EncodeError, EncodedType, ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { getJsType } from "../utils/getJsType";
import { TypeMismatchError } from "../TypeMismatchError";
import { success } from "../success";
import { TupleVals } from "../utils/TupleVals";

export type InferSeqType<TS extends ICborType[]> = {
  [ind in keyof TS]: EncodedType<TS[ind]>;
};
type InferSeqEE<TS extends ICborType[]> = TupleVals<{
  [ind in keyof TS]: EncodeError<TS[ind]>;
}>;
type InferSeqDE<TS extends ICborType[]> = TupleVals<{
  [ind in keyof TS]: DecodeError<TS[ind]>;
}>;
class EE1 extends Error {}
class EE2 extends Error {}
class EE3 extends Error {}
class EE4 extends Error {}
class EE5 extends Error {}
class EE6 extends Error {}
type A = InferSeqDE<[ICborType<41, EE1 | EE2, EE2> | ICborType<42 , EE3>, ICborType<43 | 44, EE4>]
export function seq<
  EC,
  DC,
  const TypesList extends readonly ICborType<any, any, any, EC, DC>[],
>(
  types: TypesList,
): CborType<
  InferSeqType<TypesList>,
  InferSeqEE<TypesList> | TypeMismatchError,
  InferSeqDE<TypesList>,
  EC,
  DC
> {
  const n = types.length;
  const typeStr = `array[${n}]`;
  return new CborType<
    InferSeqType<TypesList>,
    InferSeqEE<TypesList> | TypeMismatchError,
    InferSeqDE<TypesList>,
    EC,
    DC
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
        if (!res.ok()) return res as InferSeqEE<TypesList>;
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
      return ok(tuple as InferSeqType<TypesList>);
    },
  );
}
