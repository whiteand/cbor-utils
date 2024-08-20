import { ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { BREAK_BYTE } from "../constants";
import { getVoidOk } from "../getVoidOk";
import { getJsType } from "../utils/getJsType";
import { mapLen } from "./mapLen";

/**
 * A function that can produce a `Map` type based on the key and value types.
 *
 * @param kt type of keys in the map
 * @param vt type of values in the map
 * @returns as CBOR type that encodes and decodes `Map<K, V>`
 */
export function map(kt, vt) {
  const mapType = {
    kt,
    vt,
    decodeUnknownLengthMap(d, c) {
      const { kt, vt } = this;
      const res = new Map();
      while (d.ptr < d.buf.length) {
        const m = d.buf[d.ptr];
        if (m === BREAK_BYTE) {
          d.ptr++;
          break;
        }
        const kr = kt.decode(d, c);
        if (!kr.ok()) return kr;
        const k = kr.value;

        const vr = vt.decode(d, c);
        if (!vr.ok()) return vr;
        const v = vr.value;

        res.set(k, v);
      }
      return ok(res);
    },
    decodeKnownLengthMap(d, c, n) {
      const { kt, vt } = this;
      const res = new Map();
      for (let i = 0; i < n; i++) {
        const kr = kt.decode(d, c);
        if (!kr.ok()) return kr;
        const k = kr.value;

        const vr = vt.decode(d, c);
        if (!vr.ok()) return vr;
        const v = vr.value;

        res.set(k, v);
      }

      return ok(res);
    },
  };

  const proto = CborType.builder()
    .encode(function encode(m, e, c) {
      const { kt, vt } = this;
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
        const kr = kt.encode(k, e, c);
        if (!kr.ok()) return kr;
        const vr = vt.encode(v, e, c);
        if (!vr.ok()) return vr;
      }
      return getVoidOk();
    })
    .decode(function decode(d, c) {
      return mapLen
        .decode(d)
        .andThen((len) =>
          len == null
            ? this.decodeUnknownLengthMap(d, c)
            : this.decodeKnownLengthMap(d, c, Number(len))
        );
    })
    .build();

  Reflect.setPrototypeOf(mapType, proto);

  return mapType;
}
