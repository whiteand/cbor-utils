import { ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { NULL_BYTE } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { success } from "../success";
import { done } from "../utils/done";

export const nullType: CborType<
  null,
  UnexpectedValueError<null, null>,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = new CborType<
  null,
  UnexpectedValueError<null, null>,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
>(
  (v, e) => {
    if (v !== null) {
      return new UnexpectedValueError(null, v).err();
    }
    e.write(NULL_BYTE);
    return success;
  },
  (d) => {
    if (done(d)) {
      return EOI_ERR;
    }
    if (d.buf[d.ptr] === NULL_BYTE) {
      d.ptr++;
      return ok(null);
    }
    return new TypeMismatchError("null", getTypeString(d.buf[d.ptr])).err();
  }
);
