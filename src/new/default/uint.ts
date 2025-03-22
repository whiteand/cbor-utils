import { ok, Result } from "resultra";
import { EndOfInputError, getEoiResult } from "../../EndOfInputError";
import { InvalidCborError } from "../../InvalidCborError";
import { OverflowError } from "../../OverflowError";
import { TypeMismatchError } from "../../TypeMismatchError";
import { CborType } from "../../base";
import { NUMBER_TYPE } from "../../constants";
import { getTypeString } from "../../getTypeString";
import { getType } from "../../marker";
import { IDecoder, IEncoder } from "../../types";
import { done } from "../../utils/done";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
} from "../error-codes";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { argReceiver, readArg } from "./readArg";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";
import { writeTypeAndArg } from "./writeTypeAndArg";

type Uint = number | bigint;

export type UintEncoderErrors = typeof OVERFLOW_ERROR_CODE;

/**
 * A CBOR type that encodes and decodes unsigned integers
 * in range 0 to 2 ^ 64 - 1 (inclusively)
 *
 */
class UintEncoder extends SingleDataItemEncodable<
  Uint,
  SuccessResult | UintEncoderErrors
> {
  encode(
    value: Uint,
    encoder: OutputByteStream
  ): SuccessResult | UintEncoderErrors {
    return writeTypeAndArg(encoder, NUMBER_TYPE, value);
  }
  isNull(): boolean {
    return false;
  }
}
const uintEncoder = new UintEncoder();
export type UintDecoderErrors =
  | typeof EOI_ERROR_CODE
  | typeof TYPE_MISMATCH_ERROR_CODE
  | typeof INVALID_CBOR_ERROR_CODE;

class UintDecoder extends SingleDataItemDecodable<
  Uint,
  SuccessResult | UintDecoderErrors
> {
  value: Uint;
  constructor() {
    super();
    this.value = 0;
  }
  decode(d: InputByteStream): SuccessResult | UintDecoderErrors {
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];
    if (getType(marker) !== NUMBER_TYPE) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    let err = readArg(d, argReceiver);
    if (err !== 0) return err;
    if (argReceiver.isNull()) return INVALID_CBOR_ERROR_CODE;
    const v = argReceiver.get() as Uint;
    this.value = v;
    return 0;
  }
  getValue(): Uint {
    return this.value;
  }
  nullValue(): Uint {
    return 0;
  }
  skip(decoder: InputByteStream): SuccessResult | UintDecoderErrors {
    const res = this.decode(decoder);
    this.value = 0;
    return res;
  }
  byteLength(decoder: InputByteStream): number {
    const start = decoder.ptr;
    let res = this.decode(decoder);
    if (res !== 0) {
      return;
    }
    this.decode();
    throw new Error("Method not implemented.");
  }
}

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
