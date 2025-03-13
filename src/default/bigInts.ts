import { Result, ok } from "resultra";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { getTypeString } from "../getTypeString";
import { DecodingError } from "../DecodingError";
import { uint } from "./uint";
import { flatMap } from "../operators/flatMap";
import { CborType } from "../base";
import { IDecoder } from "../types";

function createBigInt(
  size: 64 | 128
): CborType<
  bigint,
  bigint,
  OverflowError | UnderflowError,
  DecodingError,
  unknown,
  unknown
> {
  return uint.pipe(
    flatMap(
      (value: bigint): Result<bigint, OverflowError | UnderflowError> => {
        if (value > getMaxValue(size)) {
          return new OverflowError(getMaxValue(size), value).err();
        }
        if (value < 0n) {
          return new UnderflowError(0n, value).err();
        }

        return ok(value);
      },
      (
        arg: number | bigint,
        d: IDecoder,
        _: unknown,
        start: number
      ): Result<bigint, TypeMismatchError> => {
        const value = BigInt(arg);

        if (value <= getMaxValue(size) && value >= 0n) {
          return ok(value);
        }

        return new TypeMismatchError(
          getTyName(size),
          getTypeString(d.buf[start])
        ).err();
      }
    )
  );
}

/**
 * A CBOR Type that encodes u64.
 */
export const u64: CborType<
  bigint,
  bigint,
  OverflowError | UnderflowError,
  DecodingError,
  unknown,
  unknown
> = createBigInt(64);

/**
 * A CBOR Type that encodes u128.
 *
 * Note: it is not strictly specified as a part of specification.
 * But it was added to allow encoding of large numbers. The
 * specification however envisions future extension of number
 * type to 128 bit unsigned integers.
 */
export const u128: CborType<
  bigint,
  bigint,
  OverflowError | UnderflowError,
  DecodingError,
  unknown,
  unknown
> = createBigInt(128);

function getTyName(size: number) {
  return "u" + size;
}

function getMaxValue(size: number) {
  return (1n << BigInt(size)) - 1n;
}
