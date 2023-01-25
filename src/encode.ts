import { Uint8ArrayWriter } from "./defaults/Uint8ArrayWriter";
import { Encoder } from "./Encoder";
import { IEncoder } from "./IEncoder";

export function encode(cb: (encoder: IEncoder) => void): Uint8Array {
  const buffer = new Uint8ArrayWriter(new Uint8Array(1024), { growable: true });
  const encoder = new Encoder(buffer);
  cb(encoder);
  const bytes = buffer.intoUint8Array();
  return bytes;
}
