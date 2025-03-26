import { MajorType } from "../major";
import {
  InputByteStream,
  OutputByteStream,
  SuccessResult,
  WithDecodeAndGetValue,
  WithEncodeMethod,
} from "../types";
import {
  UNDERFLOW_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  EOI_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
} from "../error-codes";
import { writeTypeAndArg } from "./writeTypeAndArg";
import { readArg, ArgReceiver } from "./readArg";
import { done } from "../../utils/done";
import { getType } from "../../marker";

type TLen = number | bigint | null;
type LenEncoderResults =
  | SuccessResult
  | typeof UNDERFLOW_ERROR_CODE
  | typeof OVERFLOW_ERROR_CODE;

export class LenEncoder implements WithEncodeMethod<TLen, LenEncoderResults> {
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
}
