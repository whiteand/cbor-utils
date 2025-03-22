import { ok, Result } from "resultra";
import { EndOfInputError, getEoiResult } from "../../EndOfInputError";
import { InvalidCborError } from "../../InvalidCborError";
import { OverflowError } from "../../OverflowError";
import { TypeMismatchError } from "../../TypeMismatchError";
import { CborType } from "../../base";
import { NUMBER_TYPE } from "../../constants";
import { getTypeString } from "../../getTypeString";
import { getType } from "../../marker";
import { readArg } from "../../readArg";
import { IDecoder, IEncoder } from "../../types";
import { done } from "../../utils/done";
import { writeTypeAndArg } from "../../writeTypeAndArg";

/**
 * A CBOR type that encodes and decodes unsigned integers
 * in range 0 to 2 ^ 128 - 1 (inclusively)
 *
 * Note: it allows encode u128 values. Which is not strictly
 * specified as a part of specification. But it was added
 * to allow encoding of large numbers. The specification
 * however envisions future extension of number type to u128.
 */
export const uint: CborType<
  number | bigint,
  number | bigint,
  OverflowError | TypeMismatchError,
  EndOfInputError | TypeMismatchError | InvalidCborError,
  [],
  []
> = CborType.builder()
  .encode(
    (
      v: number | bigint,
      e: IEncoder
    ): Result<void, OverflowError | TypeMismatchError> => {
      return typeof v !== "number" && typeof v !== "bigint"
        ? new TypeMismatchError("number | bigint", typeof v).err()
        : writeTypeAndArg(e, NUMBER_TYPE, v);
    }
  )
  .decode(
    (
      d: IDecoder
    ): Result<
      number | bigint,
      EndOfInputError | TypeMismatchError | InvalidCborError
    > => {
      if (done(d)) return getEoiResult();
      const marker = d.buf[d.ptr];
      if (getType(marker) !== NUMBER_TYPE) {
        return new TypeMismatchError("uint", getTypeString(marker)).err();
      }
      return readArg(d).andThen((v: number | bigint | null) =>
        v == null ? new InvalidCborError(marker, d.ptr).err() : ok(v)
      );
    }
  )
  .build();
