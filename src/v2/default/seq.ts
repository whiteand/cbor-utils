import { ok } from "resultra";
import { CborType } from "../base";
import {
  DecodeError,
  EncodeError,
  EncodedType,
  ICborTypeCodec,
} from "../types";
import { getJsType } from "../utils/getJsType";
import { TypeMismatchError } from "../TypeMismatchError";
import { getVoidOk } from "../getVoidOk";
import { TupleVals } from "../utils/TupleVals";

export type InferEncodedSeqType<TS extends readonly ICborTypeCodec[]> = {
  -readonly [ind in keyof TS]: EncodedType<TS[ind]>;
};
export type InferDecodedSeqType<TS extends readonly ICborTypeCodec[]> = {
  -readonly [ind in keyof TS]: EncodedType<TS[ind]>;
};

type InferSeqEE<TS extends readonly ICborTypeCodec[]> = TupleVals<{
  -readonly [ind in keyof TS]: EncodeError<TS[ind]>;
}>;
type InferSeqDE<TS extends readonly ICborTypeCodec[]> = TupleVals<{
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
  const TypesList extends readonly ICborTypeCodec<any, any, any, any, EC, DC>[]
>(
  types: TypesList
): CborType<
  InferEncodedSeqType<TypesList>,
  InferDecodedSeqType<TypesList>,
  InferSeqEE<TypesList> | TypeMismatchError,
  InferSeqDE<TypesList>,
  EC,
  DC
> {
  const n = types.length;
  const typeStr = `array[${n}]`;
  return CborType.builder()
    .encode((v, e, ctx) => {
      if (!v || typeof v.length != "number")
        return new TypeMismatchError(typeStr, getJsType(v)).err();
      if (v.length !== n) {
        return new TypeMismatchError(typeStr, `array[${v.length}]`).err();
      }
      for (let i = 0; i < n; i++) {
        const item = v[i];
        const itemTy = types[i];
        const res = itemTy.encode(item, e, ctx);
        if (!res.ok()) return res as InferSeqEE<TypesList>;
      }
      return getVoidOk();
    })
    .decode((d, c) => {
      const tuple: unknown[] = [];
      for (let i = 0; i < n; i++) {
        const res = types[i].decode(d, c);
        if (!res.ok()) return res;
        tuple.push(res.value);
      }
      return ok(tuple as InferEncodedSeqType<TypesList>);
    })
    .build();
}
