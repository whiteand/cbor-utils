import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "../error-codes";
import { testCborType } from "../test-utils";
import { nint } from "./nint";

testCborType(
  "nint",
  nint,
  [
    {
      hex: "20",
      decoded: -1,
    },
    {
      hex: "29",
      decoded: -10,
    },
    {
      hex: "3863",
      decoded: -100,
    },
    {
      hex: "3903e7",
      decoded: -1000,
    },
    {
      hex: "3bffffffffffffffff",
      decoded: -(2n ** 64n),
    },
  ],
  [
    { type: "encode", value: -0, error: OVERFLOW_ERROR_CODE },
    { type: "encode", value: 1, error: OVERFLOW_ERROR_CODE },
    { type: "encode", value: 1n, error: OVERFLOW_ERROR_CODE },
    { type: "encode", value: Infinity, error: OVERFLOW_ERROR_CODE },
    { type: "encode", value: -Infinity, error: UNDERFLOW_ERROR_CODE },
    { type: "encode", value: -(2n ** 64n) - 1n, error: UNDERFLOW_ERROR_CODE },
    { type: "decode", hex: "f97e00", error: TYPE_MISMATCH_ERROR_CODE },
    { type: "decode", hex: "3f", error: INVALID_CBOR_ERROR_CODE },
    { type: "decode", hex: "", error: EOI_ERROR_CODE },
    { type: "decode", hex: "3bffffffffffffff", error: EOI_ERROR_CODE },
  ]
);
