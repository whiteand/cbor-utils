import { describe, expect, test } from "vitest";
import { Decoder } from "../../Decoder";
import { fromHex } from "../../utils/hex";
import { uint } from "./uint";
import { stringifyErrorCode } from "../stringifyErrorCode";

export const TESTS: Array<{
  hex: string;
  decoded?: unknown;
}> = [
  {
    hex: "00",
    decoded: 0,
  },
  {
    hex: "01",
    decoded: 1,
  },
  {
    hex: "0a",
    decoded: 10,
  },
  {
    hex: "17",
    decoded: 23,
  },
  {
    hex: "1818",
    decoded: 24,
  },
  {
    hex: "1819",
    decoded: 25,
  },
  {
    hex: "1864",
    decoded: 100,
  },
  {
    hex: "1903e8",
    decoded: 1000,
  },
  {
    hex: "1a000f4240",
    decoded: 1000000,
  },
  { decoded: 2n ** 64n - 1n, hex: "1bffffffffffffffff" },
];

describe("uint", () => {
  test.each(TESTS)("decodes $hex => $decoded", (t) => {
    const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
    expect(stringifyErrorCode(uint.decoder().decode(d))).toBe("success");
    const value = uint.decoder().getValue();
    expect(value).toStrictEqual(t.decoded);
    expect(d.ptr).toBe(d.buf.length);
  });
  const SKIP_TESTS = TESTS;
  test.each(SKIP_TESTS)("decodes skips $hex", (t) => {
    const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
    expect(stringifyErrorCode(uint.decoder().skip(d))).toBe("success");
    expect(d.ptr).toBe(d.buf.length);
  });
});
