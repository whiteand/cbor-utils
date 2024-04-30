import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { BYTES_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { okNull } from "../okNull";
import { readSlice } from "./readSlice";
import { IDecoder, IEncoder } from "../types";
import { concatBytesOfLength } from "../utils/concatBytes";

function decodeIndefiniteBytes(d: IDecoder): Result<Uint8Array, DecodingError> {
  d.ptr++;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (d.ptr < d.buf.length) {
    const m = d.buf[d.ptr];
    if (m === 0xff) {
      d.ptr++;
      break;
    }
    const bs = decodeBytes(d);
    if (!bs.ok()) return bs;
    total += bs.value.length;
    chunks.push(bs.value);
  }
  return ok(concatBytesOfLength(chunks, total));
}

function decodeBytes(d: IDecoder): Result<Uint8Array, DecodingError> {
  const marker = d.buf[d.ptr];
  if (getType(marker) !== BYTES_TYPE) {
    return new TypeMismatchError("number", getTypeString(marker)).err();
  }
  const argRes = readArg(d);
  if (!argRes.ok()) {
    return argRes;
  }
  const len = argRes.value;

  return len == null ? decodeIndefiniteBytes(d) : readSlice(d, Number(len));
}

function encodeBytes(v: Uint8Array, e: IEncoder): Result<null, OverflowError> {
  const res = writeTypeAndArg(e, BYTES_TYPE, v.length);
  if (!res.ok()) return res;
  e.writeSlice(v);
  return okNull;
}

export const bytes = new CborType<
  Uint8Array,
  unknown,
  OverflowError,
  unknown,
  DecodingError
>(encodeBytes, decodeBytes);
