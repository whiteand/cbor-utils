import { describe, expect, it } from "vitest";
import { u16 } from "../default/smallInts";
import { constant } from "./constant";
import { Encoder } from "../Encoder";
import { Decoder } from "../Decoder";

describe("constant", () => {
  it("propery encodes", () => {
    const four = u16.pipe(constant(4));
    let res = new Encoder().encode(four, 42 as 4);
    expect(res.ok()).toBe(false);
    const enc = new Encoder();
    res = enc.encode(four, 4 as const);
    expect(res.ok()).toBe(true);
    expect(Buffer.from(enc.finish()).toString("hex")).toBe("04");
  });
  it("propery decodes", () => {
    const four = u16.pipe(constant(4));
    const failBytes = new Uint8Array([5]);
    const r = new Decoder(failBytes).decode(four);
    expect(!r.ok() && r.error).toMatchInlineSnapshot(
      `[Error: expected 4, but got 5]`
    );
    const validBytes = new Uint8Array([4]);
    const r2 = new Decoder(validBytes).decode(four);
    expect(r2.ok() && r2.value).toBe(4);
  });
});
