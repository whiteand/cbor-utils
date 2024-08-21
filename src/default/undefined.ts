import { ok } from "resultra";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { getVoidOk } from "../getVoidOk";
import { done } from "../utils/done";

/**
 * A type that encodes and decodes `undefined`
 */
export const undefinedType: CborType<
  undefined,
  undefined,
  UnexpectedValueError<undefined, undefined>,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = CborType.builder()
  .encode(function encodeUndefined(v: undefined, e) {
    if (v !== undefined) {
      return new UnexpectedValueError(undefined, v).err();
    }
    e.write(SPECIAL_TYPE_MASK | 23);
    return getVoidOk();
  })
  .decode(function decodeUndefined(d) {
    if (done(d)) {
      return getEoiResult();
    }
    if (d.buf[d.ptr] === (SPECIAL_TYPE_MASK | 23)) {
      d.ptr++;
      return ok(undefined);
    }
    return new TypeMismatchError(
      "undefined",
      getTypeString(d.buf[d.ptr])
    ).err();
  })
  .build();
