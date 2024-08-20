import { Result, ok } from "resultra";
import { ICborTypeCodec, IDecodable, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { arrayLen } from "../default/arrayLen";
import { getVoidOk } from "../getVoidOk";
import { OverflowError } from "../OverflowError";
import { DecodingError } from "../DecodingError";
import { BREAK_BYTE } from "../constants";

function decodeArrayIndefinite(
  ty,
  d,
  ctx,
) {
  const res = [];
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
function decodeArrayU32(
  ty,
  len,
  d,
  ctx,
) {
  const res = [];
  for (let i = 0; i < len; i++) {
    const item = ty.decode(d, ctx);
    if (!item.ok()) return item;
    res.push(item.value);
  }
  return ok(res);
}

function decodeArrayU64(
  ty,
  len,
  d,
  ctx,
) {
  const res = [];
  for (let i = 0n; i < len; i++) {
    const item = ty.decode(d, ctx);
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
export function array() {
  return (
    itemTy,
  ) => {
    const proto = CborType.builder()
      .encode(
        function encode(value, e, ctx) {
          const res = arrayLen.encode(value.length, e, ctx);
          if (!res.ok()) {
            return res;
          }
          const { itemTy } = this
          for (let i = 0; i < value.length; i++) {
            const res = itemTy.encode(value[i], e, ctx);
            if (!res.ok()) {
              return res;
            }
          }

          return getVoidOk();
        }
      )
      .decode(function decode(d, ctx) {
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

    const arrayType = {
      itemTy,
    }

    Reflect.setPrototypeOf(arrayType, proto)

    return arrayType
  }
}
