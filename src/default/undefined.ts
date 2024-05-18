import { ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { success } from "../success";
import { done } from "../utils/done";

export const undefinedType: CborType<
  undefined,
  UnexpectedValueError<undefined, undefined>,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = new CborType<
  undefined,
  UnexpectedValueError<undefined, undefined>,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
>(
  function encodeUndefined(v, e) {
    if (v !== undefined) {
      return new UnexpectedValueError(undefined, v).err();
    }
    e.write(SPECIAL_TYPE_MASK | 23);
    return success;
  },
  function decodeUndefined(d) {
    if (done(d)) {
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
