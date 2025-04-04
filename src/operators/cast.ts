import { CborType } from "../base";
import { AnyContextArgs, ICborType } from "../types";

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
export function cast<FromE, ToE extends FromE, FromD = FromE, ToD = ToE>(): <
  EE extends Error,
  DE extends Error,
  ECArgs extends AnyContextArgs,
  DCArgs extends AnyContextArgs
>(
  ty: ICborType<FromE, FromD, EE, DE, ECArgs, DCArgs>
) => CborType<ToE, ToD, EE, DE, ECArgs, DCArgs> {
  return <
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >(
    ty: ICborType<FromE, FromD, EE, DE, ECArgs, DCArgs>
  ) =>
    CborType.from(ty as unknown as CborType<ToE, ToD, EE, DE, ECArgs, DCArgs>);
}
