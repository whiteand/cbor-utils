import { beBytesToU16, beBytesToU32, beBytesToU64 } from "./utils";
import { EndOfInputError } from "./EndOfInputError";
import { err, ok } from "./result";
import { Type } from "./Type";
import { TypeMismatchError } from "./TypeMismatchError";
import { IReader, TResult } from "./types";
import { typeToStr } from "./typeToStr";
import { try_as } from "./try_as";

type u8 = number;

export type TypeResult =
  | { known: true; type: Type }
  | { known: false; type: number };

export function typeResultToStr(result: TypeResult): string {
  return result.known ? typeToStr(result.type) : `unknown type ${result.type}`;
}

export class Decoder<R extends IReader> {
  private reader: R;
  private buffer: Uint8Array;
  private bufSize: number;
  private pos: number;
  private globalPos: number;
  constructor(reader: R, { bufferSize }: { bufferSize?: number } = {}) {
    this.reader = reader;
    this.buffer = new Uint8Array(bufferSize || 1024);
    this.pos = 0;
    this.bufSize = 0;
    this.globalPos = 0;
  }

  private loadNextChunk(): TResult<number> {
    const result = this.reader.read(this.buffer);
    if (!result.ok) return result;
    if (result.value <= 0) {
      return { ok: false, error: new EndOfInputError() };
    }
    this.bufSize = result.value;
    this.pos = 0;
    return ok(result.value);
  }

  private read(): TResult<u8> {
    if (this.pos >= this.bufSize) {
      const res = this.loadNextChunk();
      if (!res.ok) return res;
    }
    const p = this.pos;
    const b = this.buffer[p];

    this.globalPos += 1;
    this.pos += 1;

    return ok(b);
  }

  private readSlice(size: number) {
    const res = new Uint8Array(size);
    if (this.pos + size <= this.bufSize) {
      res.set(this.buffer.subarray(this.pos, this.pos + size));
      this.pos += size;
      this.globalPos += size;
      return ok(res);
    }
    let i = 0;
    while (i < size) {
      const r = this.read();
      if (!r.ok) return r;
      res[i] = r.value;
      i++;
    }
    return ok(res);
  }
  private peek(): TResult<u8> {
    if (this.pos >= this.bufSize) {
      const res = this.loadNextChunk();
      if (!res.ok) return res;
    }
    return ok(this.buffer[this.pos]);
  }

  bool(): TResult<boolean> {
    const p = this.globalPos;
    const result = this.read();
    if (!result.ok) return result;
    const b = result.value;
    switch (b) {
      case 0xf4:
        return ok(false);
      case 0xf5:
        return ok(true);
    }
    const typeRes = this.typeOfOrUnknown(b);
    return err(new TypeMismatchError(typeRes, p, "expected bool"));
  }

  private typeOfOrUnknown(b: u8): TypeResult {
    const r = this.typeOf(b);
    if (!r.ok || r.value == null) return { known: false, type: b };
    return { known: true, type: r.value };
  }

  getReader(): R {
    return this.reader;
  }

  u8(): TResult<u8> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      const slice = this.readSlice(2);
      if (!slice.ok) return slice;
      const value = beBytesToU16(slice.value);
      return try_as(value, 8);
    }
    if (n === 0x1a) {
      const slice = this.readSlice(4);
      if (!slice.ok) return slice;
      const s = slice.value;
      const value = beBytesToU32(s);
      return try_as(value, 8);
    }
    if (n === 0x1b) {
      const slice = this.readSlice(8);
      if (!slice.ok) return slice;
      const s = slice.value;
      let res = beBytesToU64(s);
      const r = try_as(res, 8);
      if (!r.ok) return r;
      return ok(Number(r.value));
    }

    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected u8")
    );
  }
  u32(): TResult<number> {
    let p = this.globalPos;
    const marker = this.read();
    if (!marker.ok) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    return err(new Error("not implemented yet"));
    // let p = self.pos;
    //     match self.read()? {
    //         n @ 0 ..= 0x17 => Ok(u32::from(n)),
    //         0x18           => self.read().map(u32::from),
    //         0x19           => self.read_slice(2).map(read_u16).map(u32::from),
    //         0x1a           => self.read_slice(4).map(read_u32),
    //         0x1b           => self.read_slice(8).map(read_u64).and_then(|n| try_as(n, "when converting u64 to u32", p)),
    //         b              => Err(Error::type_mismatch(self.type_of(b)?).at(p).with_message("expected u32"))
    //     }
  }
  private typeOf(b: number): TResult<Type | null> {
    if (b >= 0 && b <= 0x18) return ok(Type.U8);
    if (b === 0x19) return ok(Type.U16);
    if (b === 0x1a) return ok(Type.U32);
    if (b === 0x1b) return ok(Type.U64);
    if (b >= 0x20 && b <= 0x37) return ok(Type.I8);
    if (b === 0x38) {
      const peekResult = this.peek();
      if (!peekResult.ok) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I8);
      return ok(Type.I16);
    }
    if (b === 0x39) {
      const peekResult = this.peek();
      if (!peekResult.ok) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I16);
      return ok(Type.I32);
    }
    if (b === 0x3a) {
      const peekResult = this.peek();
      if (!peekResult.ok) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I32);
      return ok(Type.I64);
    }
    if (b === 0x3b) {
      const peekResult = this.peek();
      if (!peekResult.ok) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I64);
      return ok(Type.Int);
    }
    if (b >= 0x40 && b <= 0x5b) {
      return ok(Type.Bytes);
    }
    if (b === 0x5f) {
      return ok(Type.BytesIndef);
    }
    if (b >= 0x60 && b <= 0x7b) {
      return ok(Type.String);
    }
    if (b === 0x7f) {
      return ok(Type.StringIndef);
    }
    if (b >= 0x80 && b <= 0x9b) {
      return ok(Type.Array);
    }
    if (b === 0x9f) {
      return ok(Type.ArrayIndef);
    }
    if (b >= 0xa0 && b <= 0xbb) {
      return ok(Type.Map);
    }
    if (b === 0xbf) {
      return ok(Type.MapIndef);
    }
    if (b >= 0xc0 && b <= 0xdb) {
      return ok(Type.Tag);
    }
    if (b >= 0xe0 && b <= 0xf3) {
      return ok(Type.Simple);
    }
    if (b === 0xf8) {
      return ok(Type.Simple);
    }
    if (b === 0xf4 || b === 0xf5) {
      return ok(Type.Bool);
    }
    if (b === 0xf6) {
      return ok(Type.Null);
    }
    if (b === 0xf7) {
      return ok(Type.Undefined);
    }
    if (b === 0xf9) {
      return ok(Type.F16);
    }
    if (b === 0xfa) {
      return ok(Type.F32);
    }
    if (b === 0xfb) {
      return ok(Type.F64);
    }
    if (b === 0xff) {
      return ok(Type.Break);
    }
    return ok(null);
  }
}
