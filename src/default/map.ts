import { ok, Result } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { BREAK_BYTE } from "../constants";
import { getVoidOk } from "../getVoidOk";
import { getJsType } from "../utils/getJsType";
import { mapLen } from "./mapLen";
import { ICborType, IDecoder, IEncoder } from "../types";
import { OverflowError } from "../OverflowError";
import { InvalidCborError } from "../InvalidCborError";
import { EndOfInputError } from "../EndOfInputError";

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
  kt: ICborType<EK, DK, KEE, KDE, KEC, KDC>,
  vt: ICborType<EV, DV, VEE, VDE, VEC, VDC>
): CborType<
  Map<EK, EV>,
  Map<DK, DV>,
  KEE | VEE | OverflowError,
  KDE | VDE | InvalidCborError | EndOfInputError,
  KEC & VEC,
  KDC & VDC
> {
  interface IMapTy {
    kt: ICborType<EK, DK, KEE, KDE, KEC, KDC>;
    vt: ICborType<EV, DV, VEE, VDE, VEC, VDC>;
    decodeUnknownLengthMap(
      d: IDecoder,
      ctx: KDC & VDC
    ): Result<Map<DK, DV>, KDE | VDE | InvalidCborError | EndOfInputError>;
    decodeKnownLengthMap(
      d: IDecoder,
      ctx: KDC & VDC,
      len: number
    ): Result<Map<DK, DV>, KDE | VDE | InvalidCborError | EndOfInputError>;
  }

  const proto = CborType.builder()
    .encode(function encode(
      this: IMapTy,
      m: Map<EK, EV>,
      e: IEncoder,
      c: KEC & VEC
    ): Result<void, KEE | VEE | OverflowError> {
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
    .decode(function decode(
      this: IMapTy,
      d: IDecoder,
      c: KDC & VDC
    ): Result<Map<DK, DV>, KDE | VDE | InvalidCborError | EndOfInputError> {
      return mapLen
        .decode(d)
        .andThen((len: number | bigint | null) =>
          len == null
            ? this.decodeUnknownLengthMap(d, c)
            : this.decodeKnownLengthMap(d, c, Number(len))
        );
    })
    .build();

  const mapType = Object.create(proto);

  Object.assign(mapType, {
    kt,
    vt,
    decodeUnknownLengthMap(d: IDecoder, c: KDC & VDC) {
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
    decodeKnownLengthMap(d: IDecoder, c: KDC & VDC, n: number) {
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
  });

  return mapType;
}
