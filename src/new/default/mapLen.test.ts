import { EOI_ERROR_CODE, TYPE_MISMATCH_ERROR_CODE } from "../error-codes";
import { testCborType } from "../test-utils";
import { mapLen } from "./mapLen";

testCborType(
  "mapLen",
  mapLen,
  [
    { decoded: null, hex: "bf", expectedRemaining: 1 },
    { decoded: 0, hex: "a0", expectedRemaining: 1 },
    { decoded: 10, hex: "aa", expectedRemaining: 1 },
    { decoded: 23, hex: "b7", expectedRemaining: 1 },
    { decoded: 24, hex: "b818", expectedRemaining: 1 },
    { decoded: 256, hex: "b90100", expectedRemaining: 1 },
    { decoded: 0xffff, hex: "b9ffff", expectedRemaining: 1 },
    { decoded: 0xffffffff, hex: "baffffffff", expectedRemaining: 1 },
    {
      decoded: 0xffffffffffffffffn,
      hex: "bbffffffffffffffff",
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

      hex: "bbffffffffffffff",
      error: EOI_ERROR_CODE,
    },
  ]
);
