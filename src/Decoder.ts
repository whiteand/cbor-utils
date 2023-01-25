import { err, ok, Result } from "resultra";
import { ArrayIter } from "./ArrayIter";
import { ARRAY, BYTES } from "./constants";
import { EndOfInputError } from "./EndOfInputError";
import { IDecoder } from "./IDecoder";
import { tryAs, tryAsSigned } from "./try_as";
import { Type } from "./Type";
import { TypeMismatchError } from "./TypeMismatchError";
import { IReader } from "./types";
import { typeToStr } from "./typeToStr";
import { beBytesToU16, beBytesToU32, beBytesToU64 } from "./utils";

function typeOf(b: u8) {
  return b & 0b111_00000;
}
function infoOf(b: u8): u8 {
  return b & 0b000_11111;
}

type u8 = number;

export type TypeResult =
  | { known: true; type: Type }
  | { known: false; type: number };

export function typeResultToStr(result: TypeResult): string {
  return result.known ? typeToStr(result.type) : `unknown type ${result.type}`;
}

export class Decoder<R extends IReader> implements IDecoder {
  private reader: R;
  private buffer: Uint8Array;
  private bufSize: number;
  private pos: number;
  private globalPos: number;
  private currentByte: number | null;
  constructor(reader: R, { bufferSize }: { bufferSize?: number } = {}) {
    this.reader = reader;
    this.buffer = new Uint8Array(bufferSize || 1024);
    this.pos = 0;
    this.bufSize = 0;
    this.globalPos = 0;
    this.currentByte = null;
  }

  private loadNextChunk(): Result<number> {
    const result = this.reader.read(this.buffer);
    if (!result.ok()) return result;
    if (result.value <= 0) {
      return err(new EndOfInputError());
    }
    this.bufSize = result.value;
    this.pos = 0;
    return ok(result.value);
  }
  position(): number {
    return this.globalPos;
  }

  read(): Result<u8> {
    if (this.pos >= this.bufSize) {
      const res = this.loadNextChunk();
      if (!res.ok()) return res;
    }
    const p = this.pos;
    const b = this.buffer[p];
    this.currentByte = b;

    this.globalPos += 1;
    this.pos += 1;

    return ok(b);
  }

