import { ok, Result } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { IDecoder, IEncoder } from "../types";

function encodeHalfFloat(v: number, e: IEncoder) {
  return new OverflowError(0, v).err();
}

function decodeHalfFloat(
  d: IDecoder
): Result<number, TypeMismatchError | EndOfInputError> {
  const m = d.buf[d.ptr];
  const t = getType(m);
  if (t !== SPECIAL_TYPE || getInfo(m) !== 25) {
    return new TypeMismatchError("f16", getTypeString(m)).err();
  }

  if (d.ptr + 2 >= d.buf.length) {
    return EOI_ERR;
  }
  d.ptr++;
  let a = d.buf[d.ptr++];
  let b = d.buf[d.ptr++];

  const pos = a >> 7 === 0;
  const exponent = (a & 0b1111100) >> 2;
  const significand = ((a & 0b11) << 8) | b;

  if (exponent === 0) {
    if (significand === 0) {
      return ok(pos ? 0 : -0);
    } else {
      return ok((pos ? 1 : -1) * 2 ** -14 * (significand / 1024));
    }
  }
  if (exponent === 31) {
    if (significand === 0) {
      return ok(pos ? Infinity : -Infinity);
    } else {
      return ok(NaN);
    }
  }
  let res = 2 ** (exponent - 15) * (1 + significand / 1024);
  return ok(pos ? res : -res);
}

export const f16 = new CborType<
  number,
  unknown,
  OverflowError,
  unknown,
  TypeMismatchError
>(encodeHalfFloat, decodeHalfFloat);
