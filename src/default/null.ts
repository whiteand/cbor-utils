import { ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { UnexpectedValue } from "../operators/constant";
import { okNull } from "../okNull";

export const nullType = new CborType<
  null,
  unknown,
  UnexpectedValue<null, null>,
  unknown,
  EndOfInputError | TypeMismatchError
>(
  (v, e) => {
    if (v !== null) {
      return new UnexpectedValue(null, v).err();
    }
    e.write(SPECIAL_TYPE_MASK | 22);
    return okNull;
  },
  (d) => {
    if (d.ptr >= d.buf.length) {
      return EOI_ERR;
    }
    if (d.buf[d.ptr] === (SPECIAL_TYPE_MASK | 22)) {
      d.ptr++;
      return ok(null);
    }
    return new TypeMismatchError("null", getTypeString(d.buf[d.ptr])).err();
  }
);
