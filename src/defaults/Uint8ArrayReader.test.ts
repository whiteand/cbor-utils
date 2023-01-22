import { describe, it, expect } from "vitest";
import { Uint8ArrayReader } from "./Uint8ArrayReader";

describe("Uint8ArrayReader", () => {
  it("has empty state at the start", () => {
    const reader = new Uint8ArrayReader();
    const buf = new Uint8Array(10);
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 0,
      }
    `);
    expect([...buf]).toEqual(Array.from({ length: 10 }, () => 0));
  });
  it("has ability to pass starting chunks", () => {
    const reader = new Uint8ArrayReader(new Uint8Array([1, 2, 3]));
    const buf = new Uint8Array(10);
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 3,
      }
    `);
    expect([...buf]).toEqual([1, 2, 3, ...Array.from({ length: 7 }, () => 0)]);
  });
  it("has ability to add new chunks", () => {
    const reader = new Uint8ArrayReader(new Uint8Array([1, 2, 3]));
    reader.write(new Uint8Array([4, 5, 6]));
    reader.write(new Uint8Array([7, 8, 9]));
    const buf = new Uint8Array(10);
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 9,
      }
    `);
    expect([...buf]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  });
  it("reads only necessary amount of bytes", () => {
    const reader = new Uint8ArrayReader(new Uint8Array([1, 2, 3]));
    reader.write(new Uint8Array([4, 5, 6]));
    reader.write(new Uint8Array([7, 8, 9]));
    const buf = new Uint8Array(2);
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 2,
      }
    `);
    expect([...buf]).toEqual([1, 2]);
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 2,
      }
    `);
    expect([...buf]).toEqual([3, 4]);
  });
  it("is clearable", () => {
    const reader = new Uint8ArrayReader(new Uint8Array([1, 2, 3]));
    reader.write(new Uint8Array([4, 5, 6]));
    reader.write(new Uint8Array([7, 8, 9]));
    const buf = new Uint8Array(2);
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 2,
      }
    `);
    expect([...buf]).toEqual([1, 2]);
    reader.clear();
    expect(reader.read(buf)).toMatchInlineSnapshot(`
      OkResult {
        "value": 0,
      }
    `);
    expect([...buf]).toEqual([1, 2]);
  });
});
