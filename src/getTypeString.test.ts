import {
  NUMBER_TYPE_MASK,
  NEGATIVE_INT_TYPE_MASK,
  BYTES_TYPE_MASK,
  STRING_TYPE_MASK,
  ARRAY_TYPE_MASK,
  MAP_TYPE_MASK,
  TAG_TYPE_MASK,
  SPECIAL_TYPE_MASK,
} from "./constants";
import { TypeString, getTypeString } from "./getTypeString";
import { describe, it, expect } from "vitest";

const TYPE_TABLE: Array<[number, TypeString]> = [
  [NUMBER_TYPE_MASK | 0, "u8"],
  [NUMBER_TYPE_MASK | 25, "u16"],
  [NUMBER_TYPE_MASK | 26, "u32"],
  [NUMBER_TYPE_MASK | 27, "u64"],
  [NUMBER_TYPE_MASK | 28, "u128"],
  [NUMBER_TYPE_MASK | 29, "reserved"],
  [NUMBER_TYPE_MASK | 31, "invalid"],
  [NEGATIVE_INT_TYPE_MASK | 0, "n8"],
  [NEGATIVE_INT_TYPE_MASK | 25, "n16"],
  [NEGATIVE_INT_TYPE_MASK | 26, "n32"],
  [NEGATIVE_INT_TYPE_MASK | 27, "n64"],
  [NEGATIVE_INT_TYPE_MASK | 28, "n128"],
  [NEGATIVE_INT_TYPE_MASK | 29, "invalid"],
  [BYTES_TYPE_MASK | 0, "bytes"],
  [STRING_TYPE_MASK | 0, "string"],
  [ARRAY_TYPE_MASK | 0, "array"],
  [MAP_TYPE_MASK | 0, "map"],
  [TAG_TYPE_MASK | 0, "tag"],
  [TAG_TYPE_MASK | 31, "invalid"],
  [SPECIAL_TYPE_MASK | 0, "simple"],
  [SPECIAL_TYPE_MASK | 20, "bool"],
  [SPECIAL_TYPE_MASK | 22, "null"],
  [SPECIAL_TYPE_MASK | 23, "undefined"],
  [SPECIAL_TYPE_MASK | 24, "simple"],
  [SPECIAL_TYPE_MASK | 25, "f16"],
  [SPECIAL_TYPE_MASK | 26, "f32"],
  [SPECIAL_TYPE_MASK | 28, "reserved"],
  [SPECIAL_TYPE_MASK | 31, "break"],
] as const;

describe("getTypeString", () => {
  it("has proper types", () => {
    for (let i = 0; i < 256; i++) {
      let ind = TYPE_TABLE.findIndex((x) => x[0] > i);
      if (ind < 0) {
        ind = TYPE_TABLE.length - 1;
      } else {
        ind--;
      }
      expect(getTypeString(i)).toBe(TYPE_TABLE[ind][1]);
    }
  });
});
