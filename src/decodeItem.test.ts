import { TESTS } from "./tests";
import { describe, expect, test } from "vitest";
import { fromHex } from "./utils/fromHex";
import { decodeItem } from "./decodeItem";
import { Metadata } from "./Metadata";

describe("decodeItem", () => {
  test.each(TESTS)("decodes $hex => $decoded", (t) => {
    const bytes = new Uint8Array(fromHex(t.hex));
    const metadata = new Metadata();
    const decoded = decodeItem(bytes, 0, metadata);
    const value = decoded.unwrap();
    if (Number.isNaN(t.decoded)) {
      expect(value).toBeNaN();
      expect(metadata.next).toBe(t.hex.length / 2);
      return;
    }
    expect(value).toStrictEqual(t.decoded);
    expect(metadata.next).toBe(t.hex.length / 2);
  });
});
