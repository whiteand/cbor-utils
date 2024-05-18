import { Result, ok } from "resultra";
import { ICborType, IDecodableType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";
import { arrayLen } from "../default/arrayLen";
import { success } from "../success";
import { OverflowError } from "../OverflowError";
import { DecodingError } from "../DecodingError";

function decodeArrayIndefinite<T, DE extends Error, DC>(
  ty: IDecodableType<T, DE, DC>,
  d: IDecoder,
  ctx: DC
) {
  const res: T[] = [];
  while (d.ptr < d.buf.length) {
    const m = d.buf[d.ptr];
    if (m === 0xff) {
      d.ptr++;
      break;
    }
    const item = ty[decodeSymbol](d, ctx);
    if (!item.ok()) return item;
    res.push(item.value);
  }
  return ok(res);
}
function decodeArrayU32<T, DE extends Error, DC>(
  ty: IDecodableType<T, DE, DC>,
  len: number,
  d: IDecoder,
  ctx: DC
) {
  const res: T[] = [];
  for (let i = 0; i < len; i++) {
    const item = ty[decodeSymbol](d, ctx);
    if (!item.ok()) return item;
    res.push(item.value);
  }
  return ok(res);
}
function decodeArrayU64<T, DE extends Error, DC>(
  ty: IDecodableType<T, DE, DC>,
  len: bigint,
  d: IDecoder,
  ctx: DC
) {
  const res: T[] = [];
  for (let i = 0n; i < len; i++) {
    const item = ty[decodeSymbol](d, ctx);
    if (!item.ok()) return item;
    res.push(item.value);
  }
  return ok(res);
}

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
export function array(): <T, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<T, EE, DE, EC, DC>
) => CborType<T[], EE | OverflowError, DE | DecodingError, EC, DC> {
  return <T, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<T, EE, DE, EC, DC>
  ): CborType<T[], EE | OverflowError, DE | DecodingError, EC, DC> =>
    new CborType(
      (
        value: readonly T[],
        e: IEncoder,
        ctx: EC
      ): Result<void, EE | OverflowError> => {
        const res = arrayLen[encodeSymbol](value.length, e, ctx);
        if (!res.ok()) {
          return res;
        }
        for (let i = 0; i < value.length; i++) {
          const res = ty[encodeSymbol](value[i], e, ctx);
          if (!res.ok()) {
            return res;
          }
        }

        return success;
      },
      (d: IDecoder, ctx: DC): Result<T[], DE | DecodingError> => {
        const lenRes = arrayLen[decodeSymbol](d, ctx);
        if (!lenRes.ok()) return lenRes;
        const len = lenRes.value;
        switch (typeof len) {
          case "number":
            return decodeArrayU32(ty, len, d, ctx);
          case "object":
            return decodeArrayIndefinite(ty, d, ctx);
          case "bigint":
            return decodeArrayU64(ty, len, d, ctx);
        }
      }
    );
}
