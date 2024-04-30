import { ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { UnexpectedValue } from "../operators/constant";
import { okNull } from "../okNull";

export const undefinedType = new CborType<
  undefined,
  unknown,
  UnexpectedValue<undefined, undefined>,
  unknown,
  EndOfInputError | TypeMismatchError
>(
  function encodeUndefined(v, e) {
    if (v !== undefined) {
      return new UnexpectedValue(undefined, v).err();
    }
    e.write(SPECIAL_TYPE_MASK | 23);
    return okNull;
  },
  function decodeUndefined(d) {
    if (d.ptr >= d.buf.length) {
      return EOI_ERR;
    }
    if (d.buf[d.ptr] === (SPECIAL_TYPE_MASK | 23)) {
      d.ptr++;
      return ok(undefined);
    }
    return new TypeMismatchError(
      "undefined",
      getTypeString(d.buf[d.ptr])
    ).err();
  }
);
