import { describe, expect, it } from "vitest";
import { u8 } from "../default/smallInts";
import { Encoder } from "../Encoder";
import { Decoder } from "../Decoder";
import { array } from "./array";

describe("array", () => {
  it("propery encodes", () => {
    const u8Array = u8.pipe(array());
    let res = new Encoder().encode(u8Array, [1, 2, 3, 256]);
    expect(res.ok()).toBe(false);
    let enc = new Encoder();
    res = enc.encode(u8Array, [1, 2, 3, 4]);
    expect(res.ok()).toBe(true);
    expect(Buffer.from(enc.finish()).toString("hex")).toMatchInlineSnapshot(
      `"8401020304"`,
    );
  });
  it("propery decodes", () => {
    const four = u8.pipe(array());
    const failBytes = new Uint8Array(
      Buffer.from(
        "9f0102030405060708090a0b0c0d0e0f10111213141516171818181919ffffff",
        "hex",
      ),
    );
    const r = new Decoder(failBytes).decode(four);
    expect(!r.ok() && r.error).toMatchInlineSnapshot(
      `[Error: Expected u8, but got uint]`,
    );
    const validBytes = new Uint8Array(
      Buffer.from(
        "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff",
        "hex",
      ),
    );
    const r2 = new Decoder(validBytes).decode(four);
    expect(r2.ok() && r2.value).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
      ]
    `);
  });
});
