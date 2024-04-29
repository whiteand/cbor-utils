import { Result } from "resultra";
import {
  encodeCtxSymbol,
  encodeErrSymbol,
  encodeSymbol,
  encodeTypeSymbol,
} from "./traits";
import { IEncodableType, IEncoder } from "./types";

function nextSize(current: number, minimal: number) {
  if (current >= minimal) return current;
  while (current < minimal) {
    current *= 2;
  }
  return current;
}

export class Encoder implements IEncoder {
  buf: Uint8Array;
  ptr: number;
  constructor(buffer: Uint8Array, ptr: number = 0) {
    this.buf = buffer;
    this.ptr = ptr;
  }
  write(byte: number): this {
    if (this.ptr >= this.buf.length) {
      const s = nextSize(this.buf.length, this.buf.length + 1);
      this.realloc(s);
    }
    this.buf[this.ptr++] = byte;
    return this;
  }
  private realloc(newSize: number) {
    const newBuf = new Uint8Array(newSize);
    newBuf.set(this.buf);
    this.buf = newBuf;
  }
  writeSlice(bytes: Uint8Array): this {
    if (this.ptr + bytes.length - 1 >= this.buf.length) {
      const s = nextSize(this.buf.length, this.buf.length + bytes.length);
      this.realloc(s);
    }
    this.buf.set(bytes, this.ptr);
    this.ptr += bytes.length;
    return this;
  }
  encode<Ty extends IEncodableType<any, unknown, any>>(
    ty: Ty,
    value: Ty[typeof encodeTypeSymbol],
  ): Result<Ty[typeof encodeTypeSymbol], Ty[typeof encodeErrSymbol]>;
  encode<Ty extends IEncodableType<any, any, any>>(
    ty: Ty,
    value: Ty[typeof encodeTypeSymbol],
    c: Ty[typeof encodeCtxSymbol],
  ): Result<Ty[typeof encodeTypeSymbol], Ty[typeof encodeErrSymbol]>;
  encode<Ty extends IEncodableType>(
    ty: Ty,
    value: Ty[typeof encodeTypeSymbol],
    c?: unknown,
  ): Result<Ty[typeof encodeTypeSymbol], Ty[typeof encodeErrSymbol]> {
    return ty[encodeSymbol](value, this, c);
  }

  finish(): Uint8Array {
    return this.buf.slice(0, this.ptr);
  }
}
