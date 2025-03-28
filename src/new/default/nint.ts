import { NEGATIVE_INT_TYPE } from "../../constants";
import { MAX_U64 } from "../../limits";
import { CborType } from "../cbor-type";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { MarkerDecoder, MarkerEncoder } from "./marker";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";

export type NegativeIntEncoderResults =
  | SuccessResult
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

class NegativeIntEncoder extends SingleDataItemEncodable<
  number | bigint,
  NegativeIntEncoderResults
> {
  private markerEncoder: MarkerEncoder;
  constructor() {
    super();
    this.markerEncoder = new MarkerEncoder(NEGATIVE_INT_TYPE);
  }
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
    return this.markerEncoder.encode(
      typeof value === "bigint" ? -1n - value : -1 - value,
      encoder
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
  private markerDecoder: MarkerDecoder;

  constructor() {
    super();
    this.markerDecoder = new MarkerDecoder(NEGATIVE_INT_TYPE);
  }
  protected decodeItem(d: InputByteStream): NegativeIntDecoderResults {
    const argRes = this.markerDecoder.decode(d);
    if (argRes !== 0) return argRes;
    if (this.markerDecoder.isNull()) return INVALID_CBOR_ERROR_CODE;
    if (this.markerDecoder.isNumber()) {
      const value = this.markerDecoder.getNumber();
      this.markerDecoder.setNum(-1 - value);
    } else {
      const value = this.markerDecoder.getBigInt();
      this.markerDecoder.setBigInt(-1n - value);
    }
    return 0;
  }
  getValue(): number | bigint {
    return this.markerDecoder.isNumber()
      ? this.markerDecoder.getNumber()
      : this.markerDecoder.getBigInt();
  }
  nullValue(): number | bigint {
    return -1;
  }
  hasNullValue(): boolean {
    return false;
  }
  protected skipItem(decoder: InputByteStream): NegativeIntDecoderResults {
    return this.decodeItem(decoder);
  }
}
const nintDecoder = new NegativeIntDecoder();

export const nint = new CborType(nintEncoder, nintDecoder);
