import { Result, ok } from "resultra";
import { EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { success } from "../success";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType } from "../types";
import { getJsType } from "../utils/getJsType";
import { mapLen } from "./mapLen";
import { BREAK_BYTE } from "../constants";

/**
 * A function that can produce a `Map` type based on the key and value types.
 *
 * @param kt type of keys in the map
 * @param vt type of values in the map
 * @returns as CBOR type that encodes and decodes `Map<K, V>`
 */
export function map<
  K,
  V,
  KEE extends Error,
  KDE extends Error,
  VEE extends Error,
  VDE extends Error,
  KEC,
  KDC,
  VEC,
  VDC
>(
  kt: ICborType<K, KEE, KDE, KEC, KDC>,
  vt: ICborType<V, VEE, VDE, VEC, VDC>
): CborType<
  Map<K, V>,
  KEE | VEE | OverflowError,
  KDE | VDE | InvalidCborError | EndOfInputError,
  KEC & VEC,
  KDC & VDC
> {
  return new CborType<
    Map<K, V>,
    KEE | VEE | OverflowError | TypeMismatchError,
    KDE | VDE | InvalidCborError | EndOfInputError,
    KEC & VEC,
    KDC & VDC
  >(
    (m, e, c): Result<void, KEE | VEE | OverflowError> => {
      if (!m || !(m instanceof Map)) {
        return new TypeMismatchError("Map", getJsType(m)).err();
      }
      const entries = [...m.entries()];
      const res = mapLen.encode(entries.length, e);
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
      return success;
    },
    (
      d,
      c
    ): Result<
      Map<K, V>,
      KDE | VDE | InvalidCborError | EndOfInputError | TypeMismatchError
    > => {
      const lenRes = mapLen.decode(d);
      if (!lenRes.ok()) {
        return lenRes;
      }
      const len = lenRes.value;
      const res = new Map();
      if (len == null) {
        while (d.ptr < d.buf.length) {
          const m = d.buf[d.ptr];
          if (m === BREAK_BYTE) {
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
