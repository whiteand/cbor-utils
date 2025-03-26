import { EOI_ERROR_CODE, TYPE_MISMATCH_ERROR_CODE } from "../error-codes";
import { testCborType } from "../test-utils";
import { str } from "./str";

testCborType(
  "str",
  str,
  [
    { decoded: "", hex: "60" },
    {
      decoded: "123",
      hex: "63313233",
    },
    {
      hex: "60",
      decoded: "",
    },
    {
      hex: "6161",
      decoded: "a",
    },
    {
      hex: "6449455446",
      decoded: "IETF",
    },
    {
      hex: "62225c",
      decoded: '"\\',
    },
    {
      hex: "62c3bc",
      decoded: "ü",
    },
    {
      hex: "63e6b0b4",
      decoded: "水",
    },
    {
      hex: "64f0908591",
      decoded: "𐅑",
    },
  ],
  [
    { type: "decode", hex: "", error: EOI_ERROR_CODE },
    { type: "decode", hex: "f97e00", error: TYPE_MISMATCH_ERROR_CODE },
  ]
);
