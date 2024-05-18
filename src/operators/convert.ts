import { CborType } from "../base";
import { ICborType } from "../types";

/**
 * Example:
 *
 * ```ts
 * // byteString is a CBOR type that decodes u8 and converts it to string. Also converts string and encodes it to u8.
 * const byteString = u8.pipe(
 *   convert<string, number>(
 *     s => Number.parseInt(s, 10),
 *     n => n.toString(10)
 *   )
 * )
 * ```
 *
 * @param fromTarget function that maps target type to source type
 * @param toTarget functin that maps source type to target type
 * @returns an operator that converts source type to target type during decoding and converts target type to source type during encoding.
 */
export function convert<Target, Source>(
  fromTarget: (value: Target) => NoInfer<Source>,
  toTarget: (value: Source) => Target
): <EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<Source, EE, DE, EC, DC>
) => CborType<Target, EE, DE, EC, DC> {
  return <EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<Source, EE, DE, EC, DC>
  ): CborType<Target, EE, DE, EC, DC> =>
    CborType.from(ty).convert(toTarget, fromTarget);
}
