import { CborType } from "../base";
import { AnyContextArgs, ICborType } from "../types";
import { UnexpectedValueError } from "../UnexpectedValueError";

/**
 *
 * Example:
 *
 * ```ts
 * // two is a CBOR type that encodes and decodes nubmer 2.
 * const two = u8.pipe(constant(2))
 * ```
 *
 * @param expectedValue Value of the source type
 * @param isEqual Function tahat compares the expected value with the actual one
 * @returns a operator that transforms a type into a constant value type
 */
declare function constant<In, const V extends In>(
  expectedValue: V,
  isEqual?: (exp: NoInfer<V>, b: NoInfer<In>) => boolean
): <
  EE extends Error,
  DE extends Error,
  ECArgs extends AnyContextArgs,
  DCArgs extends AnyContextArgs
>(
  ty: ICborType<In, In, EE, DE, ECArgs, DCArgs>
) => CborType<
  V,
  V,
  EE | UnexpectedValueError<In, V>,
  DE | UnexpectedValueError<In, V>,
  ECArgs,
  DCArgs
>;
