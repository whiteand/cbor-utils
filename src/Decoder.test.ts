import { describe, expect, it } from "vitest";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults";

describe("Decoder", () => {
  it("should be a class", () => {
    expect(Decoder).toBeInstanceOf(Function);
  });
  it("returns reader on getReader", () => {
    const decoder = new Decoder(
      new Uint8ArrayReader(new Uint8Array([1, 2, 3]))
    );
    expect(decoder.getReader()).toBeInstanceOf(Uint8ArrayReader);
  });
});
