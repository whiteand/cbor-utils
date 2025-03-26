import { BREAK_BYTE } from "../../constants";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { MajorType } from "../major";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { LenDecoder, LenEncoder } from "./len";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";

export type SliceEncoderResults =
  | SuccessResult
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

export class SliceEncoder extends SingleDataItemEncodable<
  Uint8Array,
  SliceEncoderResults
> {
  lenEncoder: LenEncoder;
  constructor(public readonly major: MajorType) {
    super();
    this.lenEncoder = new LenEncoder(major);
  }

  encode(
    value: Uint8Array<ArrayBufferLike>,
    encoder: OutputByteStream
  ): SliceEncoderResults {
    const res = this.lenEncoder.encode(value.length, encoder);

    if (res !== 0) return res;

    encoder.writeSlice(value);

    return 0;
  }
  isNull(): boolean {
    return false;
  }
}
export type SliceDecoderResults =
  | SuccessResult
  | typeof EOI_ERROR_CODE
  | typeof INVALID_CBOR_ERROR_CODE
  | typeof TYPE_MISMATCH_ERROR_CODE;
export class SliceDecoder extends SingleDataItemDecodable<
  Uint8Array,
  SliceDecoderResults
> {
  private result: Uint8Array;
  private chunks: Uint8Array[];
  private lenDecoder: LenDecoder;
  constructor(private readonly major: MajorType) {
    super();
    this.chunks = [];
    this.lenDecoder = new LenDecoder(major);
  }
  decode(d: InputByteStream): SliceDecoderResults {
    const res = this.lenDecoder.decode(d);

    return res !== 0
      ? res
      : this.lenDecoder.isNull()
      ? this.decodeIndefiniteSlice(d)
      : this.readDefiniteSlice(
          d,
          this.lenDecoder.isNumber()
            ? this.lenDecoder.getNumber()
            : Number(this.lenDecoder.getBigInt())
        );
  }
  readDefiniteSlice(d: InputByteStream, length: number): SliceDecoderResults {
    if (d.ptr + length > d.buf.length) {
      return EOI_ERROR_CODE;
    }
    this.result = d.buf.slice(d.ptr, d.ptr + length);
    d.ptr += length;
    return 0;
  }
  decodeIndefiniteSlice(d: InputByteStream): SliceDecoderResults {
    const chunks = this.chunks;
    const initialLength = this.chunks.length;
    let total = 0;
    while (true) {
      if (d.ptr >= d.buf.length) {
        return EOI_ERROR_CODE;
      }
      const m = d.buf[d.ptr];
      if (m === BREAK_BYTE) {
        d.ptr++;
        break;
      }
      const res = this.decode(d);
      if (res !== 0) {
        this.chunks.length = initialLength;
        return res;
      }
      const bs = this.getValue();
      total += bs.length;
      chunks.push(bs);
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (let i = initialLength; i < chunks.length; i++) {
      result.set(chunks[i], offset);
      offset += chunks[i].length;
    }
    this.result = result;
    this.chunks.length = initialLength;
    return 0;
  }
  skipDefiniteSlice(d: InputByteStream, length: number): SliceDecoderResults {
    if (d.ptr + length > d.buf.length) {
      return EOI_ERROR_CODE;
    }
    d.ptr += length;
    return 0;
  }
  skipIndefiniteSlice(d: InputByteStream): SliceDecoderResults {
    while (d.ptr < d.buf.length) {
      const m = d.buf[d.ptr];
      if (m === BREAK_BYTE) {
        d.ptr++;
        break;
      }
      const res = this.skip(d);
      if (res !== 0) {
        return res;
      }
    }
    return 0;
  }
  getValue(): Uint8Array<ArrayBufferLike> {
    return this.result;
  }
  nullValue(): Uint8Array<ArrayBufferLike> {
    return new Uint8Array();
  }
  hasNullValue(): boolean {
    return false;
  }
  skip(d: InputByteStream): SliceDecoderResults {
    const res = this.lenDecoder.decode(d);

    return res !== 0
      ? res
      : this.lenDecoder.isNull()
      ? this.skipIndefiniteSlice(d)
      : this.skipDefiniteSlice(
          d,
          this.lenDecoder.isNumber()
            ? this.lenDecoder.getNumber()
            : Number(this.lenDecoder.getBigInt())
        );
  }
}
