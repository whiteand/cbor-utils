import { Result, ok } from "resultra";
import { CborType } from "../base";
import { MAP_TYPE } from "../constants";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType } from "../types";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { OverflowError } from "../OverflowError";
import { okNull } from "../okNull";
import { getType } from "../marker";
import { TypeMismatchError } from "../TypeMismatchError";
import { getTypeString } from "../getTypeString";
import { readArg } from "../readArg";
import { InvalidCborError } from "../InvalidCborError";
import { EndOfInputError } from "../EndOfInputError";

export function map<K, V, KEC, KEE, KDC, KDE, VEC, VEE, VDC, VDE>(
  kt: ICborType<K, KEC, KEE, KDC, KDE>,
  vt: ICborType<V, VEC, VEE, VDC, VDE>
): CborType<
  Map<K, V>,
  KEC & VEC,
  KEE | VEE | OverflowError,
  KDC & VDC,
  KDE | VDE | InvalidCborError | EndOfInputError
> {
  return new CborType<
    Map<K, V>,
    KEC & VEC,
    KEE | VEE | OverflowError,
    KDC & VDC,
    KDE | VDE | InvalidCborError | EndOfInputError
  >(
    (m, e, c): Result<null, KEE | VEE | OverflowError> => {
      const entries = [...m.entries()];
      const res = writeTypeAndArg(e, MAP_TYPE, entries.length);
      if (!res.ok()) {
        return res;
      }
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const k = entry[0];
        const v = entry[1];
        const kr = kt[encodeSymbol](k, e, c);
        if (!kr.ok()) return kr;
        const vr = vt[encodeSymbol](v, e, c);
        if (!vr.ok()) return vr;
      }
      return okNull;
    },
    (
      d,
      c
    ): Result<
      Map<K, V>,
      KDE | VDE | InvalidCborError | EndOfInputError | TypeMismatchError
    > => {
      const m = d.buf[d.ptr];
      if (getType(m) !== MAP_TYPE) {
        return new TypeMismatchError("map", getTypeString(m)).err();
      }
      const lenRes = readArg(d);
      if (!lenRes.ok()) {
        return lenRes;
      }
      const len = lenRes.value;
      const res = new Map();
      if (len == null) {
        while (d.ptr < d.buf.length) {
          const m = d.buf[d.ptr];
          if (m === 0xff) {
            d.ptr++;
            break;
          }
          const kr = kt[decodeSymbol](d, c);
          if (!kr.ok()) return kr;
          const k = kr.value;

          const vr = vt[decodeSymbol](d, c);
          if (!vr.ok()) return vr;
          const v = vr.value;

          res.set(k, v);
        }
        return ok(res);
      }

      const n = Number(len);
      for (let i = 0; i < n; i++) {
        const kr = kt[decodeSymbol](d, c);
        if (!kr.ok()) return kr;
        const k = kr.value;

        const vr = vt[decodeSymbol](d, c);
        if (!vr.ok()) return vr;
        const v = vr.value;

        res.set(k, v);
      }

      return ok(res);
    }
  );
}
