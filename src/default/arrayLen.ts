import { DecodingError } from "../DecodingError";
import { EOI_ERR } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { ARRAY_TYPE, ARRAY_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { done } from "../utils/done";
import { writeTypeAndArg } from "../writeTypeAndArg";

export const arrayLen: CborType<
  number | bigint | null,
  OverflowError,
  DecodingError,
  unknown,
  unknown
> = new CborType<
  number | bigint | null,
  OverflowError,
  DecodingError,
  unknown,
  unknown
>(
  (len, e) => writeTypeAndArg(e, ARRAY_TYPE, len),
  (d) => {
    if (done(d)) return EOI_ERR;
    const marker = d.buf[d.ptr];
    const t = getType(marker);
    if (t !== ARRAY_TYPE) {
      return new TypeMismatchError("array", getTypeString(marker)).err();
    }
    return readArg(d);
  }
);
