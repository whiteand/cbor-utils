import { ThrowOnFailEncoder } from "./Encoder";

export function encode(cb: (e: ThrowOnFailEncoder) => void): Uint8Array {
  const e = new ThrowOnFailEncoder();
  cb(e);
  return e.finish();
}
