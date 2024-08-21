import { describe, expect, it } from "vitest";
import { u32, u8 } from "../default/smallInts";
import { Encoder } from "../Encoder";
import { nullable } from "./nullable";
import { Decoder } from "../Decoder";

describe("array", () => {
  it("propery encodes", () => {
    const nullableByte = u8.pipe(nullable());
    let res = new Encoder().encode(nullableByte, 256);
    expect(res.ok()).toBe(false);
    const enc = new Encoder();
    res = enc.encode(nullableByte, null);
    expect(res.ok()).toBe(true);
    res = enc.encode(nullableByte, 1);
    expect(res.ok()).toBe(true);
    expect(Buffer.from(enc.finish()).toString("hex")).toMatchInlineSnapshot(
      `"f601"`
    );
  });
  it("propery decodes", () => {
    const nullableByte = u8.pipe(nullable());
    const enc = new Encoder();
    enc.encode(u32, 1024).unwrap();
    const failBytes = enc.finish();
    expect(Buffer.from(failBytes).toString("hex")).toMatchInlineSnapshot(
      `"190400"`
    );
    const r = new Decoder(failBytes).decode(nullableByte);
    expect(!r.ok() && r.error).toMatchInlineSnapshot(
      `[Error: Expected u8, but got u16]`
    );
    const validBytes = new Uint8Array([0xf6, 0x01]);
    const d = new Decoder(validBytes);
    expect(d.decode(nullableByte).unwrap()).toBe(null);
    expect(d.decode(nullableByte).unwrap()).toBe(1);
  });
  //   const validBytes = new Uint8Array(
  //     Buffer.from(
  //       "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff",
  //       "hex",
  //     ),
  //   );
  //   const r2 = new Decoder(validBytes).decode(four);
  //   expect(r2.ok() && r2.value).toMatchInlineSnapshot(`
  //     [
  //       1,
  //       2,
  //       3,
  //       4,
  //       5,
  //       6,
  //       7,
  //       8,
  //       9,
  //       10,
  //       11,
  //       12,
  //       13,
  //       14,
  //       15,
  //       16,
  //       17,
  //       18,
  //       19,
  //       20,
  //       21,
  //       22,
  //       23,
  //       24,
  //       25,
  //     ]
  //   `);
  // });
});
