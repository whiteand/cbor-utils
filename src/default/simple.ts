import { Result, ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE, SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { okNull } from "../okNull";
import { IDecoder, IEncoder } from "../types";
import { Simple } from "./DataItem";

function decodeSpecial(
  d: IDecoder
): Result<
  Simple<number>,
  TypeMismatchError | EndOfInputError | InvalidCborError
> {
  if (d.ptr >= d.buf.length) return EOI_ERR;
  const p = d.ptr;
  const m = d.buf[d.ptr];
  const t = getType(m);
  if (t !== SPECIAL_TYPE) {
    return new TypeMismatchError("special", getTypeString(m)).err();
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

  return new InvalidCborError(
    m,
    p,
    new Error(`Expected valid simple value`)
  ).err();
}
function encodeSpecial(v: Simple<number>, e: IEncoder): Result<null, never> {
  if (v.value < 20) {
    e.write(SPECIAL_TYPE_MASK | v.value);
    return okNull;
  }
  e.write(SPECIAL_TYPE | 24).write(v.value);
  return okNull;
}

export const simple = new CborType<
  Simple<number>,
  unknown,
  never,
  unknown,
  TypeMismatchError | EndOfInputError | InvalidCborError
>(encodeSpecial, decodeSpecial);
