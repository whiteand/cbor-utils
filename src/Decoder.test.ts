import { describe, expect, it } from "vitest";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults";
import { encode } from "./encode";
import { Encoder } from "./Encoder";
import { Type } from "./Type";
import { TypeMismatchError } from "./TypeMismatchError";

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
  it("can find error when decoding bool", () => {
    const rw = new Uint8ArrayReader(new Uint8Array([0]));
    const encoder = new Encoder(rw);
    const decoder = new Decoder(rw);
    const res = decoder.bool();
    expect(res).toEqual({
      error: new TypeMismatchError(
        { known: true, type: Type.U8 },
        0,
        "expected bool"
      ),
      ok: false,
    });
  });
  it("can decode true", () => {
    const decoder = new Decoder(
      new Uint8ArrayReader(encode((e) => e.bool(true)))
    );
    const res = decoder.bool();
    expect(res).toEqual({
      ok: true,
      value: true,
    });
  });
  it("can decode false", () => {
    const decoder = new Decoder(
      new Uint8ArrayReader(encode((e) => e.bool(false)))
    );
    const res = decoder.bool();
    expect(res).toEqual({
      ok: true,
      value: false,
    });
  });
});
