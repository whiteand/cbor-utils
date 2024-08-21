import { ok, Result } from "resultra";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { CborType } from "../base";
import { done } from "../utils/done";
import { getVoidOk } from "../getVoidOk";
import { getInfo } from "../marker";

/**
 * A CBOR type that encodes booleans
 */
export const bool: CborType<
  boolean,
  boolean,
  TypeMismatchError,
  EndOfInputError | TypeMismatchError,
  unknown,
  unknown
> = CborType.builder()
  .encode((v: boolean, e) => {
    if (typeof v !== "boolean") {
      return new TypeMismatchError("boolean", String(v)).err();
    }

    e.write(SPECIAL_TYPE_MASK | (v ? 21 : 20));
    return getVoidOk();
  })
  .decode((d): Result<boolean, EndOfInputError | TypeMismatchError> => {
    if (done(d)) {
      return getEoiResult();
    }
    const m = d.buf[d.ptr++];
    switch (getInfo(m)) {
      case 20:
        return ok(false);
      case 21:
        return ok(true);
      default:
        d.ptr--;
        return new TypeMismatchError(
          "boolean",
          getTypeString(d.buf[d.ptr])
        ).err();
    }
  })
  .build();
