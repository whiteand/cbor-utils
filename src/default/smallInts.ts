import { Result, ok } from "resultra";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { getTypeString } from "../getTypeString";
import { flatMap } from "../operators/flatMap";
import { uint } from "./uint";
import { CborType } from "../base";
import { InvalidCborError } from "../InvalidCborError";
import { EndOfInputError } from "../EndOfInputError";
import { MAX_U16, MAX_U32, MAX_U8 } from "../limits";

const MAX_VALUE_DICT = {
  8: MAX_U8,
  16: MAX_U16,
  32: MAX_U32,
} as const;
function createSmallIntType(
  size: 8 | 16 | 32
): CborType<
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> {
  const MAX_VALUE = MAX_VALUE_DICT[size];
  const tyName = `u` + size;
  const MIN_VALUE = 0;
  return uint.pipe(
    flatMap(
      (value: number): Result<number, OverflowError | UnderflowError> => {
        if (typeof value !== "number") {
          return new TypeMismatchError("number", typeof value).err();
        }
        if (value > MAX_VALUE) {
          return new OverflowError(MAX_VALUE, value).err();
        }
        if (value < MIN_VALUE) {
          return new UnderflowError(MIN_VALUE, value).err();
        }
        if (!Number.isInteger(value)) {
          return new TypeMismatchError(tyName, "f64").err();
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
            getTypeString(d.buf[start])
          ).err();
        }
        if (arg <= MAX_VALUE && arg >= MIN_VALUE) {
          return ok(arg);
        }
        return new TypeMismatchError(tyName, getTypeString(d.buf[start])).err();
      }
    )
  );
}

export const u8: CborType<
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = createSmallIntType(8);

export const u16: CborType<
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = createSmallIntType(16);

export const u32: CborType<
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = createSmallIntType(32);
