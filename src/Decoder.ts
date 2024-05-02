import { Result } from "resultra";
import {
  decodeSymbol,
  decodeCtxSymbol,
  decodeTypeSymbol,
  decodeErrSymbol,
} from "./traits";
import { IDecodableType } from "./types";

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

  decode<Ty extends IDecodableType<any, void, any>>(
    ty: Ty,
  ): Result<Ty[typeof decodeTypeSymbol], Ty[typeof decodeErrSymbol]>;
  decode<Ty extends IDecodableType<any, any, any>>(
    ty: Ty,
    c: Ty[typeof decodeCtxSymbol],
  ): Result<Ty[typeof decodeTypeSymbol], Ty[typeof decodeErrSymbol]>;
  decode<Ty extends IDecodableType>(
    ty: Ty,
    c?: any,
  ): Result<Ty[typeof decodeTypeSymbol], Ty[typeof decodeErrSymbol]> {
    return ty[decodeSymbol](this, c);
  }
}

export class ThrowOnFailDecoder extends BaseDecoder {
  constructor(bytes: Uint8Array, ptr: number = 0) {
    super(bytes, ptr);
  }

  decode<Ty extends IDecodableType<any, void, any>>(
    ty: Ty,
  ): Ty[typeof decodeTypeSymbol];
  decode<Ty extends IDecodableType<any, any, any>>(
    ty: Ty,
    c: Ty[typeof decodeCtxSymbol],
  ): Ty[typeof decodeTypeSymbol];
  decode<Ty extends IDecodableType>(
    ty: Ty,
    c?: any,
  ): Ty[typeof decodeTypeSymbol] {
    return ty[decodeSymbol](this, c).unwrap();
  }
}
