import { CborType } from "../base";
import { DecodingError } from "../DecodingError";
import { OverflowError } from "../OverflowError";
import { ICborType } from "../types";

/**
 * Example:
 *
 * ```ts
 * import { array, u8 } from '@whiteand/cbor'
 *
 * // u8Array is a CBOR type that encodes u8[]
 * const u8Array = u8.pipe(array())
 * ```
 *
 * @returns An operator that creates an array type from a element type
 */
declare function array(): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  readonly ET[],
  DT[],
  EE | OverflowError,
  DE | DecodingError,
  EC,
  DC
>;
