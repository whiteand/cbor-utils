import { encode, u8, bytes, bool, tryDecode, decode, ok } from "./index";
import { hex } from "./utils/hex";
import { expect, describe, it } from "vitest";

describe("docs", () => {
  it("encoding example works", () => {
    const cborBytes = encode((e) => {
      e.encode(u8, 42);
      e.encode(bytes, new Uint8Array([1, 2, 3]));
      e.encode(bool, true);
    });
    expect(hex(cborBytes)).toMatchInlineSnapshot(`"182a43010203f5"`);
  });
  it("works decoding example", () => {
    const cborBytes = encode((e) => {
      e.encode(u8, 42);
      e.encode(bytes, new Uint8Array([1, 2, 3]));
      e.encode(bool, true);
    });
    const res = decode(cborBytes, (d) => {
      const id = d.decode(u8);
      if (!id.ok()) return id;
      const hash = d.decode(bytes);
      if (!hash.ok()) return hash;
      const submitted = d.decode(bool);
      if (!submitted.ok()) return submitted;
      return ok({
        id: id.value,
        hash: hash.value,
        submitted: submitted.value,
      });
    });
    expect(res).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "hash": Uint8Array [
            1,
            2,
            3,
          ],
          "id": 42,
          "submitted": true,
        },
      }
    `);
    const result2 = tryDecode(cborBytes, (d) => {
      const id = d.decode(u8);
      const hash = d.decode(bytes);
      const submitted = d.decode(bool);

      return {
        id,
        hash,
        submitted,
      };
    });
    expect(result2).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "hash": Uint8Array [
            1,
            2,
            3,
          ],
          "id": 42,
          "submitted": true,
        },
      }
    `);
  });
});
