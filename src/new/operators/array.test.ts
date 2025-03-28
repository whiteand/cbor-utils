import { u8 } from "../default/uint";
import { array } from "./array";
import { testCborType } from "../test-utils";
import {
  EOI_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
} from "../error-codes";

const arrayOfBytes = u8.pipe(array());

testCborType(
  "u8[]",
  arrayOfBytes,
  [
    {
      decoded: [],
      hex: "80",
    },
    {
      decoded: [1, 2],
      hex: "820102",
    },
  ],
  [
    {
      type: "decode",
      hex: "820180",
      error: TYPE_MISMATCH_ERROR_CODE,
    },
    {
      type: "decode",
      hex: "8201",
      error: EOI_ERROR_CODE,
    },
    {
      type: "decode",
      hex: "82011903e8",
      error: OVERFLOW_ERROR_CODE,
    },
  ]
);
