import { Result } from "resultra";
import {
  decodeSymbol,
  decodeCtxSymbol,
  decodeTypeSymbol,
  decodeErrSymbol,
} from "./traits";
import { IDecodableType } from "./types";

export class Decoder {
  buf: Uint8Array;
  ptr: number;
  constructor(bytes: Uint8Array, ptr: number = 0) {
    this.buf = bytes;
    this.ptr = ptr;
  }

  done() {
    return this.ptr >= this.buf.length;
  }

  decode<Ty extends IDecodableType<any, unknown, any>>(
    ty: Ty,
  ): Result<Ty[typeof decodeTypeSymbol], Ty[typeof decodeErrSymbol]>;
  decode<Ty extends IDecodableType<any, any, any>>(
    ty: Ty,
    c: Ty[typeof decodeCtxSymbol],
  ): Result<Ty[typeof decodeTypeSymbol], Ty[typeof decodeErrSymbol]>;
  decode<Ty extends IDecodableType>(
    ty: Ty,
    c?: unknown,
  ): Result<Ty[typeof decodeTypeSymbol], Ty[typeof decodeErrSymbol]> {
    return ty[decodeSymbol](this, c);
  }
}
