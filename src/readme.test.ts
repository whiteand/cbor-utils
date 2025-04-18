import { ok } from "resultra";
import { decode, tryDecode } from "./decode";
import { Decoder, ThrowOnFailDecoder } from "./Decoder";
import { bool } from "./default/bool";
import { bytes } from "./default/bytes";
import { u8 } from "./default/smallInts";
import { encode } from "./encode";
import { ThrowOnFailEncoder } from "./Encoder";
// import { encode, u8, bytes, bool, tryDecode, decode, ok, ThrowOnFailEncoder } from "./index";
import { hex } from "./utils/hex";
import { expect, describe, it } from "vitest";

describe("docs", () => {
  it("encoding example works", () => {
    const cborBytes = encode((e: ThrowOnFailEncoder) => {
      e.encode(u8, 42);
      e.encode(bytes, new Uint8Array([1, 2, 3]));
      e.encode(bool, true);
    });
    expect(hex(cborBytes)).toMatchInlineSnapshot(`"182a43010203f5"`);
  });
  it("works decoding example", () => {
    const cborBytes = encode((e: ThrowOnFailEncoder) => {
      e.encode(u8, 42);
      e.encode(bytes, new Uint8Array([1, 2, 3]));
      e.encode(bool, true);
    });
    const res = decode(cborBytes, (d: Decoder) => {
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
    const result2 = tryDecode(cborBytes, (d: ThrowOnFailDecoder) => {
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
    const result3 = tryDecode(cborBytes, (d: ThrowOnFailDecoder) => {
      const _id = d.decode(u8);
      const _hash = d.decode(bytes);
      if (Math.random() > 0) throw new Error("42");
      return 10;
    });
    expect(result3).toMatchInlineSnapshot(`
      ErrResult {
        "error": [Error: 42],
      }
    `);
  });
});
