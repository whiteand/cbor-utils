import { describe, expect } from "vitest";
import { bytes } from "./bytes";
import { fromHex } from "../../utils/hex";
import { Decoder } from "../../Decoder";
import { testCborType } from "../test-utils";
import { EOI_ERROR_CODE, TYPE_MISMATCH_ERROR_CODE } from "../error-codes";

describe("indefinite bytes", (it) => {
  const testcases = [
    {
      hex: "5f4301020341015f4101ffff",
      decoded: new Uint8Array([1, 2, 3, 1, 1]),
    },
    {
      hex: "5f41014202035f420405ffff",
      decoded: new Uint8Array([1, 2, 3, 4, 5]),
    },
  ];
  it.each(testcases)("works $hex -> $decoded", (t) => {
    const input = fromHex(t.hex);
    const d = new Decoder(new Uint8Array(input), 0);
    const res = bytes.decode(d);
    expect(res).toBe(0);
    const value = bytes.decoder().getValue();
    expect(value).toEqual(t.decoded);
  });
});

testCborType(
  "bytes",
  bytes,
  [
    {
      hex: "40",
      decoded: new Uint8Array(),
    },
    { hex: "4401020304", decoded: new Uint8Array(fromHex("01020304")) },
    {
      decoded: new Uint8Array([1, 2, 3]),
      hex: "43010203",
    },
  ],
  [
    {
      type: "decode",
      hex: "00",
      error: TYPE_MISMATCH_ERROR_CODE,
    },
    {
      type: "decode",
      hex: "",
      error: EOI_ERROR_CODE,
    },
    {
      type: "decode",
      hex: "430102",
      error: EOI_ERROR_CODE,
    },
    {
      type: "decode",
      hex: "5f420102",
      error: EOI_ERROR_CODE,
    },
  ]
);
