/** Represents number major type */
export const NUMBER_TYPE: number = 0b000;

/** Represents negativeint major type */
export const NEGATIVE_INT_TYPE: number = 0b001;

/** Represents bytes major type */
export const BYTES_TYPE: number = 0b010;

/** Represents string major type */
export const STRING_TYPE: number = 0b011;

/** Represents array major type */
export const ARRAY_TYPE: number = 0b100;

/** Represents map major type */
export const MAP_TYPE: number = 0b101;

/** Represents tag major type */
export const TAG_TYPE: number = 0b110;

/** Represents special major type */
export const SPECIAL_TYPE: number = 0b111;

/** Represents a mask that can be attached to info number
 * to assign number major type to it
 */
export const NUMBER_TYPE_MASK: number = NUMBER_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign tag major type to it
 */
export const TAG_TYPE_MASK: number = TAG_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign bytes major type to it
 */
export const BYTES_TYPE_MASK: number = BYTES_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign negative_int major type to it
 */
export const NEGATIVE_INT_TYPE_MASK: number = NEGATIVE_INT_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign special major type to it
 */
export const SPECIAL_TYPE_MASK: number = SPECIAL_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign map major type to it
 */
export const MAP_TYPE_MASK: number = MAP_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign string major type to it
 */
export const STRING_TYPE_MASK: number = STRING_TYPE << 5;

/** Represents a mask that can be attached to info number
 * to assign array major type to it
 */
export const ARRAY_TYPE_MASK: number = ARRAY_TYPE << 5;

/** Cbor representation of `null` */
export const NULL_BYTE: number = SPECIAL_TYPE_MASK | 22;

/**
 * Cbor representation of the end of stream.
 * It is used to indicate the end of map or array streams
 */
export const BREAK_BYTE: number = SPECIAL_TYPE_MASK | 31;
