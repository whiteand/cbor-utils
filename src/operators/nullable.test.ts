import { describe, expect, it } from "vitest";
import { u32, u8 } from "../default/smallInts";
import { Encoder } from "../Encoder";
import { nullable } from "./nullable";
import { Decoder } from "../Decoder";
import { Buffer } from 'node:buffer'

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
  
});
