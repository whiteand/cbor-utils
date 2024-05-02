import { Result } from "resultra";
import { catchError } from "resultra/utils";
import { ThrowOnFailDecoder, Decoder } from "./Decoder";

export const tryDecode: <T>(
  bytes: Uint8Array,
  cb: (e: ThrowOnFailDecoder) => T,
) => Result<T, unknown> = (b, cb) => {
  return catchError(cb, new ThrowOnFailDecoder(b));
};

export const decode: <T, E>(
  bytes: Uint8Array,
  cb: (e: Decoder) => Result<T, E>,
) => Result<T, E> = (b, cb) => cb(new Decoder(b));
