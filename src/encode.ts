import { ThrowOnFailEncoder } from "./Encoder";

/**
 * Helper that creates a new Encoder and passes it into the callback.
 * During this callback - you may write something into the encoder.
 *
 * After callback finishes - encoder internal bytes will be returned as result.
 *
 * @param cb callback that will be called with created encoder
 * @returns encoded bytes
 */
export function encode(cb: (e: ThrowOnFailEncoder) => void): Uint8Array {
  const e = new ThrowOnFailEncoder();
  cb(e);
  return e.finish();
}
