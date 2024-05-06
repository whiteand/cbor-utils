import { Result } from "resultra";
import { decodeSymbol } from "./traits";
import {
  AnyDecodableType,
  CtxParam,
  DecodeContext,
  DecodeError,
  DecodedType,
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

  decode<Ty extends AnyDecodableType>(
    ty: Ty,
    c: CtxParam<DecodeContext<Ty>>,
  ): Result<DecodedType<Ty>, DecodeError<Ty>> {
    return ty[decodeSymbol](this, c);
  }
}

export class ThrowOnFailDecoder extends BaseDecoder {
  constructor(bytes: Uint8Array, ptr: number = 0) {
    super(bytes, ptr);
  }

  decode<Ty extends AnyDecodableType>(
    ty: Ty,
    c: CtxParam<DecodeContext<Ty>>,
  ): DecodedType<Ty> {
    return ty[decodeSymbol](this, c).unwrap();
  }
}
