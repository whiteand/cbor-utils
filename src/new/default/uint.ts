import { ok, Result } from "resultra";
import { EndOfInputError, getEoiResult } from "../../EndOfInputError";
import { InvalidCborError } from "../../InvalidCborError";
import { OverflowError } from "../../OverflowError";
import { TypeMismatchError } from "../../TypeMismatchError";
import { CborType } from "../cbor-type";
import { NUMBER_TYPE } from "../../constants";
import { getTypeString } from "../../getTypeString";
import { getType } from "../../marker";
import { IDecoder, IEncoder } from "../../types";
import { done } from "../../utils/done";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
} from "../error-codes";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { ArgReceiver, argReceiver, readArg } from "./readArg";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";
import { writeTypeAndArg } from "./writeTypeAndArg";

type Uint = number | bigint;

export type UintEncoderErrors = typeof OVERFLOW_ERROR_CODE;

/**
 * A CBOR type that encodes and decodes unsigned integers
 * in range 0 to 2 ^ 64 - 1 (inclusively)
 *
 */
class UintEncoder extends SingleDataItemEncodable<
  Uint,
  SuccessResult | UintEncoderErrors
> {
  encode(
    value: Uint,
    encoder: OutputByteStream
  ): SuccessResult | UintEncoderErrors {
    return writeTypeAndArg(encoder, NUMBER_TYPE, value);
  }
  isNull(): boolean {
    return false;
  }
}
const uintEncoder = new UintEncoder();
export type UintDecoderErrors =
  | typeof EOI_ERROR_CODE
  | typeof TYPE_MISMATCH_ERROR_CODE
  | typeof INVALID_CBOR_ERROR_CODE;

class UintDecoder extends SingleDataItemDecodable<
  Uint,
  SuccessResult | UintDecoderErrors
> {
  private receiver: ArgReceiver;
  constructor() {
    super();
    this.receiver = new ArgReceiver();
  }
  decode(d: InputByteStream): SuccessResult | UintDecoderErrors {
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];
    if (getType(marker) !== NUMBER_TYPE) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    let err = readArg(d, this.receiver);
    if (err !== 0) return err;
    if (this.receiver.isNull()) return INVALID_CBOR_ERROR_CODE;
    return 0;
  }
  getValue(): Uint {
    return this.receiver.get()!;
  }
  nullValue(): Uint {
    return 0;
  }
  skip(decoder: InputByteStream): SuccessResult | UintDecoderErrors {
    return this.decode(decoder);
  }
}

const uintDecoder = new UintDecoder();

export const uint = new CborType(uintEncoder, uintDecoder);
