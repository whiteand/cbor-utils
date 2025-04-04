import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { BREAK_BYTE, STRING_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { getVoidOk } from "../getVoidOk";
import { readSlice } from "./readSlice";
import { IDecoder, IEncoder } from "../types";
import { fromUtf8, utf8 } from "../utils/utf8";
import { InvalidCborError } from "../InvalidCborError";
import { getEoiResult } from "../EndOfInputError";
import { done } from "../utils/done";

function decodeIndefiniteString(d: IDecoder): Result<string, DecodingError> {
  const chunks: string[] = [];

  while (!done(d)) {
    const m = d.buf[d.ptr];
    if (m === BREAK_BYTE) {
      d.ptr++;
      break;
    }
    const bs = decodeString(d);
    if (!bs.ok()) return bs;
    chunks.push(bs.value);
  }
  return ok(chunks.join(""));
}

function decodeString(d: IDecoder): Result<string, DecodingError> {
  if (done(d)) return getEoiResult();
  const p = d.ptr;
  const marker = d.buf[p];
  if (getType(marker) !== STRING_TYPE) {
    return new TypeMismatchError("str", getTypeString(marker)).err();
  }
  const argRes = readArg(d);
  if (!argRes.ok()) {
    return argRes;
  }
  const len = argRes.value;

  if (len == null) return decodeIndefiniteString(d);

  const bytes = readSlice(d, Number(len));
  if (!bytes.ok()) return bytes;
  const str = fromUtf8(bytes.value);
  if (!str.ok()) {
    return new InvalidCborError(marker, p, str.error).err();
  }

  return str;
}

function encodeString(
  v: string,
  e: IEncoder
): Result<void, OverflowError | TypeMismatchError> {
  if (typeof v !== "string") {
    return new TypeMismatchError("string", typeof v).err();
  }
  const bytes = new Uint8Array(utf8(v));
  const res = writeTypeAndArg(e, STRING_TYPE, bytes.length);
  if (!res.ok()) return res;
  e.writeSlice(bytes);
  return getVoidOk();
}

/**
 * A CBOR type that encods utf-8 strings.
 */
export const str: CborType<
  string,
  string,
  OverflowError | TypeMismatchError,
  DecodingError,
  [],
  []
> = CborType.builder().encode(encodeString).decode(decodeString).build();
