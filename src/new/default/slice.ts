import { BREAK_BYTE } from "../../constants";
import { getType } from "../../marker";
import { done } from "../../utils/done";
import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { MajorType } from "../major";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";
import { ArgReceiver, readArg } from "./readArg";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";
import { writeTypeAndArg } from "./writeTypeAndArg";

export type SliceEncoderResults =
  | SuccessResult
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

export class SliceEncoder extends SingleDataItemEncodable<
  Uint8Array,
  SliceEncoderResults
> {
  constructor(public readonly major: MajorType) {
    super();
  }

  encode(
    value: Uint8Array<ArrayBufferLike>,
    encoder: OutputByteStream
  ): SliceEncoderResults {
    const res = writeTypeAndArg(encoder, this.major, value.length);
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
  private receiver: ArgReceiver;
  private result: Uint8Array;
  private chunks: Uint8Array[];
  constructor(private readonly major: MajorType) {
    super();
    this.receiver = new ArgReceiver();
    this.chunks = [];
  }
  decode(d: InputByteStream): SliceDecoderResults {
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];

    if (getType(marker) !== this.major) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    const res = readArg(d, this.receiver);
    if (res !== 0) return res;
    if (this.receiver.isNull()) {
      return this.decodeIndefiniteSlice(d);
    } else {
      return this.readDefiniteSlice(d, Number(this.receiver.get()));
    }
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
    if (done(d)) return EOI_ERROR_CODE;
    const marker = d.buf[d.ptr];

    if (getType(marker) !== this.major) {
      return TYPE_MISMATCH_ERROR_CODE;
    }
    const res = readArg(d, this.receiver);
    if (res !== 0) return res;
    if (this.receiver.isNull()) {
      return this.skipIndefiniteSlice(d);
    } else {
      return this.skipDefiniteSlice(d, Number(this.receiver.get()));
    }
  }
}
