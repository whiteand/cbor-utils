import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { BREAK_BYTE, BYTES_TYPE, BYTES_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { success } from "../success";
import { readSlice } from "./readSlice";
import { IDecoder, IEncoder } from "../types";
import { getJsType } from "../utils/getJsType";
import { concatBytesOfLength } from "../utils/concatBytes";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { done } from "../utils/done";

function decodeIndefiniteBytes(
  d: IDecoder
): Result<Uint8Array, EndOfInputError | TypeMismatchError> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (d.ptr < d.buf.length) {
    const m = d.buf[d.ptr];
    if (m === BREAK_BYTE) {
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

function decodeBytes(
  d: IDecoder
): Result<Uint8Array, EndOfInputError | TypeMismatchError> {
  if (done(d)) return EOI_ERR;
  const marker = d.buf[d.ptr];
  if (getType(marker) !== BYTES_TYPE) {
    return new TypeMismatchError(
      getTypeString(BYTES_TYPE_MASK),
      getTypeString(marker)
    ).err();
  }
  const argRes = readArg(d);
  if (!argRes.ok()) {
    return argRes;
  }
  const len = argRes.value;

  return len == null ? decodeIndefiniteBytes(d) : readSlice(d, Number(len));
}

function encodeBytes(
  v: Uint8Array,
  e: IEncoder
): Result<void, OverflowError | TypeMismatchError> {
  if (!(v instanceof Uint8Array)) {
    return new TypeMismatchError("Uint8Array", getJsType(v)).err();
  }
  const res = writeTypeAndArg(e, BYTES_TYPE, v.length);
  if (!res.ok()) return res;
  e.writeSlice(v);
  return success;
}

/**
 * A CBOR type that encodes Uint8Array as bytes type
 */
export const bytes: CborType<
  Uint8Array,
  OverflowError,
  DecodingError,
  unknown,
  unknown
> = new CborType<Uint8Array, OverflowError, DecodingError, unknown, unknown>(
  encodeBytes,
  decodeBytes
);
