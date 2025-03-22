import { ok, Result } from "resultra";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE, SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { IDecoder, IEncoder } from "../types";
import { getVoidOk } from "../getVoidOk";
import { done } from "../utils/done";

function encodeF32(v: number, e: IEncoder) {
  if (typeof v !== "number") {
    return new TypeMismatchError("number", typeof v).err();
  }
  e.write(SPECIAL_TYPE_MASK | 26);
  const bs = new Uint8Array(4);
  new DataView(bs.buffer, 0).setFloat32(0, v, false);
  e.writeSlice(bs);
  return getVoidOk();
}

function decodeF32(
  d: IDecoder
): Result<number, TypeMismatchError | EndOfInputError> {
  if (done(d)) return getEoiResult();
  const m = d.buf[d.ptr];
  const t = getType(m);

  if (t !== SPECIAL_TYPE || getInfo(m) !== 26) {
    return new TypeMismatchError("f32", getTypeString(m)).err();
  }

  if (d.ptr + 4 >= d.buf.length) {
    return getEoiResult();
  }
  const res = new DataView(
    d.buf.buffer,
    d.buf.byteOffset + d.ptr + 1
  ).getFloat32(0, false);
  d.ptr += 5;
  return ok(res);
}

/**
 * A CBOR type that encodes 32-bit floating point numbers.
 */
export const f32: CborType<
  number,
  number,
  OverflowError,
  TypeMismatchError,
  [],
  []
> = CborType.builder().encode(encodeF32).decode(decodeF32).build();
