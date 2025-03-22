import { ok, Result } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { BREAK_BYTE } from "../constants";
import { getVoidOk } from "../getVoidOk";
import { getJsType } from "../utils/getJsType";
import { mapLen } from "./mapLen";
import {
  AndContextArgs,
  AnyContextArgs,
  ICborType,
  IDecoder,
  IEncoder,
  Z,
} from "../types";
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
  KECArgs extends AnyContextArgs,
  KDCArgs extends AnyContextArgs,
  VECArgs extends AnyContextArgs,
  VDCArgs extends AnyContextArgs
>(
  kt: ICborType<EK, DK, KEE, KDE, KECArgs, KDCArgs>,
  vt: ICborType<EV, DV, VEE, VDE, VECArgs, VDCArgs>
): CborType<
  Map<EK, EV>,
  Map<DK, DV>,
  KEE | VEE | OverflowError,
  KDE | VDE | InvalidCborError | EndOfInputError,
  AndContextArgs<KECArgs, VECArgs>,
  AndContextArgs<KDCArgs, VDCArgs>
> {
  interface IMapTy {
    kt: ICborType<EK, DK, KEE, KDE, KECArgs, KDCArgs>;
    vt: ICborType<EV, DV, VEE, VDE, VECArgs, VDCArgs>;
    decodeUnknownLengthMap(
      d: IDecoder,
      ctx: KDCArgs & VDCArgs
    ): Result<Map<DK, DV>, KDE | VDE | InvalidCborError | EndOfInputError>;
    decodeKnownLengthMap(
      d: IDecoder,
      ctx: KDCArgs & VDCArgs,
      len: number
    ): Result<Map<DK, DV>, KDE | VDE | InvalidCborError | EndOfInputError>;
  }

  const proto = CborType.builder()
    .encode(function encode(
      this: IMapTy,
      m: Map<EK, EV>,
      e: IEncoder,
      c: KECArgs & VECArgs
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
        const kr = (kt.encode as Z)(k, e, c);
        if (!kr.ok()) return kr;
        const vr = (vt.encode as Z)(v, e, c);
        if (!vr.ok()) return vr;
      }
      return getVoidOk();
    })
    .decode(function decode(
      this: IMapTy,
      d: IDecoder,
      c: KDCArgs & VDCArgs
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
    decodeUnknownLengthMap(d: IDecoder, c: KDCArgs & VDCArgs) {
      const { kt, vt } = this;
      const res = new Map();
      while (d.ptr < d.buf.length) {
        const m = d.buf[d.ptr];
        if (m === BREAK_BYTE) {
          d.ptr++;
          break;
        }
        const kr = (kt.decode as Z)(d, c);
        if (!kr.ok()) return kr;
        const k = kr.value;

        const vr = (vt.decode as Z)(d, c);
        if (!vr.ok()) return vr;
        const v = vr.value;

        res.set(k, v);
      }
      return ok(res);
    },
    decodeKnownLengthMap(d: IDecoder, c: KDCArgs & VDCArgs, n: number) {
      const { kt, vt } = this;
      const res = new Map();
      for (let i = 0; i < n; i++) {
        const kr = (kt.decode as Z)(d, c);
        if (!kr.ok()) return kr;
        const k = kr.value;

        const vr = (vt.decode as Z)(d, c);
        if (!vr.ok()) return vr;
        const v = vr.value;

        res.set(k, v);
      }

      return ok(res);
    },
  });

  return mapType;
}
