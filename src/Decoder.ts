import { Result } from "resultra";
import { IDecodable, IDecoder, NotImportant } from "./types";

/**
 * Basic class which defines buffer and pointer into the buffer.
 */
class BaseDecoder {
  buf: Uint8Array;
  ptr: number;
  /**
   * @param bytes bytes that should be decoded
   * @param ptr pointer to the initial position in the bytes, where CBOR is placed
   */
  constructor(bytes: Uint8Array, ptr = 0) {
    this.buf = bytes;
    this.ptr = ptr;
  }

  done(): boolean {
    return this.ptr >= this.buf.length;
  }
}

/**
 * Decoder class is just a pair of bytes, that contain CBOR
 * and a pointer to the current position in the bytes.
 *
 * Cbor Types mutate this instance during encoding and decoding.
 */
export class Decoder extends BaseDecoder {
  /**
   * @param bytes Bytes that contain CBOR
   * @param ptr A pointer to the current position in the bytes
   */
  constructor(bytes: Uint8Array, ptr = 0) {
    super(bytes, ptr);
  }

  /**
   * Calls CborType decode method
   * with itself and optional context
   *
   * @param ty
   * @param args
   * @returns
   */
  decode<T, DE extends Error, DC>(
    ty: IDecodable<T, DE, DC>,
    ...args: unknown extends DC ? [] | [DC] : [DC]
  ): Result<T, DE>;
  decode(ty: NotImportant, ctx: unknown) {
    return ty.decode(this, ctx);
  }

  /**
   * @param b bytes or other decoder
   * @param ptr optional ptr to start decoding from
   * @returns new decoder instance that will start decoding from ptr
   */
  static from(b: Uint8Array | IDecoder, ptr = 0): Decoder {
    if (b instanceof Uint8Array) {
      return new Decoder(b, ptr);
    }
    if (b instanceof Decoder) {
      return b;
    }
    return new Decoder(b.buf, ptr ?? b.ptr);
  }
}

export class ThrowOnFailDecoder extends BaseDecoder {
  constructor(bytes: Uint8Array, ptr = 0) {
    super(bytes, ptr);
  }

  decode<T, DE extends Error, DC>(
    ty: IDecodable<T, DE, DC>,
    ...args: unknown extends DC ? [] | [DC] : [DC]
  ): T;
  decode(ty: NotImportant, ctx: unknown) {
    return ty.decode(this, ctx).unwrap();
  }
}
