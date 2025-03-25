import { NEGATIVE_INT_TYPE } from "../../constants";
import { MAX_U64 } from "../../limits";
import { getType } from "../../marker";
import { done } from "../../utils/done";
import { CborType } from "../cbor-type";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { ArgReceiver, readArg } from "./readArg";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";
import { writeTypeAndArg } from "./writeTypeAndArg";

export type NegativeIntEncoderResults =
  | SuccessResult
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

class NegativeIntEncoder extends SingleDataItemEncodable<
  number | bigint,
  NegativeIntEncoderResults
> {
  encode(
    value: number | bigint,
    encoder: OutputByteStream
  ): NegativeIntEncoderResults {
    if (typeof value === "number") {
      if (value >= 0) {
        return OVERFLOW_ERROR_CODE;
      }
      if (value < -1 - Number(MAX_U64)) {
        return UNDERFLOW_ERROR_CODE;
      }
      if (BigInt(value) < -1n - MAX_U64) {
        return UNDERFLOW_ERROR_CODE;
      }
    } else if (typeof value === "bigint") {
      if (value >= 0n) return OVERFLOW_ERROR_CODE;
      if (value < -1n - MAX_U64) {
        return UNDERFLOW_ERROR_CODE;
      }
    }
    return writeTypeAndArg(
      encoder,
      NEGATIVE_INT_TYPE,
      typeof value === "bigint" ? -1n - value : -1 - value
    );
  }
  isNull(): boolean {
    return false;
  }
}

const nintEncoder = new NegativeIntEncoder();

export type NegativeIntDecoderResults =
  | SuccessResult
  | typeof EOI_ERROR_CODE
  | typeof TYPE_MISMATCH_ERROR_CODE
  | typeof INVALID_CBOR_ERROR_CODE;

class NegativeIntDecoder extends SingleDataItemDecodable<
  number | bigint,
  NegativeIntDecoderResults
> {
  private receiver: ArgReceiver;

  constructor() {
    super();
    this.receiver = new ArgReceiver();
  }
  decode(d: InputByteStream): NegativeIntDecoderResults {
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];
    if (getType(marker) !== NEGATIVE_INT_TYPE) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    const argRes = readArg(d, this.receiver);
    if (argRes !== 0) return argRes;
    if (this.receiver.isNull()) return INVALID_CBOR_ERROR_CODE;
    if (this.receiver.isNumber()) {
      const value = this.receiver.getNumber();
      this.receiver.setNum(-1 - value);
    } else {
      const value = this.receiver.getBigInt();
      this.receiver.setBigInt(-1n - value);
    }
    return 0;
  }
  getValue(): number | bigint {
    return this.receiver.get()!;
  }
  nullValue(): number | bigint {
    return -1;
  }
  hasNullValue(): boolean {
    return false;
  }
  skip(decoder: InputByteStream): NegativeIntDecoderResults {
    return this.decode(decoder);
  }
}
const nintDecoder = new NegativeIntDecoder();

export const nint = new CborType(nintEncoder, nintDecoder);
