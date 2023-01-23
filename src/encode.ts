import { Uint8ArrayWriter } from "./defaults/Uint8ArrayWriter";
import { Encoder } from "./Encoder";

export function encode(
  cb: (encoder: Encoder<Uint8ArrayWriter>) => void
): Uint8Array {
  const buffer = new Uint8ArrayWriter(new Uint8Array(1024), { growable: true });
  const encoder = new Encoder(buffer);
  cb(encoder);
  const bytes = buffer.intoUint8Array();
  return bytes;
}
