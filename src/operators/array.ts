import { ok, Result } from "resultra";
import { CborType } from "../base";
import { BREAK_BYTE } from "../constants";
import { arrayLen } from "../default/arrayLen";
import { getVoidOk } from "../getVoidOk";
import {
  AnyContextArgs,
  ContextFromArgs,
  ICborType,
  IDecodable,
  IDecoder,
  IEncoder,
  Z,
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
export function array(): <
  ET,
  DT,
  EE extends Error,
  DE extends Error,
  ECArgs extends AnyContextArgs,
  DCArgs extends AnyContextArgs
>(
  ty: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
) => CborType<
  readonly ET[],
  DT[],
  EE | OverflowError,
  DE | DecodingError,
  ECArgs,
  DCArgs
> {
  return <
    ET,
    DT,
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >(
    itemTy: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
  ): CborType<
    readonly ET[],
    DT[],
    EE | OverflowError,
    DE | DecodingError,
    ECArgs,
    DCArgs
  > => {
    function decodeArrayIndefinite<T, DE, DCArgs extends AnyContextArgs>(
      ty: IDecodable<T, DE, DCArgs>,
      d: IDecoder,
      ctx: DCArgs
    ) {
      const res = [] as T[];
      while (d.ptr < d.buf.length) {
        const m = d.buf[d.ptr];
        if (m === BREAK_BYTE) {
          d.ptr++;
          break;
        }
        const item = (ty.decode as Z)(d, ctx);
        if (!item.ok()) return item;
        res.push(item.value);
      }
      return ok(res);
    }
    function decodeArrayU32<T, DE, DCArgs extends AnyContextArgs>(
      ty: IDecodable<T, DE, DCArgs>,
      len: number,
      d: IDecoder,
      ctx: DCArgs
    ) {
      const res = [] as T[];
      for (let i = 0; i < len; i++) {
        const item = (ty.decode as Z)(d, ctx);
        if (!item.ok()) return item;
        res.push(item.value);
      }
      return ok(res);
    }

    function decodeArrayU64<T, DE, DCArgs extends AnyContextArgs>(
      ty: IDecodable<T, DE, DCArgs>,
      len: bigint,
      d: IDecoder,
      ctx: DCArgs
    ) {
      const res = [] as T[];
      for (let i = 0n; i < len; i++) {
        const item = (ty.decode as Z)(d, ctx);
        if (!item.ok()) return item;
        res.push(item.value);
      }
      return ok(res);
    }

    interface IArrayThis {
      itemTy: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>;
    }
    const proto = CborType.builder()
      .encode(function encode(
        this: IArrayThis,
        value: readonly ET[],
        e: IEncoder,
        ctx: ContextFromArgs<ECArgs>
      ): Result<void, EE | OverflowError> {
        const res = arrayLen.encode(value.length, e);
        if (!res.ok()) {
          return res;
        }
        const { itemTy } = this;
        for (let i = 0; i < value.length; i++) {
          const res = (itemTy.encode as Z)(value[i], e, ctx);
          if (!res.ok()) {
            return res;
          }
        }

        return getVoidOk();
      })
      .decode(function decode(
        this: IArrayThis,
        d: IDecoder,
        ctx: ContextFromArgs<DCArgs>
      ): Result<DT[], DE | DecodingError> {
        const lenRes = arrayLen.decode(d);
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

    return arrayType as Z as CborType<
      readonly ET[],
      DT[],
      EE | OverflowError,
      DE | DecodingError,
      ECArgs,
      DCArgs
    >;
  };
}
