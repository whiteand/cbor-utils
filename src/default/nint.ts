import { ok, Result } from "resultra";
import { CborType } from "../base";
import { NEGATIVE_INT_TYPE } from "../constants";
import { DecodingError } from "../DecodingError";
import { getEoiResult } from "../EndOfInputError";
import { getTypeString } from "../getTypeString";
import { InvalidCborError } from "../InvalidCborError";
import { MAX_U64 } from "../limits";
import { getType } from "../marker";
import { OverflowError } from "../OverflowError";
import { readArg } from "../readArg";
import { TypeMismatchError } from "../TypeMismatchError";
import { IDecoder, IEncoder } from "../types";
import { UnderflowError } from "../UnderflowError";
import { done } from "../utils/done";
import { writeTypeAndArg } from "../writeTypeAndArg";

/**
 * A type that encodes and decodes negative integers
 * in range -(2 ^ 64) (inclusively) to -1 (inclusively)
 */
export const nint: CborType<
  number | bigint,
  number | bigint,
  OverflowError | TypeMismatchError,
  DecodingError,
  [],
  []
> = CborType.builder()
  .encode((v: number | bigint, e: IEncoder) => {
    if (typeof v === "number") {
      if (!Number.isInteger(v) || !Number.isFinite(v)) {
        return new TypeMismatchError("negative-int", "f64").err();
      }
      if (v >= 0) {
        return new OverflowError(-1, v).err();
      }
      if (BigInt(v) < -1n - MAX_U64) {
        return new UnderflowError(-1n - MAX_U64, v).err();
      }
    } else if (typeof v === "bigint") {
      if (v >= 0n) return new OverflowError(-1n, v).err();
      if (v < -1n - MAX_U64) {
        return new UnderflowError(-1n - MAX_U64, v).err();
      }
    } else {
      return new TypeMismatchError("number | bigint", typeof v).err();
    }
    return writeTypeAndArg(
      e,
      NEGATIVE_INT_TYPE,
      typeof v === "bigint" ? -1n - v : -1 - v
    );
  })
  .decode((d: IDecoder): Result<number | bigint, DecodingError> => {
    if (done(d)) return getEoiResult();
    const marker = d.buf[d.ptr];
    if (getType(marker) !== NEGATIVE_INT_TYPE) {
      return new TypeMismatchError("negative-int", getTypeString(marker)).err();
    }
    const argRes = readArg(d);
    if (!argRes.ok()) {
      return argRes;
    }
    const v = argRes.value;
    if (v == null) {
      return new InvalidCborError(marker, d.ptr).err();
    }
    if (typeof v === "bigint") {
      return ok(-1n - v);
    }
    return ok(-1 - v);
  })
  .build();
