import { ok, Result } from "resultra";
import { CborType } from "../base";
import { BREAK_BYTE } from "../constants";
import { arrayLen } from "../default/arrayLen";
import { getVoidOk } from "../getVoidOk";
import {
  ICborType,
  IDecodable,
  IDecoder,
  IEncoder,
  NotImportant,
} from "../types";
import { OverflowError } from "../OverflowError";
import { DecodingError } from "../DecodingError";

/**
 * Example:
 *
 * ```ts
 * import { array, u8 } from '@whiteand/cbor'
 *
 * // u8Array is a CBOR type that encodes u8[]
 * const u8Array = u8.pipe(array())
 * ```
 *
 * @returns An operator that creates an array type from a element type
 */
export function array(): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  readonly ET[],
  DT[],
  EE | OverflowError,
  DE | DecodingError,
  EC,
  DC
> {
  return <ET, DT, EE extends Error, DE extends Error, EC, DC>(
    itemTy: ICborType<ET, DT, EE, DE, EC, DC>
  ): CborType<
    readonly ET[],
    DT[],
    EE | OverflowError,
    DE | DecodingError,
    EC,
    DC
  > => {
    function decodeArrayIndefinite<T, DE, DC>(
      ty: IDecodable<T, DE, DC>,
      d: IDecoder,
      ctx: DC
    ) {
      const res = [] as T[];
      while (d.ptr < d.buf.length) {
        const m = d.buf[d.ptr];
        if (m === BREAK_BYTE) {
          d.ptr++;
          break;
        }
        const item = ty.decode(d, ctx);
        if (!item.ok()) return item;
        res.push(item.value);
      }
      return ok(res);
    }
    function decodeArrayU32<T, DE, DC>(
      ty: IDecodable<T, DE, DC>,
      len: number,
      d: IDecoder,
      ctx: DC
    ) {
      const res = [] as T[];
      for (let i = 0; i < len; i++) {
        const item = ty.decode(d, ctx);
        if (!item.ok()) return item;
        res.push(item.value);
      }
      return ok(res);
    }

    function decodeArrayU64<T, DE, DC>(
      ty: IDecodable<T, DE, DC>,
      len: bigint,
      d: IDecoder,
      ctx: DC
    ) {
      const res = [] as T[];
      for (let i = 0n; i < len; i++) {
        const item = ty.decode(d, ctx);
        if (!item.ok()) return item;
        res.push(item.value);
      }
      return ok(res);
    }

    interface IArrayThis {
      itemTy: ICborType<ET, DT, EE, DE, EC, DC>;
    }
    const proto = CborType.builder()
      .encode(function encode(
        this: IArrayThis,
        value: readonly ET[],
        e: IEncoder,
        ctx: EC
      ): Result<void, EE | OverflowError> {
        const res = arrayLen.encode(value.length, e, ctx);
        if (!res.ok()) {
          return res;
        }
        const { itemTy } = this;
        for (let i = 0; i < value.length; i++) {
          const res = itemTy.encode(value[i], e, ctx);
          if (!res.ok()) {
            return res;
          }
        }

        return getVoidOk();
      })
      .decode(function decode(
        this: IArrayThis,
        d: IDecoder,
        ctx: DC
      ): Result<DT[], DE | DecodingError> {
        const lenRes = arrayLen.decode(d, ctx);
        if (!lenRes.ok()) return lenRes;
        const len = lenRes.value;
        switch (typeof len) {
          case "number":
            return decodeArrayU32(this.itemTy, len, d, ctx);
          case "object":
            return decodeArrayIndefinite(this.itemTy, d, ctx);
          case "bigint":
            return decodeArrayU64(this.itemTy, len, d, ctx);
        }
      })
      .build();

    const arrayType = Object.create(proto);

    arrayType.itemTy = itemTy;

    return arrayType as NotImportant as CborType<
      readonly ET[],
      DT[],
      EE | OverflowError,
      DE | DecodingError,
      EC,
      DC
    >;
  };
}
