import { Result, ok } from "resultra";
import { ICborType, IDecodableType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { readArg } from "../readArg";
import { ARRAY_TYPE } from "../constants";
import { okNull } from "../okNull";
import { getType } from "../marker";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { DecodingError } from "../DecodingError";
import { getTypeString } from "../getTypeString";

function decodeArrayIndefinite<T, DC, DE>(
  ty: IDecodableType<T, DC, DE>,
  d: IDecoder,
  ctx: DC,
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
function decodeArrayU32<T, DC, DE>(
  ty: IDecodableType<T, DC, DE>,
  len: number,
  d: IDecoder,
  ctx: DC,
) {
  const res: T[] = [];
  for (let i = 0; i < len; i++) {
    const item = ty[decodeSymbol](d, ctx);
    if (!item.ok()) return item;
    res.push(item.value);
  }
  return ok(res);
}
function decodeArrayU64<T, DC, DE>(
  ty: IDecodableType<T, DC, DE>,
  len: bigint,
  d: IDecoder,
  ctx: DC,
) {
  const res: T[] = [];
  for (let i = 0n; i < len; i++) {
    const item = ty[decodeSymbol](d, ctx);
    if (!item.ok()) return item;
    res.push(item.value);
  }
  return ok(res);
}

export function array(): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => CborType<T[], EC, EE | OverflowError, DC, DE | DecodingError> {
  return <T, EC, EE, DC, DE>(
    ty: ICborType<T, EC, EE, DC, DE>,
  ): CborType<T[], EC, EE | OverflowError, DC, DE | DecodingError> =>
    new CborType(
      (value: T[], e: IEncoder, ctx: EC): Result<null, EE | OverflowError> => {
        const res = writeTypeAndArg(e, ARRAY_TYPE, value.length);
        if (!res.ok()) {
          return res;
        }
        for (let i = 0; i < value.length; i++) {
          const res = ty[encodeSymbol](value[i], e, ctx);
          if (!res.ok()) {
            return res;
          }
        }

        return okNull;
      },
      (d: IDecoder, ctx: DC): Result<T[], DE | DecodingError> => {
        const marker = d.buf[d.ptr];
        const t = getType(marker);
        if (t !== ARRAY_TYPE) {
          return new TypeMismatchError("array", getTypeString(marker)).err();
        }
        const lenRes = readArg(d);
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
      },
    );
}
