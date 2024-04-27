import tests from "./tests.json";
import { describe, expect, test } from "vitest";
import { fromHex } from "./utils/fromHex";
import { decodeItem } from "./decodeItem";

describe("decodeItem", () => {
  test("works for all tests", () => {
    for (const t of tests) {
      const bytes = new Uint8Array(fromHex(t.hex));
      const decoded = decodeItem(bytes, 0).unwrap();
      if (typeof decoded === "bigint") {
        expect(String(decoded)).toBe(String(t.decoded));
        continue;
      }
      expect(decoded).toStrictEqual(t.decoded);
    }
  });
});
