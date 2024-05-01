import { readSlice } from "./readSlice";
import { describe, it, expect } from "vitest";
import { Decoder } from "../Decoder";

describe("readSlice", () => {
  it("works", () => {
    const d = new Decoder(new Uint8Array([1, 2, 3, 4, 5]));
    const x = readSlice(d, 5);
    expect(x.unwrap()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(d.ptr).toBe(5);
    d.ptr = 0;
    const y = readSlice(d, 6);
    expect(() => y.unwrap()).toThrowErrorMatchingInlineSnapshot(
      `[Error: Expected value to be <= 5, but got 6]`,
    );
    d.ptr = 3;
    const z = readSlice(d, 6);
    expect(() => z.unwrap()).toThrowErrorMatchingInlineSnapshot(
      `[Error: Expected value to be <= 2, but got 6]`,
    );
  });
});
