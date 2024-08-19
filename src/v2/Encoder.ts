import { Result } from "resultra";
import { IEncodable, IEncoder } from "./types";

function nextSize(current: number, minimal: number) {
  current ||= 1;
  while (current < minimal) {
    current *= 2;
  }
  return current;
}

abstract class BaseEncoder {
  buf: Uint8Array;
  ptr: number;
  offset: number;
  constructor(buffer: Uint8Array = new Uint8Array(), ptr: number = 0) {
    this.buf = buffer;
    this.ptr = ptr;
    this.offset = ptr;
  }

  save(): number {
    return this.ptr;
  }

  restore(value: number) {
    if (this.buf.length > value) {
      this.ptr = value;
    } else {
      throw new Error("invalid restore position: " + value);
    }
  }

  write(byte: number): this {
    if (this.ptr >= this.buf.length) {
      this.realloc(nextSize(this.buf.length, this.buf.length + 1));
    }
    this.buf[this.ptr++] = byte;
    return this;
  }
  private realloc(newSize: number) {
    if (newSize === this.buf.length) return;
    const newBuf = new Uint8Array(newSize);
    newBuf.set(this.buf);
    this.buf = newBuf;
  }
  writeSlice(bytes: Uint8Array): this {
    if (this.ptr + bytes.length - 1 >= this.buf.length) {
      this.realloc(nextSize(this.buf.length, this.buf.length + bytes.length));
    }
    this.buf.set(bytes, this.ptr);
    this.ptr += bytes.length;
    return this;
  }
  finish(): Uint8Array {
    return this.buf.slice(this.offset, this.ptr);
  }
}

export class Encoder extends BaseEncoder implements IEncoder {
  encode<T, EE extends Error, EC>(
    ty: IEncodable<T, EE, EC>,
    value: Readonly<T>,
    ...args: unknown extends EC ? [] | [EC] : [EC]
  ): Result<void, EE> {
    return ty.encode(value, this, (args as [EC])[0]);
  }
}

export class ThrowOnFailEncoder extends BaseEncoder implements IEncoder {
  encode<T, EE extends Error, EC>(
    ty: IEncodable<T, EE, EC>,
    value: NoInfer<T>,
    ...args: unknown extends EC ? [] | [EC] : [EC]
  ): void {
    return ty.encode(value, this, (args as [EC])[0]).unwrap();
  }
}
