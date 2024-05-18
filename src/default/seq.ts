import { ok } from "resultra";
import { CborType } from "../base";
import { DecodeError, EncodeError, EncodedType, ICborType } from "../types";
import { decodeSymbol, encodeSymbol } from "../traits";
import { getJsType } from "../utils/getJsType";
import { TypeMismatchError } from "../TypeMismatchError";
import { success } from "../success";
import { TupleVals } from "../utils/TupleVals";

export type InferSeqType<TS extends readonly ICborType[]> = {
  -readonly [ind in keyof TS]: EncodedType<TS[ind]>;
};

type InferSeqEE<TS extends readonly ICborType[]> = TupleVals<{
  -readonly [ind in keyof TS]: EncodeError<TS[ind]>;
}>;
type InferSeqDE<TS extends readonly ICborType[]> = TupleVals<{
  -readonly [ind in keyof TS]: DecodeError<TS[ind]>;
}>;

/**
 * A CBOR type that encodes and decodes data item streams.
 *
 * Example:
 *
 * ```ts
 * import { seq, encode }
 *
 * const u8AfterU8 = seq([u8, u8])
 *
 * const bytes = encode(e => u8AfterU8.encode([1, 2], e))
 * console.log(bytes) // new Uint8Array([0x01, 0x02])
 * ```
 *
 * Warning:
 * The `seq` produces Data Streams, not Data Items. Read terminology section in the [SPECIFICATION](https://www.rfc-editor.org/rfc/rfc8949#name-terminology)
 *
 */
export function seq<
  EC,
  DC,
  const TypesList extends readonly ICborType<any, any, any, EC, DC>[]
>(
  types: TypesList
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
      const tuple: unknown[] = [];
      for (let i = 0; i < n; i++) {
        const res = types[i][decodeSymbol](d, c);
        if (!res.ok()) return res;
        tuple.push(res.value);
      }
      return ok(tuple as InferSeqType<TypesList>);
    }
  );
}
