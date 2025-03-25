// import { ok, Result } from "resultra";
// import { DecodingError } from "../DecodingError";
// import { InvalidCborError } from "../InvalidCborError";
// import { OverflowError } from "../OverflowError";
// import { TypeMismatchError } from "../TypeMismatchError";
// import { CborType } from "../base";
// import { NEGATIVE_INT_TYPE } from "../constants";
// import { getTypeString } from "../getTypeString";
// import { getType } from "../marker";
// import { readArg } from "../readArg";
// import { writeTypeAndArg } from "../writeTypeAndArg";
// import { MAX_U128 } from "../limits";
// import { UnderflowError } from "../UnderflowError";
// import { getEoiResult } from "../EndOfInputError";
// import { done } from "../utils/done";
// import { IDecoder, IEncoder } from "../types";

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

// /**
//  * A type that encodes and decodes negative integers
//  * in range -(2 ^ 64) (inclusively) to -1 (inclusively)
//  */
// export const nint: CborType<
//   number | bigint,
//   number | bigint,
//   OverflowError | TypeMismatchError,
//   DecodingError,
//   [],
//   []
// > = CborType.builder()
//   .encode((v: number | bigint, e: IEncoder) => {

//   })
//   .decode((d: IDecoder): Result<number | bigint, DecodingError> => {
//     if (done(d)) return getEoiResult();
//     const marker = d.buf[d.ptr];
//     if (getType(marker) !== NEGATIVE_INT_TYPE) {
//       return new TypeMismatchError("negative-int", getTypeString(marker)).err();
//     }
//     const argRes = readArg(d);
//     if (!argRes.ok()) {
//       return argRes;
//     }
//     const v = argRes.value;
//     if (v == null) {
//       return new InvalidCborError(marker, d.ptr).err();
//     }
//     if (typeof v === "bigint") {
//       return ok(-1n - v);
//     }
//     return ok(-1 - v);
//   })
//   .build();

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
  isNull(value: number | bigint): boolean {
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
      return 0;
    } else {
      const value = this.receiver.getBigInt();
      this.receiver.setBigInt(-1n - value);
      return 0;
    }
  }
  isNumber(): boolean {
    return this.receiver.isNumber();
  }
  getArgumentReceiver(): ArgReceiver {
    return this.receiver;
  }
  getValue(): number | bigint {
    return this.receiver.get()!;
  }
  nullValue(): number | bigint {
    return -1;
  }
  skip(decoder: InputByteStream): NegativeIntDecoderResults {
    return this.decode(decoder);
  }
}
const nintDecoder = new NegativeIntDecoder();

export const nint = new CborType(nintEncoder, nintDecoder);
