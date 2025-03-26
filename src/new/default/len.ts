import { getType } from "../../marker";
import { done } from "../../utils/done";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { MajorType } from "../major";
import {
  InputByteStream,
  OutputByteStream,
  SuccessResult,
  WithEncodeMethod,
} from "../types";
import { ArgReceiver, readArg } from "./readArg";
import { writeTypeAndArg } from "./writeTypeAndArg";

type TLen = number | bigint | null;
type LenEncoderResults =
  | SuccessResult
  | typeof UNDERFLOW_ERROR_CODE
  | typeof OVERFLOW_ERROR_CODE;

export class LenEncoder implements WithEncodeMethod<TLen, LenEncoderResults> {
  __inferT: TLen;
  __inferResults: LenEncoderResults;
  constructor(private readonly major: MajorType) {}
  encode(len: TLen, e: OutputByteStream) {
    return writeTypeAndArg(e, this.major, len);
  }
}

type LenDecoderResults =
  | SuccessResult
  | typeof INVALID_CBOR_ERROR_CODE
  | typeof TYPE_MISMATCH_ERROR_CODE
  | typeof EOI_ERROR_CODE;

export class LenDecoder extends ArgReceiver {
  __inferT: TLen;
  __inferResults: LenDecoderResults;
  constructor(private readonly major: MajorType) {
    super();
  }
  decode(d: InputByteStream): LenDecoderResults {
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];
    const t = getType(marker);
    if (t !== this.major) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    return readArg(d, this);
  }
  skip(d: InputByteStream): LenDecoderResults {
    return this.decode(d);
  }
  getValue(): TLen {
    switch (this.variant) {
      case 1:
        return this.numArg;
      case 2:
        return this.bigIntArg;
      case 3:
        return null;
    }
  }
}
