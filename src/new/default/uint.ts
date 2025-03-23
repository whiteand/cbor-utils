import { NUMBER_TYPE } from "../../constants";
import { getType } from "../../marker";
import { done } from "../../utils/done";
import { CborType } from "../cbor-type";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
} from "../error-codes";
import {
  InferDecoder,
  InputByteStream,
  OutputByteStream,
  SuccessResult,
  WithEncodeMethod,
} from "../types";
import { ArgReceiver, readArg } from "./readArg";
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
  isNumber(): boolean {
    return this.receiver.isNumber();
  }
  getArgumentReceiver(): ArgReceiver {
    return this.receiver;
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

const MAX_SIZE = {
  8: 0xff,
  16: 0xffff,
  32: 0xffffffff,
};
function createEncoder(size: 8 | 16 | 32) {
  class SmallIntEncoder extends SingleDataItemEncodable<
    number,
    SuccessResult | typeof OVERFLOW_ERROR_CODE
  > {
    static MAX_VALUE = MAX_SIZE[size];
    static MIN_VALUE = 0;
    static BITS = size;
    constructor(
      private readonly uintEncoder: WithEncodeMethod<
        number,
        SuccessResult | typeof OVERFLOW_ERROR_CODE
      >
    ) {
      super();
    }

    encode(
      value: number,
      encoder: OutputByteStream
    ): SuccessResult | typeof OVERFLOW_ERROR_CODE {
      if (value > SmallIntEncoder.MAX_VALUE) {
        return OVERFLOW_ERROR_CODE;
      }
      return this.uintEncoder.encode(value, encoder);
    }
    isNull(): boolean {
      return false;
    }
  }

  return new SmallIntEncoder(uint.encoder());
}

function createDecoder(size: 8 | 16 | 32) {
  class SmallIntDecoder extends SingleDataItemDecodable<
    number,
    SuccessResult | UintDecoderErrors
  > {
    static MAX_VALUE = MAX_SIZE[size];
    static MIN_VALUE = 0;
    static BITS = size;
    constructor(private readonly uintDecoder: InferDecoder<typeof uint>) {
      super();
    }
    decode(decoder: InputByteStream): SuccessResult | UintDecoderErrors {
      const res = this.uintDecoder.decode(decoder);
      if (res !== 0) return res;
      if (!this.uintDecoder.isNumber()) return TYPE_MISMATCH_ERROR_CODE;
      const value = this.uintDecoder.getValue();
      if (value > SmallIntDecoder.MAX_VALUE) return TYPE_MISMATCH_ERROR_CODE;
      return 0;
    }
    getValue(): number {
      return this.uintDecoder.getValue() as number;
    }
    nullValue(): number {
      return 0;
    }
    skip(decoder: InputByteStream): SuccessResult | UintDecoderErrors {
      return this.decode(decoder);
    }
  }
  return new SmallIntDecoder(uint.decoder());
}

export const u8 = new CborType(createEncoder(8), createDecoder(8));
export const u16 = new CborType(createEncoder(16), createDecoder(16));
export const u32 = new CborType(createEncoder(32), createDecoder(32));

class U64Decoder extends SingleDataItemDecodable<
  bigint,
  SuccessResult | UintDecoderErrors
> {
  decode(decoder: InputByteStream): SuccessResult | UintDecoderErrors {
    return this.uintDecoder.decode(decoder);
  }
  getValue(): bigint {
    return BigInt(this.uintDecoder.getValue());
  }
  nullValue(): bigint {
    return 0n;
  }
  skip(decoder: InputByteStream): SuccessResult | UintDecoderErrors {
    return this.uintDecoder.skip(decoder);
  }
  constructor(private readonly uintDecoder: InferDecoder<typeof uint>) {
    super();
  }
}

export const u64 = new CborType(uint.encoder(), new U64Decoder(uint.decoder()));
