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

function createBigIntType(
  size: 64 | 128,
): ICborType<
  bigint,
  unknown,
  OverflowError | UnderflowError,
  unknown,
  DecodingError
> {
  const MAX_VALUE = (1n << BigInt(size)) - 1n;
  const tyName = `u${size}`;
  const MIN_VALUE = 0n;
  return createType(
    (value: bigint, e) => {
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
      const bigInt = BigInt(arg);
      if (arg >= MIN_VALUE && arg <= MAX_VALUE) {
        return ok(bigInt);
      }
      return new TypeMismatchError(tyName, getTypeString(marker)).err();
    },
  );
}

export const u64 = createBigIntType(64);
export const u128 = createBigIntType(128);
