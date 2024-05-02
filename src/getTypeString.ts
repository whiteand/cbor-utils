import {
  ARRAY_TYPE_MASK,
  BYTES_TYPE_MASK,
  MAP_TYPE_MASK,
  NEGATIVE_INT_TYPE_MASK,
  NUMBER_TYPE_MASK,
  SPECIAL_TYPE_MASK,
  STRING_TYPE_MASK,
  TAG_TYPE_MASK,
} from "./constants";

const invalid = "invalid";
const simple = "simple";
const reserved = "reserved";
const TYPE_TABLE = [
  [NUMBER_TYPE_MASK | 0, "u8"],
  [NUMBER_TYPE_MASK | 25, "u16"],
  [NUMBER_TYPE_MASK | 26, "u32"],
  [NUMBER_TYPE_MASK | 27, "u64"],
  [NUMBER_TYPE_MASK | 28, "u128"],
  [NUMBER_TYPE_MASK | 29, reserved],
  [NUMBER_TYPE_MASK | 31, invalid],
  [NEGATIVE_INT_TYPE_MASK | 0, "n8"],
  [NEGATIVE_INT_TYPE_MASK | 25, "n16"],
  [NEGATIVE_INT_TYPE_MASK | 26, "n32"],
  [NEGATIVE_INT_TYPE_MASK | 27, "n64"],
  [NEGATIVE_INT_TYPE_MASK | 28, "n128"],
  [NEGATIVE_INT_TYPE_MASK | 29, invalid],
  [BYTES_TYPE_MASK | 0, "bytes"],
  [STRING_TYPE_MASK | 0, "string"],
  [ARRAY_TYPE_MASK | 0, "array"],
  [MAP_TYPE_MASK | 0, "map"],
  [TAG_TYPE_MASK | 0, "strtime_tag"],
  [TAG_TYPE_MASK | 1, "epochtime_tag"],
  [TAG_TYPE_MASK | 2, "ubignum_tag"],
  [TAG_TYPE_MASK | 3, "nbignum_tag"],
  [TAG_TYPE_MASK | 4, "tag"],
  [TAG_TYPE_MASK | 31, invalid],
  [SPECIAL_TYPE_MASK | 0, simple],
  [SPECIAL_TYPE_MASK | 20, "bool"],
  [SPECIAL_TYPE_MASK | 22, "null"],
  [SPECIAL_TYPE_MASK | 23, "undefined"],
  [SPECIAL_TYPE_MASK | 24, simple],
  [SPECIAL_TYPE_MASK | 25, "f16"],
  [SPECIAL_TYPE_MASK | 26, "f32"],
  [SPECIAL_TYPE_MASK | 28, reserved],
  [SPECIAL_TYPE_MASK | 31, "break"],
] as const;

function slow(marker: number) {
  let ptr = 0;
  while (ptr < TYPE_TABLE.length && TYPE_TABLE[ptr][0] <= marker) ptr++;
  ptr--;

  return TYPE_TABLE[ptr][1];
}

const generateMap = (() => {
  const res: TypeString[] = [];
  return (marker: number) => {
    if (marker <= 255) {
      while (res.length <= marker) {
        res.push(slow(res.length));
      }
    }
    return res;
  };
})();

export type TypeString = (typeof TYPE_TABLE)[number][1];

export function getTypeString(marker: number): TypeString {
  return generateMap(marker)[marker] || invalid;
}
