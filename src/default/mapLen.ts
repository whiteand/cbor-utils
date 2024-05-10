import { Result } from "resultra";
import { CborType } from "../base";
import { MAP_TYPE } from "../constants";
import { IDecoder, IEncoder } from "../types";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { OverflowError } from "../OverflowError";
import { getType } from "../marker";
import { TypeMismatchError } from "../TypeMismatchError";
import { getTypeString } from "../getTypeString";
import { readArg } from "../readArg";
import { EOI_ERR } from "../EndOfInputError";
import { done } from "../utils/done";

export const mapLen = CborType.from(
  (v: bigint | number | null, e: IEncoder): Result<void, OverflowError> => {
    return writeTypeAndArg(e, MAP_TYPE, v);
  },
  (d: IDecoder) => {
    if (done(d)) return EOI_ERR;
    const m = d.buf[d.ptr];
    if (getType(m) !== MAP_TYPE) {
      return new TypeMismatchError("map", getTypeString(m)).err();
    }
    return readArg(d);
  }
);
