import * as x from "../../dist/index.js";

const bytes = [
  new Uint8Array([0]),
  new Uint8Array([1]),
  new Uint8Array([0xa]),
  new Uint8Array([17]),
  new Uint8Array([0x18, 0x18]),
  new Uint8Array([0x18, 0x64]),
  new Uint8Array([0x19, 0x03, 0xe8]),
  new Uint8Array([0x1a, 0x00, 0x0f, 0x42, 0x40]),
  new Uint8Array([0x1b, 0x00, 0x00, 0x00, 0xe8, 0xd4, 0xa5, 0x10, 0x00]),
  new Uint8Array([0x1b, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
];
const decoders = bytes.map((bytes) => new x.Decoder(bytes));

console.log(x.v2);

let sum = 0n;
Deno.bench("New u8", () => {
  for (let i = 0; i < decoders.length; i++) {
    const res = x.v2.u64.decode(decoders[i]);
    decoders[i].ptr = 0;
    if (res !== 0) {
      throw new Error("Failed to decode");
    }
    sum += x.v2.u64.decoder().values.pop()!;
  }
});

sum = 0n;
