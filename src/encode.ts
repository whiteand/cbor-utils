import { ErrResult, Result } from "resultra";
import { Uint8ArrayWriter } from "./defaults/Uint8ArrayWriter";
import { Encoder } from "./Encoder";
import { IEncoder } from "./IEncoder";

export function encode(
  cb: (encoder: IEncoder) => void | Result<any>
): Uint8Array {
  const buffer = new Uint8ArrayWriter(new Uint8Array(1024), { growable: true });
  const encoder = new Encoder(buffer);
  let res = cb(encoder);
  if (res && "ok" in res && !res.ok() && res.error) {
    throw res.error;
  }
  const bytes = buffer.intoUint8Array();
  return bytes;
}
