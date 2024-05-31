import { Result } from "resultra";
import { IDecoder } from "./types";
import { done } from "./utils/done";
import { EOI_ERR, EndOfInputError } from "./EndOfInputError";
import { getInfo, getType } from "./marker";
import { InvalidCborError } from "./InvalidCborError";
import { okVoid } from "./okNull";
import {
  ARRAY_TYPE,
  BREAK_BYTE,
  BYTES_TYPE,
  MAP_TYPE,
  NEGATIVE_INT_TYPE,
  NUMBER_TYPE,
  SPECIAL_TYPE,
  STRING_TYPE,
  TAG_TYPE,
} from "./constants";
import { getTypeString } from "./getTypeString";
import { readArg } from "./readArg";

function skipArg(
  d: IDecoder
): Result<void, EndOfInputError | InvalidCborError> {
  const p = d.ptr;
  const marker = d.buf[d.ptr++];
  const info = getInfo(marker);
  if (info < 24) {
    return okVoid;
  }
  if (info < 28) {
    const skipLen = 1 << (info - 24);
    if (d.ptr + skipLen > d.buf.length) {
      return EOI_ERR;
    }
    d.ptr += skipLen;
    return okVoid;
  }
  if (info === 31) {
    return okVoid;
  }
  return new InvalidCborError(marker, p).err();
}

function skipKUntilNull(
  k: number,
  d: IDecoder
): Result<void, EndOfInputError | InvalidCborError> {
  while (true) {
    if (done(d)) return EOI_ERR;

    const m = d.buf[d.ptr];
    if (m === BREAK_BYTE) {
      d.ptr++;
      return okVoid;
    }
    const res = skip(d);
    if (!res.ok()) return res;
    for (let i = 1; i < k; i++) {
      if (m === BREAK_BYTE) {
        return new InvalidCborError(m, d.ptr).err();
      }
      const res = skip(d);
      if (!res.ok()) return res;
    }
  }
}
function skipNK(
  n: number | bigint | null,
  k: number,
  d: IDecoder
): Result<void, EndOfInputError | InvalidCborError> {
  if (n == null) {
    return skipKUntilNull(k, d);
  }
  const start = typeof n === "number" ? 0 : 0n;
  for (let i = start; i < n; i++) {
    for (let j = 0; j < k; j++) {
      const res = skip(d);
      if (!res.ok()) return res;
    }
  }
  return okVoid;
}

/**
 * Skips CBOR data item.
 *
 * @param d Decoder
 * @returns OkResult - if successfully skipped the next item.
 *  ErrResult - if there is no more data to skip or cbor is invalid
 */
export function skip(
  d: IDecoder
): Result<void, EndOfInputError | InvalidCborError> {
  if (done(d)) return EOI_ERR;
  const marker = d.buf[d.ptr];
  const ty = getType(marker);
  if (ty <= NEGATIVE_INT_TYPE) {
    return skipArg(d);
  }
  if (ty <= STRING_TYPE) {
    const lenRes = readArg(d);
    if (!lenRes.ok()) return lenRes;
    const len = lenRes.value;
    if (len == null) return skipKUntilNull(1, d);
    const nextPos = typeof len === "number" ? d.ptr + len : BigInt(d.ptr) + len;
    const max = typeof len === "number" ? d.buf.length : BigInt(d.buf.length);
    if (nextPos > max) {
      return EOI_ERR;
    }
    d.ptr = Number(nextPos);
    return okVoid;
  }
  if (ty <= MAP_TYPE) {
    const size = ty === ARRAY_TYPE ? 1 : 2;
    const lenRes = readArg(d);
    if (!lenRes.ok()) return lenRes;
    const len = lenRes.value;
    return skipNK(len, size, d);
  }
  if (ty === TAG_TYPE) {
    const tag = skipArg(d);
    if (!tag.ok()) return tag;
    return skip(d);
  }
  const info = getInfo(marker);
  if (info < 24) {
    d.ptr++;
    return okVoid;
  }
  if (info === 24) {
    if (d.ptr + 2 > d.buf.length) return EOI_ERR;
    d.ptr += 2;
    return okVoid;
  }
  if (info <= 27) {
    const skipLen = (1 << (info - 24)) + 1;
    if (d.ptr + skipLen > d.buf.length) {
      return EOI_ERR;
    }
    d.ptr += skipLen;
    return okVoid;
  }

  throw new Error(
    "not implemented special type skip: " +
      getTypeString(marker) +
      " " +
      getInfo(marker)
  );
}
