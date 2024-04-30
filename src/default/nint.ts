import { ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { NEGATIVE_INT_TYPE, NUMBER_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { writeTypeAndArg } from "../writeTypeAndArg";

export const nint = new CborType<
  number | bigint,
  unknown,
  OverflowError,
  unknown,
  DecodingError
>(
  (v, e) => {
    return writeTypeAndArg(
      e,
      NEGATIVE_INT_TYPE,
      typeof v === "bigint" ? -1n - v : -1 - v
    );
  },
  (d) => {
    const marker = d.buf[d.ptr];
    if (getType(marker) !== NEGATIVE_INT_TYPE) {
      return new TypeMismatchError("negative-int", getTypeString(marker)).err();
    }
    const argRes = readArg(d);
    if (!argRes.ok()) {
      return argRes;
    }
    const v = argRes.value;
    if (v == null) {
      return new InvalidCborError(marker, d.ptr).err();
    }
    if (typeof v === "bigint") {
      return ok(-1n - v);
    }
    return ok(-1 - v);
  }
);
