import { describe, expect, it } from "vitest";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults";

describe("Decoder", () => {
  it("should be a class", () => {
    expect(Decoder).toBeInstanceOf(Function);
  });
  it("has default writer", () => {
    const decoder = new Decoder();
    expect(decoder.getReader()).toBeInstanceOf(Uint8ArrayReader);
  });
});
