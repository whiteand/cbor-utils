import { err, ok, Result } from "resultra";
import { ArrayIter } from "./ArrayIter";
import { BytesIter } from "./BytesIter";
import { StrIter } from "./StrIter";
import {
  ARRAY,
  BREAK,
  BYTES,
  MAP,
  SIGNED,
  SIMPLE,
  TAGGED,
  TEXT,
  UNSIGNED,
} from "./constants";
import { EndOfInputError } from "./EndOfInputError";
import { IDecoder } from "./IDecoder";
import { tryAs, tryAsSigned } from "./try_as";
import { Type } from "./Type";
import { TypeMismatchError } from "./TypeMismatchError";
import { IReader } from "./types";
import { typeToStr } from "./typeToStr";
import { beBytesToU16, beBytesToU32, beBytesToU64 } from "./utils";
import { fromUtf8 } from "./utils/utf8";

function sink(x: Iterator<Result<unknown>>): Result<null> {
  while (true) {
    const { done, value } = x.next();
    if (done) break;
    if (!value.ok()) return value;
  }
  return ok(null);
}

function add(a: number | bigint, b: number | bigint): number | bigint {
  if (typeof a === "bigint") return a + BigInt(b);
  if (typeof b === "bigint") return BigInt(a) + b;
  return a + b;
}
function sub(a: number | bigint, b: number | bigint): number | bigint {
  if (typeof a === "bigint") return a - BigInt(b);
  if (typeof b === "bigint") return BigInt(a) - b;
  return a - b;
}

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

  readSlice(sizeParam: number | bigint) {
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
  peekType(): Result<Type | null> {
    const nextValue = this.peek();
    if (!nextValue.ok()) return nextValue;
    return this.typeOf(nextValue.value);
  }
  /**
   * Skip current value
   */
  skip(): Result<this> {
    // Unless we encounter indefinite-length arrays or maps inside of regular
    // maps or arrays we only need to count how many more CBOR items we need
    // to skip (initially starting with 1) or how many more break bytes we
    // need to expect (initially starting with 0).
    //
    // If we do need to handle indefinite items (other than bytes or strings),
    // inside of regular maps or arrays, we switch to using a stack of length
    // information, starting with the remaining number of potential breaks we
    // are still expecting and the number of items we still need to skip over
    // at that point.

    let nrounds: number | bigint = 1; // number of iterations over array and map elements
    let irounds: number | bigint = 0; // number of indefinite iterations

    let stack: (number | bigint | null)[] = [];

    while (nrounds > 0 || irounds > 0 || stack.length > 0) {
      let currentRes = this.peek();
      if (!currentRes.ok()) {
        return currentRes;
      }
      const current = currentRes.value;
      if (current >= UNSIGNED && current <= 0x1b) {
        const res = this.u64();
        if (!res.ok()) return res;
      } else if (current >= SIGNED && current <= 0x3b) {
        const res = this.int();
        if (!res.ok()) return res;
      } else if (current >= BYTES && current <= 0x5f) {
        const res = this.bytesIter();
        if (!res.ok()) return res;
        const res2 = sink(res.value);
        if (!res2.ok()) return res2;
      } else if (current >= TEXT && current <= 0x7f) {
        const res = this.strIter();
        if (!res.ok()) return res;
        const res2 = sink(res.value);
        if (!res2.ok()) return res2;
      } else if (current >= ARRAY && current <= 0x9f) {
        const len = this.array();
        if (!len.ok()) return len;
        const n = len.value;
        if (n == null) {
          if (nrounds == 0 && irounds == 0) {
            stack.push(null);
          } else if (nrounds < 2) {
            irounds = add(irounds, 1);
          } else {
            for (let i = 0; i < irounds; i++) {
              stack.push(null);
            }
            stack.push(sub(nrounds, 1));
            stack.push(null);
            nrounds = 0;
            irounds = 0;
          }
        } else if (n == 0) {
          // do nothing
        } else {
          if (nrounds == 0 && irounds == 0) {
            stack.push(n);
          } else {
            nrounds = add(nrounds, n);
          }
        }
      } else if (current >= MAP && current <= 0xbf) {
        return err(new Error("self.map() is not implemented yet"));
        // match self.map()? {
        //                 Some(0) => {}
        //                 Some(n) =>
        //                     if nrounds == 0 && irounds == 0 {
        //                         stack.push(Some(n.saturating_mul(2)))
        //                     } else {
        //                         nrounds = nrounds.saturating_add(n.saturating_mul(2))
        //                     }
        //                 None =>
        //                     if nrounds == 0 && irounds == 0 {
        //                         stack.push(None)
        //                     } else if nrounds < 2 {
        //                         irounds = irounds.saturating_add(1)
        //                     } else {
        //                         for _ in 0 .. irounds {
        //                             stack.push(None)
        //                         }
        //                         stack.push(Some(nrounds - 1));
        //                         stack.push(None);
        //                         nrounds = 0;
        //                         irounds = 0
        //                     }
        //             }
      } else if (current >= TAGGED && current <= 0xdb) {
        let p = this.globalPos;
        let nr = this.read();
        if (!nr.ok()) return nr;
        const n = nr.value;
        const r = this.unsigned(infoOf(n), p);
        if (!r.ok()) return r;
        continue;
      } else if (current >= SIMPLE && current <= 0xfb) {
        let p = this.globalPos;
        let nr = this.read();
        if (!nr.ok()) return nr;
        const n = nr.value;
        const r = this.unsigned(infoOf(n), p);
        if (!r.ok()) return r;
      } else if (current === BREAK) {
        let r = this.read();
        if (!r.ok()) return r;
        if (nrounds == 0 && irounds == 0) {
          if (stack[stack.length - 1] == null) {
            stack.pop();
          }
        } else {
          irounds = sub(irounds, 1);
        }
      } else {
        return err(
          new TypeMismatchError(
            this.typeOfOrUnknown(current),
            this.globalPos,
            "unknow type"
          )
        );
      }

      if (nrounds == 0 && irounds == 0) {
        while (
          stack.length > 0 &&
          (stack[stack.length - 1] === 0 || stack[stack.length - 1] === 0n)
        ) {
          stack.pop();
        }
        if (stack.length <= 0) {
          break;
        }
        const last = stack[stack.length - 1];
        if (last == null) {
          // do nothing
        } else {
          stack[stack.length - 1] = sub(last, 1);
        }
      } else {
        nrounds = sub(nrounds, 1);
      }
    }

    return ok(this);
    // Ok(())
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
  str(): Result<string> {
    let p = this.globalPos;
    let marker = this.read();
    if (!marker.ok()) return marker;
    const b = marker.value;
    if (TEXT !== typeOf(b) || infoOf(b) === 31) {
      return err(
        new TypeMismatchError(
          this.typeOfOrUnknown(b),
          p,
          "expected text (definite length)"
        )
      );
    }
    const nRes = this.unsigned(infoOf(b), p);
    if (!nRes.ok()) return nRes;
    const n = nRes.value;
    const d = this.readSlice(n);
    if (!d.ok()) return d;

    const strResult = fromUtf8(d.value);
    if (strResult.ok()) return strResult;

    return err(
      new TypeMismatchError(this.typeOfOrUnknown(b), p, "Invalid utf8 string")
    );
  }

  strIter(): Result<StrIter> {
    return err(new Error("decoder.strIter() not implemented yet"));
    // let p = self.pos;
    //     let b = self.read()?;
    //     if BYTES != type_of(b) {
    //         return Err(Error::type_mismatch(self.type_of(b)?)
    //             .with_message("expected bytes")
    //             .at(p))
    //     }
    //     match info_of(b) {
    //         31 => Ok(BytesIter { decoder: self, len: None }),
    //         n  => {
    //             let len = u64_to_usize(self.unsigned(n, p)?, p)?;
    //             Ok(BytesIter { decoder: self, len: Some(len) })
    //         }
    //     }
  }
  bytesIter(): Result<BytesIter> {
    return err(new Error("decoder.bytesIter() not implemented yet"));
    // let p = self.pos;
    //     let b = self.read()?;
    //     if BYTES != type_of(b) {
    //         return Err(Error::type_mismatch(self.type_of(b)?)
    //             .with_message("expected bytes")
    //             .at(p))
    //     }
    //     match info_of(b) {
    //         31 => Ok(BytesIter { decoder: self, len: None }),
    //         n  => {
    //             let len = u64_to_usize(self.unsigned(n, p)?, p)?;
    //             Ok(BytesIter { decoder: self, len: Some(len) })
    //         }
    //     }
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
  nullable<T>(item: (d: IDecoder) => Result<T>): Result<T | null> {
    const type = this.peekType();
    if (!type.ok()) return type;
    if (type.value === Type.Null) {
      const res = this.skip();
      if (!res.ok()) return res;
      return ok(null);
    }
    return item(this);
  }
}
