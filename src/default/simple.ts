import { Result, ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE, SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { success } from "../success";
import { IDecoder, IEncoder } from "../types";
import { Simple } from "./DataItem";
import { getJsType } from "../utils/getJsType";
import { done } from "../utils/done";

function decodeSpecial(
  d: IDecoder,
): Result<
  Simple<number>,
  TypeMismatchError | EndOfInputError | InvalidCborError
> {
  if (done(d)) return EOI_ERR;
  const m = d.buf[d.ptr];
  const t = getType(m);
  if (t !== SPECIAL_TYPE) {
    return new TypeMismatchError("simple", getTypeString(m)).err();
  }
  const info = getInfo(m);

  if (info < 20) {
    d.ptr++;
    return ok(Simple.of(info));
  }

  if (info === 24) {
    if (d.ptr + 1 >= d.buf.length) return EOI_ERR;
    d.ptr++;
    return ok(Simple.of(d.buf[d.ptr++]));
  }

  return new TypeMismatchError("simple", getTypeString(m)).err();
}
function encodeSpecial(
  v: Simple<number>,
  e: IEncoder,
): Result<void, TypeMismatchError> {
  if (!v || !(v instanceof Simple)) {
    return new TypeMismatchError("Simple", getJsType(v)).err();
  }
  if (v.value < 20) {
    e.write(SPECIAL_TYPE_MASK | v.value);
    return success;
  }
  e.write(SPECIAL_TYPE_MASK | 24).write(v.value);
  return success;
}

export const simple = new CborType<
  Simple<number>,
  void,
  TypeMismatchError,
  void,
  TypeMismatchError | EndOfInputError | InvalidCborError
>(encodeSpecial, decodeSpecial);
