import { describe, it, expect } from "vitest";
import { BufferOverflowError, Uint8ArrayWriter } from "./Uint8ArrayWriter";

describe("Uint8ArrayWriter", () => {
  it("has empty state at the start", () => {
    const writer = new Uint8ArrayWriter();
    expect(writer.intoUint8Array()).toEqual(new Uint8Array());
  });
  it("has ability to pass buffer", () => {
    const buf = new Uint8Array(3);
    const writer = new Uint8ArrayWriter(buf);
    expect(writer.intoUint8Array().buffer).toBe(buf.buffer);
  });
  it("has ability to pass buffer and write to it", () => {
    const buf = new Uint8Array();
    const writer = new Uint8ArrayWriter(buf, { growable: true });
    expect(writer.write(new Uint8Array([1, 2]))).toMatchInlineSnapshot(`
      OkResult {
        "value": 2,
      }
    `);
    expect([...writer.intoUint8Array()]).toEqual([1, 2]);
  });
  it("can be cleared", () => {
    const buf = new Uint8Array();
    const writer = new Uint8ArrayWriter(buf, { growable: true });
    expect(writer.write(new Uint8Array([1, 2]))).toMatchInlineSnapshot(`
      OkResult {
        "value": 2,
      }
    `);
    writer.clear();
    expect(writer.write(new Uint8Array([2, 3]))).toMatchInlineSnapshot(`
      OkResult {
        "value": 2,
      }
    `);
    expect(writer.intoUint8Array().length).toBe(2);
  });
  it("throws error when buffer is not growable", () => {
    const buf = new Uint8Array(3);
    const writer = new Uint8ArrayWriter(buf);
    expect(writer.write(new Uint8Array([1, 2, 3, 4]))).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: Buffer overflow],
      }
    `);
  });
  it("does nothing when write [] is passed", () => {
    const buf = new Uint8Array(3);
    const writer = new Uint8ArrayWriter(buf);
    expect(writer.write(new Uint8Array([]))).toMatchInlineSnapshot(`
      OkResult {
        "value": 0,
      }
    `);
  });
});
