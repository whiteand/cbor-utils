import {
  ARRAY_TYPE,
  BYTES_TYPE,
  MAP_TYPE,
  NEGATIVE_INT_TYPE,
  NUMBER_TYPE,
  SPECIAL_TYPE,
  STRING_TYPE,
  TAG_TYPE,
} from "../constants";

export type MajorType =
  | typeof NUMBER_TYPE
  | typeof NEGATIVE_INT_TYPE
  | typeof BYTES_TYPE
  | typeof STRING_TYPE
  | typeof ARRAY_TYPE
  | typeof MAP_TYPE
  | typeof TAG_TYPE
  | typeof SPECIAL_TYPE;
