import { f16 } from "./f16";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { describe, it, expect } from "vitest";
import { fromHex, hex } from "../utils/hex";

describe("f16", () => {
  const positive = [
    { v: NaN, b: "f97e00" },
    { v: Infinity, b: "f97c00" },
    { v: -Infinity, b: "f9fc00" },
    { v: 0, b: "f90000" },
    { v: -0, b: "f98000" },
    { v: 1.5, b: "f93e00" },
    { v: 2048, b: "f96800" },
    { v: 2 ** -14, b: "f90400" },
    { v: -(2 ** -14), b: "f98400" },
    { v: 65504, b: "f97bff" },
  ];

  it.each(positive)("correctly decodes $b => $v", ({ v, b }) => {
    const decoder = new Decoder(new Uint8Array(fromHex(b)));
    const res = decoder.decode(f16).unwrap();
    if (Number.isNaN(v)) {
      expect(res).toBeNaN();
    } else {
      expect(res).toBe(v);
    }
  });
  it.each(positive)("correctly encodes $v => $b", ({ v, b }) => {
    const e = new Encoder();
    e.encode(f16, v).unwrap();
    expect(hex(e.finish())).toBe(b);
  });
  it("fails to encode too large numbers", () => {
    const e = new Encoder();
    expect(() =>
      e.encode(f16, 65505).unwrap(),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Expected value to be <= 65504, but got 65505]`,
    );
  });
  it("fails to encode too much negative numbers", () => {
    const e = new Encoder();
    expect(() =>
      e.encode(f16, -65505).unwrap(),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Expected value to be >= -65504, but got -65505]`,
    );
  });
  it("rounds small positive numbers to 0", () => {
    const e = new Encoder();
    e.encode(f16, 1e-14).unwrap();
    expect(hex(e.finish())).toBe("f90000");
  });
  it("rounds small negative numbers to -0", () => {
    const e = new Encoder();
    e.encode(f16, -1e-14).unwrap();
    expect(hex(e.finish())).toBe("f98000");
  });
});
