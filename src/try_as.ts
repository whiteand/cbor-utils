import { err, ok, Result } from "./result";

export function tryAs<T extends number | bigint>(
  value: T,
  size: 8 | 16 | 32 | 64,
  postition: number
): Result<T> {
  if (size === 8)
    return value <= 0xff
      ? ok(value)
      : err(
          new Error(
            "expected u8 but " +
              value +
              " is out of range. At position " +
              postition
          )
        );
  if (size === 16)
    return value <= 0xffff
      ? ok(value)
      : err(
          new Error(
            "expected u16, but " +
              value +
              " is out of range. At position " +
              postition
          )
        );

  if (size === 32)
    return value <= 0xffffffff
      ? ok(value)
      : err(
          new Error(
            "expected u32, but " +
              value +
              " is out of range. At position " +
              postition
          )
        );

  return ok(value);
}
