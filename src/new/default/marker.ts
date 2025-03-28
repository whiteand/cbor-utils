import { getType } from "../../marker";
import { useContext } from "../Context";
import { done } from "../done";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { MajorType } from "../major";
import { RemainingDataItemsContext } from "../remainingDataItems";
import {
  InputByteStream,
  OutputByteStream,
  SuccessResult,
  WithEncodeMethod,
} from "../types";
import { ArgReceiver, readArg } from "./readArg";
import { writeTypeAndArg } from "./writeTypeAndArg";

type MarkerInfo = number | bigint | null;
export type MarkerEncoderResults =
  | SuccessResult
  | typeof UNDERFLOW_ERROR_CODE
  | typeof OVERFLOW_ERROR_CODE;

export class MarkerEncoder
  implements WithEncodeMethod<MarkerInfo, MarkerEncoderResults>
{
  __inferT!: MarkerInfo;
  __inferResults!: MarkerEncoderResults;
  constructor(private readonly major: MajorType) {}
  encode(markerInfo: MarkerInfo, e: OutputByteStream): MarkerEncoderResults {
    return writeTypeAndArg(e, this.major, markerInfo);
  }
}

export type MarkerDecoderResults =
  | SuccessResult
  | typeof INVALID_CBOR_ERROR_CODE
  | typeof TYPE_MISMATCH_ERROR_CODE
  | typeof EOI_ERROR_CODE;

export class MarkerDecoder extends ArgReceiver {
  __inferT!: MarkerInfo;
  __inferResults!: MarkerDecoderResults;
  constructor(private readonly major: MajorType) {
    super();
  }
  decode(d: InputByteStream): MarkerDecoderResults {
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];
    const t = getType(marker);
    if (t !== this.major) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    return readArg(d, this);
  }
  skip(d: InputByteStream): MarkerDecoderResults {
    return this.decode(d);
  }
  getValue(): MarkerInfo {
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
