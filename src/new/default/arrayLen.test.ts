import { EOI_ERROR_CODE, TYPE_MISMATCH_ERROR_CODE } from "../error-codes";
import { testCborType } from "../test-utils";
import { arrayLen } from "./arrayLen";

testCborType(
  "arrayLen",
  arrayLen,
  [
    { decoded: null, hex: "9f", expectedRemaining: 1 },
    { decoded: 0, hex: "80", expectedRemaining: 1 },
    { decoded: 10, hex: "8a", expectedRemaining: 1 },
    { decoded: 23, hex: "97", expectedRemaining: 1 },
    { decoded: 24, hex: "9818", expectedRemaining: 1 },
    { decoded: 256, hex: "990100", expectedRemaining: 1 },
    { decoded: 0xffff, hex: "99ffff", expectedRemaining: 1 },
    { decoded: 0xffffffff, hex: "9affffffff", expectedRemaining: 1 },
    {
      decoded: 0xffffffffffffffffn,
      hex: "9bffffffffffffffff",
      expectedRemaining: 1,
    },
  ],
  [
    { type: "decode", hex: "", error: EOI_ERROR_CODE },
    {
      type: "decode",

      hex: "01",
      error: TYPE_MISMATCH_ERROR_CODE,
    },
    {
      type: "decode",

      hex: "9bffffffffffffff",
      error: EOI_ERROR_CODE,
    },
  ]
);
