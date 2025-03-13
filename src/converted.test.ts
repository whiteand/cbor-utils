import { u8 } from "./default/smallInts";
import { describe, expect } from "vitest";
import { encode } from "./encode";
import { decode } from "./decode";
import { IDecoder, IEncoder } from "./types";

describe("convert", (it) => {
  it("correctly encodes", () => {
    const converted = u8.convert(
      (x: number) => x * 100,
      (x: number) => (x / 100) | 0
    );
    const encoded = encode((e: IEncoder) => converted.encode(100, e));
    expect(encoded).toEqual(new Uint8Array([0x01]));
  });
  it("correctly decodes", () => {
    const converted = u8.convert(
      (x: number) => x * 100,
      (x: number) => (x / 100) | 0
    );
    const decoded = decode(new Uint8Array([0x01]), (d: IDecoder) => converted.decode(d));
    expect(decoded.unwrap()).toEqual(100);
  });
});
