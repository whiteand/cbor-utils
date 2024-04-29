import { ok } from "resultra";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { NUMBER_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { createType } from "./createType";
import { readArg } from "./readArg";
import { writeTypeAndArg } from "./writeArg";
import { ICborType } from "../types";
import { DecodingError } from "../DecodingError";

function createSmallIntType(
  size: 8 | 16 | 32,
): ICborType<
  number,
  unknown,
  OverflowError | UnderflowError,
  unknown,
  DecodingError
> {
  const MAX_VALUE = (1 << size) - 1;
  const tyName = `u` + size;
  const MIN_VALUE = 0;
  return createType(
    (value: number, e) => {
      if (value > MAX_VALUE) {
        return new OverflowError(MAX_VALUE, value).err();
      }
      if (value < MIN_VALUE) {
        return new UnderflowError(MIN_VALUE, value).err();
      }
      return writeTypeAndArg(e, NUMBER_TYPE, value);
    },
    (d) => {
      const p = d.ptr;
      const marker = d.buf[d.ptr];
      const t = getType(marker);
      if (t !== NUMBER_TYPE) {
        return new TypeMismatchError(tyName, getTypeString(marker)).err();
      }
      const argRes = readArg(d);
      if (!argRes.ok()) {
        return argRes;
      }
      const arg = argRes.value;
      if (arg == null) {
        return new InvalidCborError(marker, p).err();
      }
      if (typeof arg === "bigint") {
        if (arg <= BigInt(MAX_VALUE) && arg >= BigInt(MIN_VALUE)) {
          return ok(Number(arg));
        }
        return new TypeMismatchError(tyName, getTypeString(marker)).err();
      }
      if (arg <= MAX_VALUE && arg >= MIN_VALUE) {
        return ok(arg);
      }
      return new TypeMismatchError(tyName, getTypeString(marker)).err();
    },
  );
}

export const u8 = createSmallIntType(8);
export const u16 = createSmallIntType(16);
export const u32 = createSmallIntType(32);
