import { IDecoder } from "../types";

export function done(d: IDecoder): boolean {
  return d.ptr >= d.buf.length;
}
