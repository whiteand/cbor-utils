import { describe, expect, it } from "vitest";
import { u32 } from "../default/smallInts";
import { tagged } from "./tagged";
import { untag } from "./untag";
import { Encoder } from "../Encoder";
import { Decoder } from "../Decoder";
import { Buffer } from "node:buffer";

describe("untag", () => {
  it("properly encodes", () => {
    const ty = u32.pipe(tagged(32768), untag(32768, "u32"));
    let res = new Encoder().encode(ty, 10_000_000_000);
    expect(res.ok()).toBe(false);
    const enc = new Encoder();
    res = enc.encode(ty, 16);
    expect(res.ok()).toBe(true);
    res = enc.encode(ty, 1);
    expect(res.ok()).toBe(true);
    expect(Buffer.from(enc.finish()).toString("hex")).toMatchInlineSnapshot(
      `"d9800010d9800001"`
    );
  });
  it("properly decodes", () => {
    const ty = u32.pipe(tagged(32768), untag(32768, "u32"));
    const enc = new Encoder();
    enc.encode(u32, 1024).unwrap();
    const failBytes = enc.finish();
    expect(Buffer.from(failBytes).toString("hex")).toMatchInlineSnapshot(
      `"190400"`
    );
    const r = new Decoder(failBytes).decode(ty);
    expect(!r.ok() && r.error).toMatchInlineSnapshot(
      `[Error: Expected tagged, but got u16]`
    );
    const validBytes = new Uint8Array([
      0xd9, 0x80, 0x00, 0x10, 0xd9, 0x80, 0x00, 0x01,
    ]);
    const d = new Decoder(validBytes);
    expect(d.decode(ty).unwrap()).toBe(16);
    expect(d.decode(ty).unwrap()).toBe(1);
  });
});
