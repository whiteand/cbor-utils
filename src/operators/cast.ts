import { CborType } from "../base";
import { ICborType } from "../types";

/**
 *
 * Example:
 *
 * ```ts
 * // two is a CBOR type that encodes and decodes a number 2.
 * const two = cast<number, 2>()(u8)
 *
 * @warning This operator does not ensures that the value is actually of the type your are casting to.
 *
 * @returns an operator that casts a type to a more specific type
 */
export function cast<From, To extends From>(): <
  EE extends Error,
  DE extends Error,
  EC,
  DC
>(
  ty: ICborType<From, EE, DE, EC, DC>
) => CborType<To, EE, DE, EC, DC> {
  return <EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<From, EE, DE, EC, DC>
  ) => CborType.from(ty as unknown as CborType<To, EE, DE, EC, DC>);
}
