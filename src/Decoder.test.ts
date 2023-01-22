import { describe, expect, it } from "vitest";
import { Decoder } from "./Decoder";
import { Uint8ArrayReader } from "./defaults";
import { encode } from "./encode";
import { Encoder } from "./Encoder";
import { Type } from "./Type";
import { TypeMismatchError } from "./TypeMismatchError";
import { TResult } from "./types";

function decode<R>(
  bytes: Uint8Array,
  cb: (d: Decoder<Uint8ArrayReader>) => TResult<R>
): TResult<R> {
  const decoder = new Decoder(new Uint8ArrayReader(bytes));
  const result = cb(decoder);
  return result;
}

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
  it("can properly decode valid int decoding", () => {
    expect(
      decode(
        encode((e) => e.u8(0)),
        (d) => d.u8()
      )
    ).toEqual({ ok: true, value: 0 });
    expect(
      decode(
        encode((e) => e.u8(18)),
        (d) => d.u8()
      )
    ).toEqual({ ok: true, value: 18 });
    expect(decode(new Uint8Array([0x19, 0, 0x18]), (d) => d.u8())).toEqual({
      ok: true,
      value: 0x18,
    });
    expect(decode(new Uint8Array([0x19, 1, 0x18]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: expected u8 but 280 is out of range],
        "ok": false,
      }
    `);
    expect(
      decode(
        encode((e) => e.u8(0xff)),
        (d) => d.u8()
      )
    ).toEqual({ ok: true, value: 0xff });
    expect(decode(new Uint8Array([0x1a, 0, 0, 0, 23]), (x) => x.u8())).toEqual({
      ok: true,
      value: 23,
    });
    expect(decode(new Uint8Array([0x1a, 0, 0, 1, 0]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: expected u8 but 256 is out of range],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x1a, 0, 0, 0]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: End of input],
        "ok": false,
      }
    `);
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 0, 23]), (x) => x.u8())
    ).toEqual({
      ok: true,
      value: 23,
    });
    expect(
      decode(new Uint8Array([0x1b, 0, 0, 0, 0, 0, 0, 1, 0]), (x) => x.u8())
    ).toMatchInlineSnapshot(`
      {
        "error": [Error: expected u8 but 256 is out of range],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([58, 0, 0, 0, 0, 0, 0, 0, 23]), (x) => x.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I32 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x38, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I8 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x39, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I16 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x3a, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I32 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x3b, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I64 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x5f, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type BytesIndef at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x7f, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type StringIndef at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x9f, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type ArrayIndef at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xbf, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type MapIndef at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xf8, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Simple at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xf5, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Bool at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xf6, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Null at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xf7, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Undefined at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xf9, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type F16 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xfa, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type F32 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xfb, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type F64 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xff, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Break at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xe0, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Simple at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xc0, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Tag at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0xa0, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Map at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([93, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type unknown type 93 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x80, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Array at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x60, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type String at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x40, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Bytes at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x3b, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I64 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x3b, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type Int at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x3a, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I32 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x3a, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I64 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x39, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I16 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x39, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I32 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x38, 0]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I8 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x38, 0x80]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type I16 at position 0: expected u8],
        "ok": false,
      }
    `);
    expect(decode(new Uint8Array([0x38]), (d) => d.u8()))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: unexpected type unknown type 56 at position 0: expected u8],
        "ok": false,
      }
    `);
  });
  it("correctly loads several chunks", () => {
    const input = new Uint8Array([0x1a, 0x01, 0x02, 0x03, 0x04]);
    const inputReader = new Uint8ArrayReader(input);
    const decoder = new Decoder(inputReader, { bufferSize: 1 });
    expect(decoder.u32()).toMatchInlineSnapshot('undefined');
  });
});
