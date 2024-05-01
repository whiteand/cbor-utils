import { ok, Result } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE, SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { IDecoder, IEncoder } from "../types";
import { okNull } from "../okNull";
import { getJsType } from "../utils/getJsType";
import { done } from "../utils/done";

function encodeF32(v: number, e: IEncoder) {
  if (typeof v !== "number") {
    return new TypeMismatchError("number", typeof v).err();
  }
  e.write(SPECIAL_TYPE_MASK | 26);
  const bs = new Uint8Array(4);
  new DataView(bs.buffer, 0).setFloat32(0, v, false);
  e.writeSlice(bs);
  return okNull;
}

function decodeF32(
  d: IDecoder,
): Result<number, TypeMismatchError | EndOfInputError> {
  if (done(d)) return EOI_ERR;
  const m = d.buf[d.ptr];
  const t = getType(m);

  if (t !== SPECIAL_TYPE || getInfo(m) !== 26) {
    return new TypeMismatchError("f32", getTypeString(m)).err();
  }

  if (d.ptr + 4 >= d.buf.length) {
    return EOI_ERR;
  }
  const res = new DataView(
    d.buf.buffer,
    d.buf.byteOffset + d.ptr + 1,
  ).getFloat32(0, false);
  d.ptr += 5;
  return ok(res);
}

export const f32 = new CborType<
  number,
  unknown,
  OverflowError,
  unknown,
  TypeMismatchError
>(encodeF32, decodeF32);
