import { ok } from "resultra";
import { describe, expect, it } from "vitest";
import { SIMPLE } from "./constants";
import { decode } from "./decode";
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
    expect(res).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: unexpected type U8 at position 0: expected bool],
      }
    `);
  });
  it("can decode true", () => {
    const decoder = new Decoder(
      new Uint8ArrayReader(encode((e) => e.bool(true)))
    );
    const res = decoder.bool();
    expect(res).toMatchInlineSnapshot(`
      OkResult {
        "value": true,
      }
    `);
  });
  it("can decode false", () => {
    const decoder = new Decoder(
      new Uint8ArrayReader(encode((e) => e.bool(false)))
    );
    const res = decoder.bool();
    expect(res).toMatchInlineSnapshot(`
      OkResult {
        "value": false,
      }
    `);
  });
  it("can properly decode valid int decoding", () => {
    expect(
      decode(
        encode((e) => e.u8(0)),
        (d) => d.u8()
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": 0,
      }
    `);
    expect(
      decode(
        encode((e) => e.u8(18)),
        (d) => d.u8()
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": 18,
      }
    `);
    expect(decode(new Uint8Array([0x19, 0, 0x18]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": 24,
      }
    `);
    expect(decode(new Uint8Array([0x19, 1, 0x18]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected u8 but 280 is out of range. At position 0],
        }
      `);
    expect(
      decode(
        encode((e) => e.u8(0xff)),
        (d) => d.u8()
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": 255,
      }
    `);
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 23]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": 23,
      }
    `);
    expect(decode(new Uint8Array([0x1a, 0, 0, 1, 0]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected u8 but 256 is out of range. At position 0],
        }
      `);
    expect(decode(new Uint8Array([0x1a, 0, 0, 0]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: End of input],
        }
      `);
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 23]), (x) => x.u8())
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": 23,
      }
    `);
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 1, 0]), (x) => x.u8())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected u8 but 256 is out of range. At position 0],
      }
    `);
    expect(decode(new Uint8Array([58, 0, 0, 0, 0, 0, 0, 0, 23]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I32 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x38, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I8 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x39, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I16 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x3a, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I32 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x3b, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I64 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x5f, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type BytesIndef at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x7f, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type StringIndef at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x9f, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type ArrayIndef at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xbf, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type MapIndef at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xf8, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Simple at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xf5, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Bool at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xf6, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Null at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xf7, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Undefined at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xf9, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type F16 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xfa, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type F32 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xfb, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type F64 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xff, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Break at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xe0, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Simple at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xc0, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Tag at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0xa0, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Map at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([93, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type unknown type 93 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x80, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Array at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x60, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type String at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x40, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Bytes at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x3b, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I64 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x3b, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type Int at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x3a, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I32 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x3a, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I64 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x39, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I16 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x39, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I32 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x38, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I8 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x38, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type I16 at position 0: expected u8],
        }
      `);
    expect(decode(new Uint8Array([0x38]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type unknown type 56 at position 0: expected u8],
        }
      `);
  });
  it("correctly loads several chunks", () => {
    const input = new Uint8Array([0x1a, 0x01, 0x02, 0x03, 0x04]);
    const inputReader = new Uint8ArrayReader(input);
    const decoder = new Decoder(inputReader, { bufferSize: 1 });
    expect(decoder.u32()).toMatchInlineSnapshot(`
      OkResult {
        "value": 16909060,
      }
    `);
  });
  it("correctly loads small u32", () => {
    expect(decode(new Uint8Array([0x05]), (d) => d.u32()))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": 5,
      }
    `);
    expect(decode(new Uint8Array([0x18, 0x20]), (d) => d.u32()))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": 32,
      }
    `);
    expect(decode(new Uint8Array([0x19, 0, 0x20]), (d) => d.u32()))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": 32,
      }
    `);
    expect(decode(new Uint8Array([0x19, 1, 0x20]), (d) => d.u32()))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": 288,
      }
    `);
    expect(
      decode(new Uint8Array([0x1a, 0x1, 0x2, 0x3, 0x4]), (d) => d.u32())
    ).toEqual({
      value: 0x01020304,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0x1, 0x2, 0x3, 0x4]), (d) =>
        d.u32()
      )
    ).toEqual({
      value: 0x01020304,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff]), (d) =>
        d.u32()
      )
    ).toEqual({
      value: 0xffffffff,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 1, 0x1, 0x2, 0x3, 0x4]), (d) =>
        d.u32()
      )
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected u32, but 4311876356 is out of range. At position 0],
      }
    `);
    expect(
      decode(new Uint8Array([0x1e, 0, 0, 0, 1, 0x1, 0x2, 0x3, 0x4]), (d) =>
        d.u32()
      )
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: unexpected type unknown type 30 at position 0: expected u32],
      }
    `);
  });
  it("decodes u16 < 0x17", () => {
    expect(decode(new Uint8Array([0x05]), (d) => d.u16())).toEqual({
      value: 5,
    });
  });
  it("decodes u16 < 0xff", () => {
    expect(decode(new Uint8Array([0x18, 0x20]), (d) => d.u16())).toEqual({
      value: 0x20,
    });
  });
  it("decodes u16 < 0xffff", () => {
    expect(decode(new Uint8Array([0x19, 0, 0x20]), (d) => d.u16())).toEqual({
      value: 0x20,
    });
    expect(decode(new Uint8Array([0x19, 1, 0x20]), (d) => d.u16())).toEqual({
      value: 0x0120,
    });
  });
  it("decodes u16 < 0xffffffff", () => {
    expect(
      decode(new Uint8Array([0x1a, 0, 0, 0, 0x20]), (d) => d.u16())
    ).toEqual({
      value: 0x20,
    });
    expect(
      decode(new Uint8Array([0x1a, 0, 0, 1, 0x20]), (d) => d.u16())
    ).toEqual({
      value: 0x0120,
    });
    expect(decode(new Uint8Array([0x1a, 0, 1, 1, 0x20]), (d) => d.u16()))
      .toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected u16, but 65824 is out of range. At position 0],
      }
    `);
    expect(decode(new Uint8Array([0x1a, 0, 1, 1]), (d) => d.u16()))
      .toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: End of input],
      }
    `);
  });
  it("correctly decodes u16 from u64", () => {
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 1, 0x20]), (d) => d.u16())
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": 288,
      }
    `);
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 1, 1, 0x20]), (d) => d.u16())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected u16, but 65824 is out of range. At position 0],
      }
    `);
  });
  it("correctly throws type mismatch", () => {
    expect(decode(new Uint8Array([0x1c]), (d) => d.u16()))
      .toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: unexpected type unknown type 28 at position 0: expected u16],
      }
    `);
  });
  it("correctly parses u64 from small u8", () => {
    expect(decode(new Uint8Array([0x05]), (d) => d.u64())).toEqual({
      value: 5,
    });
  });
  it("correctly parses u64 from u8", () => {
    expect(decode(new Uint8Array([0x18, 0x20]), (d) => d.u64())).toEqual({
      value: 0x20,
    });
  });
  it("correctly parses u64 from u16", () => {
    expect(decode(new Uint8Array([0x19, 0x1, 0x2]), (d) => d.u64())).toEqual({
      value: 0x0102,
    });
  });
  it("correctly parses u64 from u32", () => {
    expect(
      decode(new Uint8Array([0x1a, 0x1, 0x2, 0x3, 0x4]), (d) => d.u64())
    ).toEqual({
      value: 0x01020304,
    });
  });
  it("correctly parses u64 from u64", () => {
    expect(
      decode(
        new Uint8Array([0x1b, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]),
        (d) => d.u64()
      )
    ).toEqual({
      value: 0x0102030405060708n,
    });
    expect(
      decode(
        new Uint8Array([0x1b, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
        (d) => d.u64()
      )
    ).toEqual({
      value: 0xffffffffffffffffn,
    });
  });
  it("correctly throws type mismatch when parsing u64", () => {
    expect(
      decode(
        new Uint8Array([0x1c, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]),
        (d) => d.u64()
      )
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: unexpected type unknown type 28 at position 0: expected expected unsigned],
      }
    `);
  });
  it("correctly parses small u8 as i8", () => {
    expect(decode(new Uint8Array([0x05]), (d) => d.i8())).toEqual({
      value: 5,
    });
  });
  it("corrctly parses u8 as i8", () => {
    expect(decode(new Uint8Array([0x18, 0x20]), (d) => d.i8())).toEqual({
      value: 0x20,
    });
    expect(decode(new Uint8Array([0x18, 127]), (d) => d.i8())).toEqual({
      value: 127,
    });
    expect(decode(new Uint8Array([0x18, 128]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i8 but 128 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses u16 as i8", () => {
    expect(decode(new Uint8Array([0x19, 0, 0x20]), (d) => d.i8())).toEqual({
      value: 0x20,
    });
    expect(decode(new Uint8Array([0x19, 0, 127]), (d) => d.i8())).toEqual({
      value: 127,
    });
    expect(decode(new Uint8Array([0x19, 0, 128]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i8 but 128 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses u32 as i8", () => {
    expect(
      decode(new Uint8Array([0x1a, 0, 0, 0, 0x20]), (d) => d.i8())
    ).toEqual({
      value: 0x20,
    });
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 127]), (d) => d.i8())).toEqual(
      {
        value: 127,
      }
    );
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 128]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i8 but 128 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses u64 as i8", () => {
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 0x20]), (d) => d.i8())
    ).toEqual({
      value: 0x20,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 127]), (d) => d.i8())
    ).toEqual({
      value: 127,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 128]), (d) => d.i8())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i8 but 128 is out of range. At position 0],
      }
    `);
  });
  it("correctly parses small i8 as i8", () => {
    const bytes = encode((e) => e.i8(-1));
    expect(decode(bytes, (d) => d.i8())).toEqual({
      value: -1,
    });

    expect(decode(new Uint8Array([0x37]), (d) => d.i8())).toEqual({
      value: -24,
    });
  });
  it("correctly parses small i8 as i8", () => {
    expect(decode(new Uint8Array([56, 24]), (d) => d.i8())).toEqual({
      value: -25,
    });
    expect(decode(new Uint8Array([56, 127]), (d) => d.i8())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([56, 128]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i8 but -129 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses small i16 as i8", () => {
    expect(decode(new Uint8Array([0x39, 0, 24]), (d) => d.i8())).toEqual({
      value: -25,
    });
    expect(decode(new Uint8Array([0x39, 0, 127]), (d) => d.i8())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x39, 0, 128]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i8 but -129 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses small i32 as i8", () => {
    expect(decode(new Uint8Array([0x3a, 0, 0, 0, 24]), (d) => d.i8())).toEqual({
      value: -25,
    });
    expect(decode(new Uint8Array([0x3a, 0, 0, 0, 127]), (d) => d.i8())).toEqual(
      {
        value: -128,
      }
    );
    expect(decode(new Uint8Array([0x3a, 0, 0, 0, 128]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i8 but -129 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses small i64 as i8", () => {
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 24]), (d) => d.i8())
    ).toEqual({
      value: -25,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 127]), (d) => d.i8())
    ).toEqual({
      value: -128,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 128]), (d) => d.i8())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i8 but -129 is out of range. At position 0],
      }
    `);
  });
  it("correctly throws type mismatch when parsing i8", () => {
    expect(decode(new Uint8Array([0x60]), (d) => d.i8()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type String at position 0: expected i8],
        }
      `);
  });
  it("correctly parses small u8 to i16", () => {
    expect(decode(new Uint8Array([0x0]), (d) => d.i16())).toEqual({
      value: 0,
    });
    expect(decode(new Uint8Array([0x17]), (d) => d.i16())).toEqual({
      value: 0x17,
    });
  });
  it("correctly parses u8 to i16", () => {
    expect(decode(new Uint8Array([0x18, 127]), (d) => d.i16())).toEqual({
      value: 127,
    });
    expect(decode(new Uint8Array([0x18, 0xff]), (d) => d.i16())).toEqual({
      value: 0xff,
    });
  });
  it("correctly parses u16 to i16", () => {
    expect(decode(new Uint8Array([0x19, 0, 1]), (d) => d.i16())).toEqual({
      value: 1,
    });
    expect(decode(new Uint8Array([0x19, 0x7f, 0xff]), (d) => d.i16())).toEqual({
      value: 0x7fff,
    });
    expect(decode(new Uint8Array([0x19, 0x80, 0]), (d) => d.i16()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i16, but 32768 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses u32 to i16", () => {
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 1]), (d) => d.i16())).toEqual({
      value: 1,
    });
    expect(decode(new Uint8Array([0x1a, 0, 0, 0x80, 0]), (d) => d.i16()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i16, but 32768 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses u64 to i16", () => {
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 1]), (d) => d.i16())
    ).toEqual({
      value: 1,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0x80, 0]), (d) => d.i16())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i16, but 32768 is out of range. At position 0],
      }
    `);
  });
  it("correctly parses small i8 to i16", () => {
    expect(decode(new Uint8Array([0x20]), (d) => d.i16())).toEqual({
      value: -1,
    });
    expect(decode(new Uint8Array([0x37]), (d) => d.i16())).toEqual({
      value: -24,
    });
  });
  it("correctly parses i8 to i16", () => {
    expect(decode(new Uint8Array([0x38, 127]), (d) => d.i16())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x38, 128]), (d) => d.i16())).toEqual({
      value: -129,
    });
  });
  it("correctly parses i16 to i16", () => {
    expect(decode(new Uint8Array([0x39, 0, 127]), (d) => d.i16())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x39, 0, 128]), (d) => d.i16())).toEqual({
      value: -129,
    });
    expect(decode(new Uint8Array([0x39, 0x7f, 0xff]), (d) => d.i16())).toEqual({
      value: -32768,
    });
    expect(decode(new Uint8Array([0x39, 0x80, 0x00]), (d) => d.i16()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i16, but -32769 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses i32 to i16", () => {
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0, 127]), (d) => d.i16())
    ).toEqual({
      value: -128,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0, 128]), (d) => d.i16())
    ).toEqual({
      value: -129,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0x7f, 0xff]), (d) => d.i16())
    ).toEqual({
      value: -32768,
    });
    expect(decode(new Uint8Array([0x3a, 0, 0, 0x80, 0x00]), (d) => d.i16()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i16, but -32769 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses i64 to i16", () => {
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 127]), (d) => d.i16())
    ).toEqual({
      value: -128,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 128]), (d) => d.i16())
    ).toEqual({
      value: -129,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0x7f, 0xff]), (d) =>
        d.i16()
      )
    ).toEqual({
      value: -32768,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0x80, 0x00]), (d) =>
        d.i16()
      )
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i16, but -32769 is out of range. At position 0],
      }
    `);
  });
  it("correctly throws type mismatch error when parsing i16", () => {
    expect(decode(new Uint8Array([0x7f, 0]), (d) => d.i16()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type StringIndef at position 0: expected i16],
        }
      `);
  });
  it("correctly parses small i8 to i32", () => {
    expect(decode(new Uint8Array([0x20]), (d) => d.i32())).toEqual({
      value: -1,
    });
    expect(decode(new Uint8Array([0x37]), (d) => d.i32())).toEqual({
      value: -24,
    });
  });
  it("correctly parses i8 to i32", () => {
    expect(decode(new Uint8Array([0x38, 127]), (d) => d.i32())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x38, 128]), (d) => d.i32())).toEqual({
      value: -129,
    });
  });
  it("correctly parses i16 to i32", () => {
    expect(decode(new Uint8Array([0x39, 0, 127]), (d) => d.i32())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x39, 0, 128]), (d) => d.i32())).toEqual({
      value: -129,
    });
    expect(decode(new Uint8Array([0x39, 0x7f, 0xff]), (d) => d.i32())).toEqual({
      value: -32768,
    });
    expect(decode(new Uint8Array([0x39, 0x80, 0x00]), (d) => d.i32()))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": -32769,
        }
      `);
  });
  it("correctly parses i32 to i32", () => {
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0, 127]), (d) => d.i32())
    ).toEqual({
      value: -128,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0, 128]), (d) => d.i32())
    ).toEqual({
      value: -129,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0x7f, 0xff]), (d) => d.i32())
    ).toEqual({
      value: -32768,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0x80, 0x00]), (d) => d.i32())
    ).toEqual({
      value: -32769,
    });
    expect(
      decode(new Uint8Array([0x3a, 127, 255, 255, 255]), (d) => d.i32())
    ).toEqual({
      value: -2147483648,
    });
    expect(decode(new Uint8Array([0x3a, 128, 0, 0, 0]), (d) => d.i32()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: expected i32, but -2147483649 is out of range. At position 0],
        }
      `);
  });
  it("correctly parses i64 to i32", () => {
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 127]), (d) => d.i32())
    ).toEqual({
      value: -128,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 128]), (d) => d.i32())
    ).toEqual({
      value: -129,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0x7f, 0xff]), (d) =>
        d.i32()
      )
    ).toEqual({
      value: -32768,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0x80, 0x00, 0, 0]), (d) =>
        d.i32()
      )
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i32, but -2147483649 is out of range. At position 0],
      }
    `);
  });
  it("correctly throws type mismatch error when parsing i32", () => {
    expect(decode(new Uint8Array([0x7f, 0]), (d) => d.i32()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type StringIndef at position 0: expected i32],
        }
      `);
  });
  it("correctly parses small u8 to i32", () => {
    expect(decode(new Uint8Array([0x0]), (d) => d.i32())).toEqual({
      value: 0,
    });
    expect(decode(new Uint8Array([0x17]), (d) => d.i32())).toEqual({
      value: 0x17,
    });
  });
  it("correctly parses u8 to i32", () => {
    expect(decode(new Uint8Array([0x18, 127]), (d) => d.i32())).toEqual({
      value: 127,
    });
    expect(decode(new Uint8Array([0x18, 0xff]), (d) => d.i32())).toEqual({
      value: 0xff,
    });
  });
  it("correctly parses u16 to i32", () => {
    expect(decode(new Uint8Array([0x19, 0, 1]), (d) => d.i32())).toEqual({
      value: 1,
    });
    expect(decode(new Uint8Array([0x19, 0x7f, 0xff]), (d) => d.i32())).toEqual({
      value: 0x7fff,
    });
    expect(decode(new Uint8Array([0x19, 0x80, 0]), (d) => d.i32()))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": 32768,
        }
      `);
  });
  it("correctly parses u32 to i32", () => {
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 1]), (d) => d.i32())).toEqual({
      value: 1,
    });
    expect(decode(new Uint8Array([0x1a, 0, 0, 0x80, 0]), (d) => d.i32()))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": 32768,
        }
      `);
  });
  it("correctly parses u64 to i32", () => {
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 1]), (d) => d.i32())
    ).toEqual({
      value: 1,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0x80, 0, 0, 0]), (d) => d.i32())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i32, but 2147483648 is out of range. At position 0],
      }
    `);
  });

  // i64

  it("correctly parses small i8 to i64", () => {
    expect(decode(new Uint8Array([0x20]), (d) => d.i64())).toEqual({
      value: -1,
    });
    expect(decode(new Uint8Array([0x37]), (d) => d.i64())).toEqual({
      value: -24,
    });
  });
  it("correctly parses i8 to i64", () => {
    expect(decode(new Uint8Array([0x38, 127]), (d) => d.i64())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x38, 128]), (d) => d.i64())).toEqual({
      value: -129,
    });
  });
  it("correctly parses i16 to i64", () => {
    expect(decode(new Uint8Array([0x39, 0, 127]), (d) => d.i64())).toEqual({
      value: -128,
    });
    expect(decode(new Uint8Array([0x39, 0, 128]), (d) => d.i64())).toEqual({
      value: -129,
    });
    expect(decode(new Uint8Array([0x39, 0x7f, 0xff]), (d) => d.i64())).toEqual({
      value: -32768,
    });
    expect(decode(new Uint8Array([0x39, 0x80, 0x00]), (d) => d.i64()))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": -32769,
        }
      `);
  });
  it("correctly parses i32 to i64", () => {
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0, 127]), (d) => d.i64())
    ).toEqual({
      value: -128,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0, 128]), (d) => d.i64())
    ).toEqual({
      value: -129,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0x7f, 0xff]), (d) => d.i64())
    ).toEqual({
      value: -32768,
    });
    expect(
      decode(new Uint8Array([0x3a, 0, 0, 0x80, 0x00]), (d) => d.i64())
    ).toEqual({
      value: -32769,
    });
    expect(
      decode(new Uint8Array([0x3a, 127, 255, 255, 255]), (d) => d.i64())
    ).toEqual({
      value: -2147483648,
    });
  });
  it("correctly parses i64 to i64", () => {
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 127]), (d) => d.i64())
    ).toEqual({
      value: -128n,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0, 128]), (d) => d.i64())
    ).toEqual({
      value: -129n,
    });
    expect(
      decode(new Uint8Array([0x3b, 0, 0, 0, 0, 0, 0, 0x7f, 0xff]), (d) =>
        d.i64()
      )
    ).toEqual({
      value: -32768n,
    });
    expect(
      decode(new Uint8Array([0x3b, 0x80, 0x00, 0, 0, 0, 0, 0, 0]), (d) =>
        d.i64()
      )
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i64, but -9223372036854775809 is out of range. At position 0],
      }
    `);
  });
  it("correctly throws type mismatch error when parsing i64", () => {
    expect(decode(new Uint8Array([0x7f, 0]), (d) => d.i64()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type StringIndef at position 0: expected i64],
        }
      `);
  });
  it("correctly throws type mismatch error when parsing int", () => {
    expect(decode(new Uint8Array([0x7f, 0]), (d) => d.int()))
      .toMatchInlineSnapshot(`
        ErrResult {
          "error": [Error: unexpected type StringIndef at position 0: expected i64],
        }
      `);
  });
  it("correctly parses small u8 to i64", () => {
    expect(decode(new Uint8Array([0x0]), (d) => d.i64())).toEqual({
      value: 0,
    });
    expect(decode(new Uint8Array([0x17]), (d) => d.i64())).toEqual({
      value: 0x17,
    });
  });
  it("correctly parses u8 to i64", () => {
    expect(decode(new Uint8Array([0x18, 127]), (d) => d.i64())).toEqual({
      value: 127,
    });
    expect(decode(new Uint8Array([0x18, 0xff]), (d) => d.i64())).toEqual({
      value: 0xff,
    });
  });
  it("correctly parses u16 to i64", () => {
    expect(decode(new Uint8Array([0x19, 0, 1]), (d) => d.i64())).toEqual({
      value: 1,
    });
    expect(decode(new Uint8Array([0x19, 0x7f, 0xff]), (d) => d.i64())).toEqual({
      value: 0x7fff,
    });
    expect(decode(new Uint8Array([0x19, 0x80, 0]), (d) => d.i64()))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": 32768,
        }
      `);
  });
  it("correctly parses u32 to i64", () => {
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 1]), (d) => d.i64())).toEqual({
      value: 1,
    });
    expect(decode(new Uint8Array([0x1a, 0, 0, 0x80, 0]), (d) => d.i64()))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": 32768,
        }
      `);
  });
  it("correctly parses u64 to i64", () => {
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 1]), (d) => d.i64())
    ).toEqual({
      value: 1n,
    });
    expect(
      decode(new Uint8Array([0x1b, 0x80, 0, 0, 0, 0, 0, 0, 0]), (d) => d.i64())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i64, but 9223372036854775808 is out of range. At position 0],
      }
    `);
  });
  it("correctly parses u64 to i64", () => {
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 1]), (d) => d.int())
    ).toEqual({
      value: 1n,
    });
    expect(
      decode(new Uint8Array([0x1b, 0x80, 0, 0, 0, 0, 0, 0, 0]), (d) => d.int())
    ).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: expected i64, but 9223372036854775808 is out of range. At position 0],
      }
    `);
  });
  it("correctly parses all integers", () => {
    const limits: (number | bigint)[] = [];
    limits.push(0);
    limits.push(1);
    limits.push(0x17);
    limits.push(0x18);
    limits.push(0x7f);
    limits.push(0x80);
    limits.push(0xff);
    limits.push(0x100);
    limits.push(0x7fff);
    limits.push(0x8000);
    limits.push(0xffff);
    limits.push(0x10000);
    limits.push(0x7fffffffn);
    limits.push(0x80000000n);
    limits.push(0xffffffffn);
    limits.push(0x100000000n);
    limits.push(0x7fffffffffffn);
    limits.push(0x800000000000n);
    limits.push(0xffffffffffffn);
    limits.push(0x1000000000000n);
    limits.push(0x7fffffffffffffn);
    limits.push(0x80000000000000n);
    limits.push(0xffffffffffffffn);
    limits.push(...limits.map((x) => -BigInt(x) - 1n));

    for (let i = 0; i < limits.length; i++) {
      const value = limits[i];
      const encoded = encode((e) => e.int(value));
      const decoded = decode(encoded, (d) => d.int());
      expect(decoded.ok()).toBe(true);
      if (decoded.ok()) {
        expect(BigInt(decoded.value)).toBe(BigInt(value));
      }
    }
  });
  it("correctly parses indefinite array", () => {
    const bytes = encode((e) => {
      e.beginArray();
      e.u8(10);
      e.u8(20);
      e.u8(30);
      e.end();
    });
    const iter = decode(bytes, (d) => d.arrayIter((d) => d.u8()));
    expect(iter.ok()).toBe(true);
    if (iter.ok()) {
      expect([...iter.value].map((r) => r.unwrap())).toEqual([10, 20, 30]);
    }
  });
  it("correctly parses definite array", () => {
    const bytes = encode((e) => {
      e.array(3);
      e.u8(15);
      e.u8(25);
      e.u8(35);
    });
    const iter = decode(bytes, (d) => d.arrayIter((d) => d.u8()));
    expect(iter.ok()).toBe(true);
    if (iter.ok()) {
      expect([...iter.value].map((r) => r.unwrap())).toEqual([15, 25, 35]);
    }
  });
  it("correctly parses empty definite array", () => {
    const bytes = encode((e) => {
      e.array(0);
    });
    const iter = decode(bytes, (d) => d.arrayIter((d) => d.u8()));
    expect(iter.ok()).toBe(true);
    if (iter.ok()) {
      expect([...iter.value].map((r) => r.unwrap())).toEqual([]);
    }
  });
  it("correctly parses empty indefinite array", () => {
    const bytes = encode((e) => {
      e.beginArray();
      e.end();
    });
    const iter = decode(bytes, (d) => d.arrayIter((d) => d.u8()));
    expect(iter.ok()).toBe(true);
    if (iter.ok()) {
      expect([...iter.value].map((r) => r.unwrap())).toEqual([]);
    }
  });
  it("correctly throws typemismatch for arrayIter", () => {
    const bytes = encode((e) => {
      e.beginBytes();
      e.end();
    });
    const iter = decode(bytes, (d) => d.arrayIter((d) => d.u8()));
    expect(iter.ok()).toBe(false);
    if (!iter.ok()) {
      expect(iter.error).toMatchInlineSnapshot(
        "[Error: unexpected type BytesIndef at position 0: expected array]"
      );
    }
  });
  it("correctly returns type", () => {
    const bytes = new Uint8Array([246]);
    const result = decode(bytes, (d) => d.peekType());
    expect(result.ok()).toBe(true);
    expect(result.unwrap()).toBe(Type.Null);
  });
  it("correctly skips values", () => {
    const bytes = encode((e) => {
      e.null();
      e.u32(0x11223344);
      e.u64(0x1122334455667788n);
      e.u16(0x1122);
      e.array(1);
      e.u32(10);
      e.beginArray();
      e.u32(1);
      e.u32(2);
      e.u32(3);
      e.end();
    });
    const d = new Decoder(new Uint8ArrayReader(bytes));
    expect(() => {
      d.skip().unwrap(); // null
      d.skip().unwrap(); // u32
      d.skip().unwrap(); // u64
      d.skip().unwrap(); // u16
      d.skip().unwrap(); // array
      d.skip().unwrap(); // undefined array
    }).not.toThrow();
    expect(() => d.skip().unwrap()).toThrowErrorMatchingInlineSnapshot(
      '"End of input"'
    );
  });
  it("correctly decodes nullable null", () => {
    const bs = new Uint8Array([22 | SIMPLE]);
    const numberOrNull = decode(bs, (d) => d.nullable((d) => d.u8()));
    expect(numberOrNull.ok()).toBe(true);
    expect(numberOrNull.unwrap()).toBe(null);
  });
  it("correctly decodes nullable number", () => {
    const bs = new Uint8Array([15]);
    const numberOrNull = decode(bs, (d) => d.nullable((d) => d.u8()));
    expect(numberOrNull.ok()).toBe(true);
    expect(numberOrNull.unwrap()).toBe(15);
  });
});
