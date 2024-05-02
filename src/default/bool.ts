import { ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { done } from "../utils/done";
import { success } from "../success";
import { getInfo } from "../marker";

export const bool = new CborType<
  boolean,
  unknown,
  TypeMismatchError,
  unknown,
  EndOfInputError | TypeMismatchError
>(
  (v, e) => {
    if (typeof v !== "boolean") {
      return new TypeMismatchError("boolean", String(v)).err();
    }

    e.write(SPECIAL_TYPE_MASK | (v ? 21 : 20));
    return success;
  },
  (d) => {
    if (done(d)) {
      return EOI_ERR;
    }
    const m = d.buf[d.ptr++];
    switch (getInfo(m)) {
      case 20:
        return ok(false);
      case 21:
        return ok(true);
      default:
        d.ptr--;
        return new TypeMismatchError(
          "boolean",
          getTypeString(d.buf[d.ptr]),
        ).err();
    }
  },
);
