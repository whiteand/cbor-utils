import { Result, err, ok } from "resultra";
import { CborType } from "../base";
import { ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { getJsType } from "../utils/getJsType";
import { TypeMismatchError } from "../TypeMismatchError";
import { success } from "../success";

type InferSeqType<TS> = TS extends []
  ? []
  : TS extends [infer Ty, ...infer RS]
    ? Ty extends ICborType<infer T, any, any, any, any>
      ? [T, ...InferSeqType<RS>]
      : InferSeqType<RS>
    : [];

export function seq<EE, DE, Types extends ICborType<any, void, EE, void, DE>[]>(
  ...types: Types
): CborType<InferSeqType<Types>, void, EE | TypeMismatchError, void, DE>;
export function seq<
  EC,
  EE,
  DC,
  DE,
  Types extends ICborType<any, EC, EE, DC, DE>[],
>(
  ...types: Types
): CborType<InferSeqType<Types>, EC, EE | TypeMismatchError, DC, DE> {
  const n = types.length;
  const typeStr = `array[${n}]`;
  return new CborType<InferSeqType<Types>, EC, EE | TypeMismatchError, DC, DE>(
    (v, e, ctx): Result<void, EE | TypeMismatchError> => {
      if (!v || typeof v.length != "number")
        return new TypeMismatchError(typeStr, getJsType(v)).err();
      if (v.length !== n) {
        return new TypeMismatchError(typeStr, `array[${v.length}]`).err();
      }
      for (let i = 0; i < n; i++) {
        const item = v[i];
        const itemTy = types[i];
        const res = itemTy[encodeSymbol](item, e, ctx);
        if (!res.ok()) return res;
      }
      return success;
    },
    (d, c): Result<InferSeqType<Types>, DE> => {
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
