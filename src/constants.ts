export const NUMBER_TYPE = 0b000;
export const NEGATIVE_INT_TYPE = 0b001;
export const BYTES_TYPE = 0b010;
export const STRING_TYPE = 0b011;
export const ARRAY_TYPE = 0b100;
export const MAP_TYPE = 0b101;
export const TAG_TYPE = 0b110;
export const SPECIAL_TYPE = 0b111;

export const NUMBER_TYPE_MASK = NUMBER_TYPE << 5;
export const TAG_TYPE_MASK = TAG_TYPE << 5;
export const BYTES_TYPE_MASK = BYTES_TYPE << 5;
export const NEGATIVE_INT_TYPE_MASK = NEGATIVE_INT_TYPE << 5;
export const SPECIAL_TYPE_MASK = SPECIAL_TYPE << 5;
export const MAP_TYPE_MASK = MAP_TYPE << 5;
export const STRING_TYPE_MASK = STRING_TYPE << 5;
export const ARRAY_TYPE_MASK = ARRAY_TYPE << 5;

export const NULL_BYTE = SPECIAL_TYPE_MASK | 22;

export const BREAK_BYTE = SPECIAL_TYPE_MASK | 31;
