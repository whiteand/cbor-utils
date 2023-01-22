import { SIGNED, SIMPLE } from "./constants";
import { ok } from "./result";
import { IWriter, Result, u8 } from "./types";

function u16ToBeBytes(x: number): Uint8Array {
  const res = new Uint8Array(2);
  res[0] = (x >> 8) & 0xff;
  res[1] = x & 0xff;
  return res;
}
function u32ToBeBytes(x: number): Uint8Array {
  const res = new Uint8Array(4);
  for (let i = 0, p = 3; i < 4; i++, p--) {
    res[p] = x & 0xff;
    x = x >> 8;
  }
  return res;
}
function u64ToBytes(x: bigint) {
  const res = new Uint8Array(8);
  for (let i = 0, p = 7; i < 8; i++, p--) {
    res[p] = Number(x & 0xffn);
    x = x >> 8n;
  }
  return res;
}

export class Encoder<W extends IWriter> {
  constructor(private readonly writer: W) {}
  getWriter(): W {
    return this.writer;
  }
  private put(bytes: Uint8Array): Result<this> {
    let written = 0;
    while (written < bytes.length) {
      const writeResult = this.writer.write(bytes.subarray(written));
      if (!writeResult.ok) return writeResult;
      written += writeResult.value;
    }
    return ok(this);
  }
  bool(bool: boolean): Result<this> {
    return this.put(new Uint8Array([SIMPLE | (bool ? 0x15 : 0x14)]));
  }
  u8(x: u8): Result<this> {
    return this.int(x);
  }
  u16(x: number): Result<this> {
    return this.int(x);
  }
  u32(x: number): Result<this> {
    return this.int(x);
  }
  u64(x: number | bigint): Result<this> {
    return this.int(x);
  }
  i8(x: u8): Result<this> {
    return this.int(x);
  }
  i16(x: number): Result<this> {
    return this.int(x);
  }
  i32(x: number): Result<this> {
    return this.int(x);
  }
  i64(x: number | bigint): Result<this> {
    return this.int(x);
  }
  int(x: number | bigint): Result<this> {
    if (x >= 0) {
      if (x <= 0x17) {
        return this.put(new Uint8Array([Number(x)]));
      }
      if (x <= 0xff) {
        return this.put(new Uint8Array([24, Number(x)]));
      }
      if (x <= 0xffff) {
        let r = this.put(new Uint8Array([25]));
        if (!r.ok) return r;
        return this.put(u16ToBeBytes(Number(x)));
      }
      if (x <= 0xffffffff) {
        const r = this.put(new Uint8Array([26]));
        if (!r.ok) return r;
        return this.put(u32ToBeBytes(Number(x)));
      }
      const r = this.put(new Uint8Array([27]));
      if (!r.ok) return r;
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
      if (!r.ok) return r;
      return this.put(u16ToBeBytes(Number(value)));
    }
    if (value <= 0xffffffff) {
      const r = this.put(new Uint8Array([SIGNED | 26]));
      if (!r.ok) return r;
      return this.put(u32ToBeBytes(Number(value)));
    }
    const r = this.put(new Uint8Array([SIGNED | 27]));
    if (!r.ok) return r;
    return this.put(u64ToBytes(BigInt(value)));
  }
}
