import { InputByteStream } from "./types";

export function done(d: InputByteStream): boolean {
  return d.ptr >= d.buf.length;
}
