import { ok } from "resultra";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { NUMBER_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { createType } from "./createType";
import { MAX_U32 } from "./limits";
import { readArg } from "./readArg";
import { writeHead } from "./writeArg";

export const createUsizeType = (size: 8 | 16 | 32) => {
  const MAX_VALUE = (1 << size) - 1;
  const tyName = `u` + size;
  const MIN_VALUE = 0;
  if (MAX_VALUE > MAX_U32) {
    throw new Error(
      "unreachable: should not use create usize type for values greater than u32",
    );
  }
  return createType(
    (value: number, e) => {
      if (value > MAX_VALUE) {
        return new OverflowError(MAX_VALUE, value).err();
      }
      if (value < MIN_VALUE) {
        return new UnderflowError(MIN_VALUE, value).err();
      }
      return writeHead(e, NUMBER_TYPE, value);
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
};
