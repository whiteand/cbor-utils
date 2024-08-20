import { Result, ok } from "resultra";
import { EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { getVoidOk } from "../getVoidOk";
import { ICborTypeCodec, IDecodable, IDecoder } from "../types";
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
  EK,
  EV,
  DK,
  DV,
  KEE extends Error,
  KDE extends Error,
  VEE extends Error,
  VDE extends Error,
  KEC,
  KDC,
  VEC,
  VDC
>(
  kt: ICborTypeCodec<EK, DK, KEE, KDE, KEC, KDC>,
  vt: ICborTypeCodec<EV, DV, VEE, VDE, VEC, VDC>
): CborType<
  Map<EK, EV>,
  Map<DK, DV>,
  KEE | VEE | OverflowError,
  KDE | VDE | InvalidCborError | EndOfInputError,
  KEC & VEC,
  KDC & VDC
> {
  return CborType.builder()
    .encode((m, e, c): Result<void, KEE | VEE | OverflowError> => {
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
    .decode(
      (
        d,
        c
      ): Result<
        Map<DK, DV>,
        KDE | VDE | InvalidCborError | EndOfInputError | TypeMismatchError
      > => {
        return mapLen
          .decode(d)
          .andThen(
            (
              len
            ): Result<
              Map<DK, DV>,
              KDE | VDE | InvalidCborError | EndOfInputError | TypeMismatchError
            > =>
              len == null
                ? decodeUnknownLengthMap(d, kt, vt, c)
                : decodeKnownLengthMap(d, kt, vt, c, Number(len))
          );
      }
    )
    .build();
}

function decodeKnownLengthMap<K, KDE, KDC, V, VDE, VDC>(
  d: IDecoder,
  kt: IDecodable<K, KDE, KDC>,
  vt: IDecodable<V, VDE, VDC>,
  c: KDC & VDC,
  n: number
) {
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
}

function decodeUnknownLengthMap<K, KDE, KDC, V, VDE, VDC>(
  d: IDecoder,
  kt: IDecodable<K, KDE, KDC>,
  vt: IDecodable<V, VDE, VDC>,
  c: KDC & VDC
) {
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
}
