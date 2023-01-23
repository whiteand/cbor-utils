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

export function tryAsSigned<T extends number | bigint>(
  value: T,
  size: 8 | 16 | 32 | 64,
  postition: number
): Result<T> {
  if (size === 8)
    return value <= 0x7f && value >= -0x80
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
    return value <= 0x7fff && value >= -0x8000
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
    return value <= 2147483647 && value >= -2147483648
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
