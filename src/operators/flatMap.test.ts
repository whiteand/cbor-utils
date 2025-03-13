import { describe } from "vitest";
import { u32 } from "../default/smallInts";
import { flatMap } from "./flatMap";
import { it } from "vitest";
import { err } from "resultra";
import { ok } from "resultra";
import { encode } from "../encode";
import { expect } from "vitest";
import { CborType } from "../base";
import { Result } from "resultra";
import { EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnderflowError } from "../UnderflowError";
import { ThrowOnFailEncoder } from "../Encoder";

class InvalidEnumIndexError extends Error {
  constructor(
    public readonly index: number,
    public readonly validIndices: number[]
  ) {
    super(
      `Invalid enum index: ${index}. Valid indices: [${validIndices.join(
        ", "
      )}]`
    );
  }
}
class InvalidEnumValueError extends Error {
  constructor(
    public readonly value: string,
    public readonly validValues: string[]
  ) {
    super(
      `Invalid enum value: ${value}. Valid indices: ${JSON.stringify(
        validValues
      )}`
    );
  }
}

function indexOnlyEnumCbor<const T extends Readonly<Record<string, number>>>(
  valueToIndex: T
): CborType<
  keyof T,
  keyof T,
  OverflowError | UnderflowError | Error,
  | InvalidCborError
  | EndOfInputError
  | TypeMismatchError
  | InvalidEnumIndexError,
  unknown,
  unknown
> {
  const indexToValue = Object.fromEntries(
    Object.entries(valueToIndex).map((e) => [e[1], e[0]])
  );
  const validIndices = Object.values(valueToIndex);
  const validValues = Object.keys(valueToIndex);

  return u32.pipe(
    flatMap(
      (value: keyof T) => {
        const ind = valueToIndex[value];
        return ind == null
          ? err(new InvalidEnumValueError(String(value), validValues))
          : ok(ind);
      },
      (index: number): Result<keyof T, InvalidEnumIndexError> => {
        const status = indexToValue[index as keyof typeof indexToValue];
        return status == null
          ? err(new InvalidEnumIndexError(index, validIndices))
          : ok(status as keyof T);
      }
    )
  );
}

describe("flatMap", () => {
  it("should work", () => {
    const ty = indexOnlyEnumCbor({
      mchain: 0,
    });

    const e = encode((e: ThrowOnFailEncoder) => ty.encode("mchain", e).unwrap());
    expect(e).toEqual(new Uint8Array([0x00]));
  });
});
