import { ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { NUMBER_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { writeTypeAndArg } from "../writeTypeAndArg";

export const uint = new CborType<
  number | bigint,
  unknown,
  OverflowError,
  unknown,
  DecodingError
>(
  (v, e) => {
    return writeTypeAndArg(e, NUMBER_TYPE, v);
  },
  (d) => {
    const marker = d.buf[d.ptr];
    if (getType(marker) !== NUMBER_TYPE) {
      return new TypeMismatchError("number", getTypeString(marker)).err();
    }
    const argRes = readArg(d);
    if (!argRes.ok()) {
      return argRes;
    }
    const v = argRes.value;
    if (v == null) {
      return new InvalidCborError(marker, d.ptr).err();
    }
    return ok(v);
  },
);
