import { ok } from "./result";
import { Type } from "./Type";
import { Result } from "./types";

export function typeOf(b: number): Result<Type | null> {
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
