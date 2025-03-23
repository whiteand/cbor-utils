import { describe, expect, test } from "vitest";
import { Decoder } from "../../Decoder";
import { fromHex } from "../../utils/hex";
import { uint } from "./uint";
import { stringifyErrorCode } from "../stringifyErrorCode";

export const TESTS: Array<{
  cbor: string;
  hex: string;
  roundtrip?: boolean;
  decoded?: unknown;
  diagnostic?: string;
}> = [
  {
    cbor: "AA==",
    hex: "00",
    roundtrip: true,
    decoded: 0,
  },
  {
    cbor: "AQ==",
    hex: "01",
    roundtrip: true,
    decoded: 1,
  },
  {
    cbor: "Cg==",
    hex: "0a",
    roundtrip: true,
    decoded: 10,
  },
  {
    cbor: "Fw==",
    hex: "17",
    roundtrip: true,
    decoded: 23,
  },
  {
    cbor: "GBg=",
    hex: "1818",
    roundtrip: true,
    decoded: 24,
  },
  {
    cbor: "GBk=",
    hex: "1819",
    roundtrip: true,
    decoded: 25,
  },
  {
    cbor: "GGQ=",
    hex: "1864",
    roundtrip: true,
    decoded: 100,
  },
  {
    cbor: "GQPo",
    hex: "1903e8",
    roundtrip: true,
    decoded: 1000,
  },
  {
    cbor: "GgAPQkA=",
    hex: "1a000f4240",
    roundtrip: true,
    decoded: 1000000,
  },
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