  private readSlice(sizeParam: number | bigint) {
    if (sizeParam < 0) {
      return err(new Error("negative size"));
    }
    const size = Number(sizeParam);
    if (!Number.isSafeInteger(size)) {
      return err(new Error("size is too big"));
    }
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
      if (!r.ok()) return r;
      res[i] = r.value;
      i++;
    }
    return ok(res);
  }
  peek(): Result<u8> {
    if (this.pos >= this.bufSize) {
      const res = this.loadNextChunk();
      if (!res.ok()) return res;
    }
    return ok(this.buffer[this.pos]);
  }

  /**
   * @returns Returns last read byte or null if no bytes were read yet
   */
  current(): number | null {
    return this.currentByte;
  }

  bool(): Result<boolean> {
    const p = this.globalPos;
    const result = this.read();
    if (!result.ok()) return result;
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
    if (!r.ok() || r.value == null) return { known: false, type: b };
    return { known: true, type: r.value };
  }

  getReader(): R {
    return this.reader;
  }

  u8(): Result<u8> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      const slice = this.readSlice(2);
      if (!slice.ok()) return slice;
      const value = beBytesToU16(slice.value);
      return tryAs(value, 8, p);
    }
    if (n === 0x1a) {
      const slice = this.readSlice(4);
      if (!slice.ok()) return slice;
      const s = slice.value;
      const value = beBytesToU32(s);
      return tryAs(value, 8, p);
    }
    if (n === 0x1b) {
      const slice = this.readSlice(8);
      if (!slice.ok()) return slice;
      const s = slice.value;
      let res = beBytesToU64(s);
      const r = tryAs(res, 8, p);
      if (!r.ok()) return r;
      return ok(Number(r.value));
    }

    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected u8")
    );
  }
  u16(): Result<number> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2).map(beBytesToU16);
    }
    if (n === 0x1a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAs(n, 16, p));
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAs(n, 16, p))
        .map(Number);
    }
    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected u16")
    );
  }
  u32(): Result<number> {
    let p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2).map(beBytesToU16);
    }
    if (n === 0x1a) {
      return this.readSlice(4).map(beBytesToU32);
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAs(n, 32, p))
        .map((d) => Number(d));
    }
    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected u32")
    );
  }
  u64(): Result<number | bigint> {
    let p = this.globalPos;

    let marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    return this.unsigned(n, p);
  }
  private unsigned(n: number, p: number): Result<number | bigint> {
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2).map(beBytesToU16);
    }
    if (n === 0x1a) {
      return this.readSlice(4).map(beBytesToU32);
    }
    if (n === 0x1b) {
      return this.readSlice(8).map(beBytesToU64);
    }
    return err(
      new TypeMismatchError(
        this.typeOfOrUnknown(n),
        p,
        "expected expected unsigned"
      )
    );
  }
  i8(): Result<number> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n == 0x18) {
      return this.read().andThen((n) => tryAsSigned(n, 8, p));
    }
    if (n === 0x19) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .andThen((n) => tryAsSigned(n, 8, p));
    }
    if (n === 0x1a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAsSigned(n, 8, p));
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(n, 8, p))
        .map(Number);
    }
    if (n >= 0x20 && n <= 0x37) {
      return ok(-1 - n + 0x20);
    }
    if (n === 0x38) {
      return this.read().andThen((n) => tryAsSigned(-1 - n, 8, p));
    }
    if (n === 0x39) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .andThen((n) => tryAsSigned(-1 - n, 8, p));
    }
    if (n === 0x3a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAsSigned(-1 - n, 8, p));
    }
    if (n === 0x3b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(-1n - n, 8, p))
        .map(Number);
    }
    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected i8")
    );
  }
  i16(): Result<number> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .andThen((n) => tryAsSigned(n, 16, p));
    }
    if (n === 0x1a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAsSigned(n, 16, p));
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(n, 16, p))
        .map(Number);
    }
    if (n >= 0x20 && n <= 0x37) {
      return ok(-1 - n + 0x20);
    }
    if (n === 0x38) {
      return this.read().map((n) => -1 - n);
    }
    if (n === 0x39) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .andThen((n) => tryAsSigned(-1 - n, 16, p));
    }
    if (n === 0x3a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAsSigned(-1 - n, 16, p));
    }
    if (n === 0x3b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(-1n - n, 16, p))
        .map(Number);
    }
    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected i16")
    );
  }
  i32(): Result<number> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n === 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2).map(beBytesToU16);
    }
    if (n === 0x1a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAsSigned(n, 32, p));
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(n, 32, p))
        .map(Number);
    }
    if (n >= 0x20 && n <= 0x37) {
      return ok(-1 - n + 0x20);
    }
    if (n === 0x38) {
      return this.read().map((n) => -1 - n);
    }
    if (n === 0x39) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .map((n) => -1 - n);
    }
    if (n === 0x3a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .andThen((n) => tryAsSigned(-1 - n, 32, p));
    }
    if (n === 0x3b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(-1n - n, 32, p))
        .map(Number);
    }

    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected i32")
    );
  }
  int(): Result<number | bigint> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n == 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2).map(beBytesToU16);
    }
    if (n === 0x1a) {
      return this.readSlice(4).map(beBytesToU32);
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(n, 64, p));
    }
    if (n >= 0x20 && n <= 0x37) {
      return ok(-1 - n + 0x20);
    }
    if (n === 0x38) {
      return this.read().map((n) => -1 - n);
    }
    if (n === 0x39) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .map((n) => -1 - n);
    }
    if (n === 0x3a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .map((n) => -1 - n);
    }
    if (n === 0x3b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .map((n) => -1n - n);
    }
    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected i64")
    );
  }
  i64(): Result<number | bigint> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const n = marker.value;
    if (n <= 0x17) {
      return ok(n);
    }
    if (n == 0x18) {
      return this.read();
    }
    if (n === 0x19) {
      return this.readSlice(2).map(beBytesToU16);
    }
    if (n === 0x1a) {
      return this.readSlice(4).map(beBytesToU32);
    }
    if (n === 0x1b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(n, 64, p));
    }
    if (n >= 0x20 && n <= 0x37) {
      return ok(-1 - n + 0x20);
    }
    if (n === 0x38) {
      return this.read().map((n) => -1 - n);
    }
    if (n === 0x39) {
      return this.readSlice(2)
        .map(beBytesToU16)
        .map((n) => -1 - n);
    }
    if (n === 0x3a) {
      return this.readSlice(4)
        .map(beBytesToU32)
        .map((n) => -1 - n);
    }
    if (n === 0x3b) {
      return this.readSlice(8)
        .map(beBytesToU64)
        .andThen((n) => tryAsSigned(-1n - n, 64, p));
    }
    return err(
      new TypeMismatchError(this.typeOfOrUnknown(n), p, "expected i64")
    );
  }
  bytes(): Result<Uint8Array> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const b = marker.value;
    if (BYTES !== typeOf(b) || infoOf(b) === 31) {
      return err(
        new TypeMismatchError(
          this.typeOfOrUnknown(b),
          p,
          "expected bytes (definite length)"
        )
      );
    }
    let nRes = this.unsigned(infoOf(b), p);
    if (!nRes.ok()) return nRes;
    const n = nRes.value;
    return this.readSlice(n);
  }

  /** Begin decoding an array.
   *
   * CBOR arrays are heterogenous collections and may be of indefinite
   * length. If the length is known it is returned as a `number` or `bigint`, for
   * indefinite arrays `null` is returned.
   */
  array(): Result<bigint | number | null> {
    const p = this.globalPos;
    const marker = this.read();
    if (!marker.ok()) return marker;
    const b = marker.value;
    if (ARRAY !== typeOf(b)) {
      return err(
        new TypeMismatchError(this.typeOfOrUnknown(b), p, "expected array")
      );
    }
    switch (infoOf(b)) {
      case 31:
        return ok(null);
      default:
        return this.unsigned(infoOf(b), p);
    }
  }

  arrayIter<T>(item: (d: IDecoder) => Result<T>): Result<ArrayIter<T>> {
    const len = this.array();
    if (!len.ok()) return len;
    return ok(new ArrayIter(this, len.value, item));
  }

  private typeOf(b: number): Result<Type | null> {
    if (b >= 0 && b <= 0x18) return ok(Type.U8);
    if (b === 0x19) return ok(Type.U16);
    if (b === 0x1a) return ok(Type.U32);
    if (b === 0x1b) return ok(Type.U64);
    if (b >= 0x20 && b <= 0x37) return ok(Type.I8);
    if (b === 0x38) {
      const peekResult = this.peek();
      if (!peekResult.ok()) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I8);
      return ok(Type.I16);
    }
    if (b === 0x39) {
      const peekResult = this.peek();
      if (!peekResult.ok()) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I16);
      return ok(Type.I32);
    }
    if (b === 0x3a) {
      const peekResult = this.peek();
      if (!peekResult.ok()) return peekResult;
      const peek = peekResult.value;
      if (peek < 0x80) return ok(Type.I32);
      return ok(Type.I64);
    }
    if (b === 0x3b) {
      const peekResult = this.peek();
      if (!peekResult.ok()) return peekResult;
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
