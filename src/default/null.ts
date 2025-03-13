import { ok, Result } from "resultra";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { NULL_BYTE } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { getVoidOk } from "../getVoidOk";
import { done } from "../utils/done";
import { IDecoder, IEncoder } from "../types";

/**
 * A type that encodes and decodes `null`
 */
export const nullType: CborType<
  null,
  null,
  UnexpectedValueError<null, null>,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = CborType.builder()
  .encode((v: null, e: IEncoder) =>
    v !== null
      ? new UnexpectedValueError(null, v).err()
      : (e.write(NULL_BYTE), getVoidOk())
  )
  .decode((d: IDecoder): Result<null, EndOfInputError | TypeMismatchError> => {
    if (done(d)) {
      return getEoiResult();
    }
    if (d.buf[d.ptr] === NULL_BYTE) {
      d.ptr++;
      return ok(null);
    }
    return new TypeMismatchError("null", getTypeString(d.buf[d.ptr])).err();
  })
  .nullable(true)
  .build();
