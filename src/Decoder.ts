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

  done() {
    return this.ptr >= this.buf.length;
  }
}

export class Decoder extends BaseDecoder {
  constructor(bytes: Uint8Array, ptr: number = 0) {
    super(bytes, ptr);
  }

  decode<T, DE extends Error, DC>(
    ty: IDecodableType<T, DE, DC>,
    c: CtxParam<DC>,
  ): Result<T, DE> {
    return ty[decodeSymbol](this, c as DC);
  }
}

export class ThrowOnFailDecoder extends BaseDecoder {
  constructor(bytes: Uint8Array, ptr: number = 0) {
    super(bytes, ptr);
  }

  decode<T, DE extends Error, DC>(
    ty: IDecodableType<T, DE, DC>,
    c: CtxParam<DC>,
  ): T {
    return ty[decodeSymbol](this, c as DC).unwrap();
  }
}
