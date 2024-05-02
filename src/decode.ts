import { Result } from "resultra";
import { ThrowOnFailDecoder, Decoder } from "./Decoder";

const d = (c: any) => (b: any, c: any) => c(new c(b, 0));

export const decodeThrowing: <T>(
  bytes: Uint8Array,
  cb: (e: ThrowOnFailDecoder) => T,
) => T = d(ThrowOnFailDecoder);

export const decode: <T, E>(
  bytes: Uint8Array,
  cb: (e: Decoder) => Result<T, E>,
) => Result<T, E> = d(Decoder);
