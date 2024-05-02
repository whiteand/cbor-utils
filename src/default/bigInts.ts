import { Result, ok } from "resultra";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { getTypeString } from "../getTypeString";
import { DecodingError } from "../DecodingError";
import { uint } from "./uint";
import { flatMap } from "../operators/flatMap";
import { CborType } from "../base";

function createBigInt(
  size: 64 | 128,
): CborType<bigint, void, OverflowError | UnderflowError, void, DecodingError> {
  const MAX_VALUE = (1n << BigInt(size)) - 1n;
  const tyName = "u" + size;
  const MIN_VALUE = 0n;

  return uint.pipe(
    flatMap(
      (value: bigint): Result<bigint, OverflowError | UnderflowError> => {
        if (value > MAX_VALUE) {
          return new OverflowError(MAX_VALUE, value).err();
        }
        if (value < MIN_VALUE) {
          return new UnderflowError(MIN_VALUE, value).err();
        }

        return ok(value);
      },
      (
        arg: number | bigint,
        d,
        _,
        start,
      ): Result<bigint, TypeMismatchError> => {
        const value = BigInt(arg);

        if (value <= MAX_VALUE && value >= MIN_VALUE) {
          return ok(value);
        }

        return new TypeMismatchError(tyName, getTypeString(d.buf[start])).err();
      },
    ),
  );
}

export const u64 = createBigInt(64);
export const u128 = createBigInt(128);
