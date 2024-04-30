import { Result, ok } from "resultra";
import { OverflowError } from "../OverflowError";
import { IDecoder } from "../types";

export function readSlice(
  d: IDecoder,
  n: number
): Result<Uint8Array, OverflowError> {
  const remainingBytes = d.buf.length - d.ptr;
  if (n > remainingBytes) {
    return new OverflowError(remainingBytes, n).err();
  }

  const bytes = d.buf.slice(d.ptr, d.ptr + n);
  d.ptr += n;
  return ok(bytes);
}
