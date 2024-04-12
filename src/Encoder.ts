import { ok, Result } from "resultra";
import { ARRAY, BYTES, SIGNED, SIMPLE, TEXT } from "./constants";
import { IEncoder } from "./IEncoder";
import { IWriter, u8 } from "./types";
import { u16ToBeBytes, u32ToBeBytes, u64ToBytes } from "./utils";
import { utf8 } from "./utils/utf8";

type WE<W> = W extends IWriter<infer E> ? E : never;

export class Encoder<W extends IWriter<any>> implements IEncoder<WE<W>, W> {
  _INFER_WRITER: W = null as never;
  _INFER_WRITER_ERROR: WE<W> = null as never;
  constructor(private readonly writer: W) {}

  getWriter(): W {
    return this.writer;
  }
  put(bytes: Uint8Array): Result<this, WE<W>> {
    let written = 0;
    while (written < bytes.length) {
      const writeResult = this.writer.write(bytes.subarray(written));
      if (!writeResult.ok()) return writeResult;
      written += writeResult.value;
    }
    return ok(this);
  }
  bool(bool: boolean): Result<this, WE<W>> {
    return this.put(new Uint8Array([SIMPLE | (bool ? 0x15 : 0x14)]));
  }
  u8(x: u8): Result<this, WE<W>> {
    return this.int(x);
  }
  u16(x: number): Result<this, WE<W>> {
    return this.int(x);
  }
  u32(x: number): Result<this, WE<W>> {
    return this.int(x);
  }
  u64(x: number | bigint): Result<this, WE<W>> {
    return this.int(x);
  }
  i8(x: u8): Result<this, WE<W>> {
    return this.int(x);
  }
  i16(x: number): Result<this, WE<W>> {
    return this.int(x);
  }
  i32(x: number): Result<this, WE<W>> {
    return this.int(x);
  }
  i64(x: number | bigint): Result<this, WE<W>> {
    return this.int(x);
  }
  int(x: number | bigint): Result<this, WE<W>> {
    if (x >= 0) {
      if (x <= 0x17) {
        return this.put(new Uint8Array([Number(x)]));
      }
      if (x <= 0xff) {
        return this.put(new Uint8Array([24, Number(x)]));
      }
      if (x <= 0xffff) {
        let r = this.put(new Uint8Array([25]));
        if (!r.ok()) return r;
        return this.put(u16ToBeBytes(Number(x)));
      }
      if (x <= 0xffffffff) {
        const r = this.put(new Uint8Array([26]));
        if (!r.ok()) return r;
        return this.put(u32ToBeBytes(Number(x)));
      }
      const r = this.put(new Uint8Array([27]));
      if (!r.ok()) return r;
      return this.put(u64ToBytes(BigInt(x)));
    }
    const value = typeof x === "number" ? -1 - x : -1n - x;
    if (value <= 0x17) {
      return this.put(new Uint8Array([SIGNED | Number(value)]));
    }
    if (value <= 0xff) {
      return this.put(new Uint8Array([SIGNED | 24, Number(value)]));
    }
    if (value <= 0xffff) {
      let r = this.put(new Uint8Array([SIGNED | 25]));
      if (!r.ok()) return r;
      return this.put(u16ToBeBytes(Number(value)));
    }
    if (value <= 0xffffffff) {
      const r = this.put(new Uint8Array([SIGNED | 26]));
      if (!r.ok()) return r;
      return this.put(u32ToBeBytes(Number(value)));
    }
    const r = this.put(new Uint8Array([SIGNED | 27]));
    if (!r.ok()) return r;
    return this.put(u64ToBytes(BigInt(value)));
  }
  bytes(slice: Uint8Array): Result<this, WE<W>> {
    let result = this.typeLen(BYTES, BigInt(slice.length));
    if (!result.ok()) return result;
    return this.put(slice);
  }
  array(len: number | bigint) {
    return this.typeLen(ARRAY, BigInt(len));
  }
  beginArray(): Result<this, WE<W>> {
    return this.put(new Uint8Array([0x9f]));
  }
  beginBytes(): Result<this, WE<W>> {
    return this.put(new Uint8Array([0x5f]));
  }
  beginMap(): Result<this, WE<W>> {
    return this.put(new Uint8Array([0xbf]));
  }
  null(): Result<this, WE<W>> {
    // self.put(&[SIMPLE | 22])
    return this.put(new Uint8Array([22 | SIMPLE]));
  }

  end(): Result<this, WE<W>> {
    return this.put(new Uint8Array([0xff]));
  }
  private typeLen(type: u8, len: bigint): Result<this, WE<W>> {
    if (len <= 0x17) {
      return this.put(new Uint8Array([type | Number(len)]));
    }
    if (len <= 0xff) {
      return this.put(new Uint8Array([type | 24, Number(len)]));
    }
    if (len <= 0xffff) {
      let r = this.put(new Uint8Array([type | 25]));
      if (!r.ok()) return r;
      return this.put(u16ToBeBytes(Number(len)));
    }
    if (len <= 0xffffffffn) {
      const r = this.put(new Uint8Array([type | 26]));
      if (!r.ok()) return r;
      return this.put(u32ToBeBytes(Number(len)));
    }
    const r = this.put(new Uint8Array([type | 27]));
    if (!r.ok()) return r;
    return this.put(u64ToBytes(len));
  }
  nullable<T, E>(
    encodeNotNull: (e: this, value: T) => Result<unknown, E>,
    value: T | null
  ): Result<this, WE<W> | E> {
    return value == null
      ? this.null()
      : encodeNotNull(this, value).map(() => this);
  }
  str(text: string): Result<this, WE<W>> {
    const bytes = new Uint8Array(utf8(text));
    let result = this.typeLen(TEXT, BigInt(bytes.length));
    if (!result.ok()) {
      return result;
    }
    return this.put(bytes);
  }
}
