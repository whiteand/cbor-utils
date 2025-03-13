export const NUMBER_TYPE: number = 0b000;
export const NEGATIVE_INT_TYPE: number = 0b001;
export const BYTES_TYPE: number = 0b010;
export const STRING_TYPE: number = 0b011;
export const ARRAY_TYPE: number = 0b100;
export const MAP_TYPE: number = 0b101;
export const TAG_TYPE: number = 0b110;
export const SPECIAL_TYPE: number = 0b111;

export const NUMBER_TYPE_MASK: number = NUMBER_TYPE << 5;
export const TAG_TYPE_MASK: number = TAG_TYPE << 5;
export const BYTES_TYPE_MASK: number = BYTES_TYPE << 5;
export const NEGATIVE_INT_TYPE_MASK: number = NEGATIVE_INT_TYPE << 5;
export const SPECIAL_TYPE_MASK: number = SPECIAL_TYPE << 5;
export const MAP_TYPE_MASK: number = MAP_TYPE << 5;
export const STRING_TYPE_MASK: number = STRING_TYPE << 5;
export const ARRAY_TYPE_MASK: number = ARRAY_TYPE << 5;

export const NULL_BYTE: number = SPECIAL_TYPE_MASK | 22;

export const BREAK_BYTE: number = SPECIAL_TYPE_MASK | 31;
