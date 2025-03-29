import { BREAK_BYTE } from "../../constants";
import { done } from "../done";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { MajorType } from "../major";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { MarkerDecoder, MarkerEncoder } from "./marker";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";

export type SliceEncoderResults =
  | SuccessResult
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

export class SliceEncoder extends SingleDataItemEncodable<
  Uint8Array,
  SliceEncoderResults
> {
  markerEncoder: MarkerEncoder;
  constructor(public readonly major: MajorType) {
    super();
    this.markerEncoder = new MarkerEncoder(major);
  }

  encode(
    value: Uint8Array<ArrayBufferLike>,
    encoder: OutputByteStream
  ): SliceEncoderResults {
    const res = this.markerEncoder.encode(value.length, encoder);

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
  private chunks: Uint8Array[];
  private markerDecoder: MarkerDecoder;
  constructor(major: MajorType) {
    super();
    this.markerDecoder = new MarkerDecoder(major);
    this.chunks = [];
  }
  protected decodeItem(d: InputByteStream): SliceDecoderResults {
    let res = this.markerDecoder.decode(d);
    if (res !== 0) return res;
    if (this.markerDecoder.isNull()) {
      return this.decodeIndefiniteSlice(d);
    }
    const len = this.markerDecoder.isNumber()
      ? this.markerDecoder.getNumber()
      : Number(this.markerDecoder.getBigInt());

    return this.decodeDefiniteSlice(d, len);
  }
  private decodeDefiniteSlice(
    d: InputByteStream,
    length: number
  ): SliceDecoderResults {
    if (d.ptr + length > d.buf.length) {
      return EOI_ERROR_CODE;
    }
    const result = d.buf.slice(d.ptr, d.ptr + length);
    d.ptr += length;
    this.values.push(result);
    return 0;
  }
  private decodeIndefiniteSlice(d: InputByteStream): SliceDecoderResults {
    const chunks = this.chunks;
    const initialLength = this.chunks.length;
    let total = 0;
    while (true) {
      if (done(d)) {
        return EOI_ERROR_CODE;
      }
      const m = d.buf[d.ptr];
      if (m === BREAK_BYTE) {
        d.ptr++;
        break;
      }
      const res = this.decodeItem(d);
      if (res !== 0) {
        this.chunks.length = initialLength;
        return res;
      }
      const bs = this.values.pop()!;
      total += bs.length;
      chunks.push(bs);
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (let i = initialLength; i < chunks.length; i++) {
      result.set(chunks[i], offset);
      offset += chunks[i].length;
    }
    this.values.push(result);
    this.chunks.length = initialLength;
    return 0;
  }
  private skipDefiniteSlice(
    d: InputByteStream,
    length: number
  ): SliceDecoderResults {
    if (d.ptr + length > d.buf.length) {
      return EOI_ERROR_CODE;
    }
    d.ptr += length;
    return 0;
  }
  private skipIndefiniteSlice(d: InputByteStream): SliceDecoderResults {
    while (d.ptr < d.buf.length) {
      const m = d.buf[d.ptr];
      if (m === BREAK_BYTE) {
        d.ptr++;
        break;
      }
      const res = this.skipItem(d);
      if (res !== 0) {
        return res;
      }
    }
    return 0;
  }

  nullValue(): Uint8Array<ArrayBufferLike> {
    return new Uint8Array();
  }
  hasNullValue(): boolean {
    return false;
  }
  protected skipItem(d: InputByteStream): SliceDecoderResults {
    const res = this.markerDecoder.decode(d);

    return res !== 0
      ? res
      : this.markerDecoder.isNull()
      ? this.skipIndefiniteSlice(d)
      : this.skipDefiniteSlice(
          d,
          this.markerDecoder.isNumber()
            ? this.markerDecoder.getNumber()
            : Number(this.markerDecoder.getBigInt())
        );
  }
}
