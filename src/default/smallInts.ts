import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { getTypeString } from "../getTypeString";
import { flatMap } from "../operators/flatMap";
import { uint } from "./uint";
import { CborType } from "../base";

const MAX_VALUE_DICT = {
  8: 255,
  16: 65535,
  32: 4294967295,
} as const;
function createSmallIntType(
  size: 8 | 16 | 32,
): CborType<
  number,
  unknown,
  OverflowError | UnderflowError,
  unknown,
  DecodingError
> {
  const MAX_VALUE = MAX_VALUE_DICT[size];
  const tyName = `u` + size;
  const MIN_VALUE = 0;
  return uint.pipe(
    flatMap(
      (value: number): Result<number, OverflowError | UnderflowError> => {
        if (value > MAX_VALUE) {
          return new OverflowError(MAX_VALUE, value).err();
        }
        if (value < MIN_VALUE) {
          return new UnderflowError(MIN_VALUE, value).err();
        }
        return ok(value);
      },
      (arg, d, _, start): Result<number, TypeMismatchError> => {
        if (typeof arg === "bigint") {
          if (arg <= BigInt(MAX_VALUE) && arg >= BigInt(MIN_VALUE)) {
            return ok(Number(arg));
          }
          return new TypeMismatchError(
            tyName,
            getTypeString(d.buf[start]),
          ).err();
        }
        if (arg <= MAX_VALUE && arg >= MIN_VALUE) {
          return ok(arg);
        }
        return new TypeMismatchError(tyName, getTypeString(d.buf[start])).err();
      },
    ),
  );
}

export const u8 = createSmallIntType(8);
export const u16 = createSmallIntType(16);
export const u32 = createSmallIntType(32);
