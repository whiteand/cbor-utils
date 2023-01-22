import { err, ok } from "./result";
import { TResult } from "./types";

export function try_as<T extends number | bigint>(
  value: T,
  size: 8 | 16 | 32 | 64
): TResult<T> {
  if (size === 8)
    return value <= 0xff
      ? ok(value)
      : err(new Error("expected u8 but " + value + " is out of range"));
  if (size === 16)
    return value <= 0xffff
      ? ok(value)
      : err(new Error("expected u16, but " + value + " is out of range"));

  if (size === 32)
    return value <= 0xffffffff
      ? ok(value)
      : err(new Error("expected u32, but " + value + " is out of range"));

  return ok(value);
}
