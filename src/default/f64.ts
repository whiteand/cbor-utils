import { ok, Result } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE, SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { IDecoder, IEncoder } from "../types";
import { success } from "../success";
import { done } from "../utils/done";

function encodeF64(v: number, e: IEncoder) {
  if (typeof v !== "number") {
    return new TypeMismatchError("number", typeof v).err();
  }
  e.write(SPECIAL_TYPE_MASK | 27);
  const bs = new Uint8Array(8);
  new DataView(bs.buffer, 0).setFloat64(0, v, false);
  e.writeSlice(bs);
  return success;
}

function decodeF64(
  d: IDecoder
): Result<number, TypeMismatchError | EndOfInputError> {
  if (done(d)) return EOI_ERR;
  const m = d.buf[d.ptr];
  const t = getType(m);

  if (t !== SPECIAL_TYPE || getInfo(m) !== 27) {
    return new TypeMismatchError("f64", getTypeString(m)).err();
  }

  if (d.ptr + 8 >= d.buf.length) {
    return EOI_ERR;
  }
  const res = new DataView(
    d.buf.buffer,
    d.buf.byteOffset + d.ptr + 1
  ).getFloat64(0, false);
  d.ptr += 9;
  return ok(res);
}

export const f64: CborType<
  number,
  OverflowError,
  TypeMismatchError,
  unknown,
  unknown
> = new CborType<number, OverflowError, TypeMismatchError, unknown, unknown>(
  encodeF64,
  decodeF64
);
