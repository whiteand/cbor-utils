import { describe, expect, it } from "vitest";
import { Uint8ArrayWriter } from "./defaults";
import { encode } from "./encode";
import { Encoder } from "./Encoder";

describe("Encoder", () => {
  it("should be a class", () => {
    expect(Encoder).toBeInstanceOf(Function);
  });
  it("has default reader", () => {
    const encoder = new Encoder(new Uint8ArrayWriter());
    expect(encoder.getWriter()).toBeInstanceOf(Uint8ArrayWriter);
  });
  it("properly encodes true", () => {
    const bytes = encode((e) => e.bool(true));
    expect(bytes).toEqual(new Uint8Array([0xf5]));
  });
  it("properly encodes false", () => {
    const bytes = encode((e) => e.bool(false));
    expect(bytes).toEqual(new Uint8Array([0xf4]));
  });
  it("propely encodes numbers", () => {
    expect(encode((e) => e.u8(0))).toEqual(new Uint8Array([0x00]));
    expect(encode((e) => e.u8(0x17))).toEqual(new Uint8Array([0x17]));
    expect(encode((e) => e.u8(0x18))).toEqual(new Uint8Array([24, 0x18]));
    expect(encode((e) => e.u8(0xff))).toEqual(new Uint8Array([24, 0xff]));
    expect(encode((e) => e.u16(0x0100))).toEqual(
      new Uint8Array([25, 0x01, 0x00])
    );
    expect(encode((e) => e.u16(0xffff))).toEqual(
      new Uint8Array([25, 0xff, 0xff])
    );
    expect(encode((e) => e.u32(0x10000))).toEqual(
      new Uint8Array([26, 0, 1, 0, 0])
    );
    expect(encode((e) => e.u32(0xffffffff))).toEqual(
      new Uint8Array([26, 0xff, 0xff, 0xff, 0xff])
    );
    expect(encode((e) => e.u64(0x100000000))).toEqual(
      new Uint8Array([27, 0, 0, 0, 1, 0, 0, 0, 0])
    );
    expect(encode((e) => e.u64(0xffffffffffffffffn))).toEqual(
      new Uint8Array([27, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
    );
    expect(encode((e) => e.u8(-0))).toEqual(new Uint8Array([0x00]));
    expect(encode((e) => e.u8(-0x17))).toEqual(new Uint8Array([54]));
    expect(encode((e) => e.u8(-0x18))).toEqual(new Uint8Array([55]));
    expect(encode((e) => e.u8(-0xff))).toEqual(new Uint8Array([56, 254]));
    expect(encode((e) => e.u16(-0x0100))).toEqual(new Uint8Array([56, 255]));
    expect(encode((e) => e.u16(-0xffff))).toEqual(
      new Uint8Array([57, 0xff, 0xfe])
    );
    expect(encode((e) => e.u32(-0x10000))).toEqual(
      new Uint8Array([57, 255, 255])
    );
    expect(encode((e) => e.u32(-0xffffffff))).toEqual(
      new Uint8Array([58, 0xff, 0xff, 0xff, 0xfe])
    );
    expect(encode((e) => e.u64(-0x100000000))).toEqual(
      new Uint8Array([58, 0xff, 0xff, 0xff, 0xff])
    );
    expect(encode((e) => e.u64(-0xffffffffffffffffn))).toEqual(
      new Uint8Array([59, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe])
    );
  });
});
