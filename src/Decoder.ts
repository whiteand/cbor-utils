import { Result } from "resultra";
import { decodeSymbol } from "./traits";
import {
  AnyDecodableType,
  CtxParam,
  DecodeContext,
  DecodeError,
  DecodedType,
  IDecodableType,
} from "./types";

abstract class BaseDecoder {
  buf: Uint8Array;
  ptr: number;
  constructor(bytes: Uint8Array, ptr: number = 0) {
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
  constructor(bytes: Uint8Array, ptr: number = 0) {
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
    ty: IDecodableType<T, DE, DC>,
    ...args: unknown extends DC ? [] : [DC]
  ): Result<T, DE> {
    return ty[decodeSymbol](this, (args as [DC])[0]);
  }
}

export class ThrowOnFailDecoder extends BaseDecoder {
  constructor(bytes: Uint8Array, ptr: number = 0) {
    super(bytes, ptr);
  }

  decode<T, DE extends Error, DC>(
    ty: IDecodableType<T, DE, DC>,
    ...args: unknown extends DC ? [] : [DC]
  ): T {
    return ty[decodeSymbol](this, (args as [DC])[0]).unwrap();
  }
}
