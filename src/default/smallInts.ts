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
import { IDecoder } from "../types";

const MAX_VALUE_DICT = {
  8: MAX_U8,
  16: MAX_U16,
  32: MAX_U32,
} as const;

function getType(value: number): string {
  return "u" + value.toString();
}

function getMaxValue(size: 8 | 16 | 32): number {
  return MAX_VALUE_DICT[size];
}

function createSmallIntType(
  size: 8 | 16 | 32
): CborType<
  number,
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> {
  return uint.pipe(
    flatMap(
      (value: number): Result<number, OverflowError | UnderflowError> => {
        if (typeof value !== "number") {
          return new TypeMismatchError("number", typeof value).err();
        }
        if (value > getMaxValue(size)) {
          return new OverflowError(getMaxValue(size), value).err();
        }
        if (value < 0) {
          return new UnderflowError(0, value).err();
        }
        if (!Number.isInteger(value)) {
          return new TypeMismatchError(getType(size), "f64").err();
        }
        return ok(value);
      },
      (
        arg: number | bigint,
        d: IDecoder,
        _: unknown,
        start: number
      ): Result<number, TypeMismatchError> => {
        if (typeof arg === "bigint") {
          if (arg <= BigInt(getMaxValue(size)) && arg >= BigInt(0)) {
            return ok(Number(arg));
          }
          return new TypeMismatchError(
            getType(size),
            getTypeString(d.buf[start])
          ).err();
        }
        if (arg <= getMaxValue(size) && arg >= 0) {
          return ok(arg);
        }
        return new TypeMismatchError(
          getType(size),
          getTypeString(d.buf[start])
        ).err();
      }
    )
  );
}

/**
 * A CBOR type that encodes unsigned integers between 0..=255
 */
export const u8: CborType<
  number,
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = createSmallIntType(8);

/**
 * A CBOR type that encodes unsigned integers between 0..=65_535
 */
export const u16: CborType<
  number,
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = createSmallIntType(16);

/**
 * A CBOR type that encodes unsigned integers between 0..=4_294_967_295n
 */
export const u32: CborType<
  number,
  number,
  OverflowError | UnderflowError,
  InvalidCborError | EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = createSmallIntType(32);
