import { NUMBER_TYPE } from "../../constants";
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
import {
  InferDecoder,
  InputByteStream,
  OutputByteStream,
  SuccessResult,
  WithEncodeMethod,
} from "../types";
import { MarkerDecoder, MarkerEncoder } from "./marker";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";

type Uint = number | bigint;

export type UintEncoderErrors =
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

/**
 * A CBOR type that encodes and decodes unsigned integers
 * in range 0 to 2 ^ 64 - 1 (inclusively)
 *
 */
class UintEncoder extends SingleDataItemEncodable<
  Uint,
  SuccessResult | UintEncoderErrors
> {
  private markerEncoder: MarkerEncoder;
  constructor() {
    super();
    this.markerEncoder = new MarkerEncoder(NUMBER_TYPE);
  }

  encode(
    value: Uint,
    encoder: OutputByteStream
  ): SuccessResult | UintEncoderErrors {
    return this.markerEncoder.encode(value, encoder);
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
  private lenDecoder: MarkerDecoder;
  constructor() {
    super();
    this.lenDecoder = new MarkerDecoder(NUMBER_TYPE);
  }
  decode(d: InputByteStream): SuccessResult | UintDecoderErrors {
    const res = this.lenDecoder.decode(d);

    if (res !== 0) return res;
    if (this.lenDecoder.isNull()) return INVALID_CBOR_ERROR_CODE;
    return 0;
  }
  isNumber(): boolean {
    return this.lenDecoder.isNumber();
  }
  getLenDecoder(): MarkerDecoder {
    return this.lenDecoder;
  }
  getValue(): Uint {
    return this.lenDecoder.isNumber()
      ? this.lenDecoder.getNumber()
      : this.lenDecoder.getBigInt();
  }
  nullValue(): Uint {
    return 0;
  }
  hasNullValue(): boolean {
    return false;
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
    SuccessResult | UintEncoderErrors
  > {
    static MAX_VALUE = MAX_SIZE[size];
    static MIN_VALUE = 0;
    static BITS = size;
    constructor(
      private readonly uintEncoder: WithEncodeMethod<
        number,
        SuccessResult | UintEncoderErrors
      >
    ) {
      super();
    }

    encode(
      value: number,
      encoder: OutputByteStream
    ): SuccessResult | UintEncoderErrors {
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

export type SmallIntDecoderErrors =
  | UintDecoderErrors
  | typeof OVERFLOW_ERROR_CODE;

function createDecoder(size: 8 | 16 | 32) {
  class SmallIntDecoder extends SingleDataItemDecodable<
    number,
    SuccessResult | SmallIntDecoderErrors
  > {
    static MAX_VALUE = MAX_SIZE[size];
    static MIN_VALUE = 0;
    static BITS = size;
    constructor(private readonly uintDecoder: InferDecoder<typeof uint>) {
      super();
    }
    decode(decoder: InputByteStream): SuccessResult | SmallIntDecoderErrors {
      const res = this.uintDecoder.decode(decoder);
      if (res !== 0) return res;
      if (!this.uintDecoder.isNumber()) return TYPE_MISMATCH_ERROR_CODE;
      const value = this.uintDecoder.getValue();
      if (value > SmallIntDecoder.MAX_VALUE) return OVERFLOW_ERROR_CODE;
      return 0;
    }
    getValue(): number {
      return this.uintDecoder.getValue() as number;
    }
    nullValue(): number {
      return 0;
    }
    skip(decoder: InputByteStream): SuccessResult | SmallIntDecoderErrors {
      return this.decode(decoder);
    }
    hasNullValue(): boolean {
      return false;
    }
  }
  return new SmallIntDecoder(uint.decoder());
}

export const u8 = new CborType(createEncoder(8), createDecoder(8));
export const u16 = new CborType(createEncoder(16), createDecoder(16));
export const u32 = new CborType(createEncoder(32), createDecoder(32));
export const u64 = new CborType(uint.encoder(), uint.decoder().map(BigInt));
