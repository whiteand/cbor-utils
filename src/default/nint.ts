import { ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { NEGATIVE_INT_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { MAX_U128 } from "../limits";
import { UnderflowError } from "../UnderflowError";
import { EOI_ERR } from "../EndOfInputError";

function isNegative(v: number | bigint) {
  return typeof v === "number";
}

export const nint = new CborType<
  number | bigint,
  unknown,
  OverflowError | TypeMismatchError,
  unknown,
  DecodingError
>(
  (v, e) => {
    if (typeof v === "number") {
      if (!Number.isInteger(v) || !Number.isFinite(v)) {
        return new TypeMismatchError("negative-int", "f64").err();
      }
      if (v >= 0) {
        return new OverflowError(-1, v).err();
      }
      if (BigInt(v) < -1n - MAX_U128) {
        return new UnderflowError(-1n - MAX_U128, v).err();
      }
    } else if (typeof v === "bigint") {
      if (v >= 0n) return new OverflowError(-1n, v).err();
      if (v < -1n - MAX_U128) {
        return new UnderflowError(-1n - MAX_U128, v).err();
      }
    } else {
      return new TypeMismatchError("number | bigint", typeof v).err();
    }
    return writeTypeAndArg(
      e,
      NEGATIVE_INT_TYPE,
      typeof v === "bigint" ? -1n - v : -1 - v,
    );
  },
  (d) => {
    if (d.ptr >= d.buf.length) return EOI_ERR;
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
  },
);
