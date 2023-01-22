import { describe, expect, it } from "vitest";
import { Uint8ArrayReader, Uint8ArrayWriter } from "./defaults";
import { Encoder } from "./Encoder";

describe("Encoder", () => {
  it("should be a class", () => {
    expect(Encoder).toBeInstanceOf(Function);
  });
  it("has default reader", () => {
    const encoder = new Encoder(new Uint8ArrayWriter());
    expect(encoder.getWriter()).toBeInstanceOf(Uint8ArrayWriter);
  });
});
