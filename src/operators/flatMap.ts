import { Result } from "resultra";
import { CborType } from "../base";
import { ICborType, IDecoder, IEncoder, NotImportant } from "../types";

type TFlatMap = <
  OldEncodedType,
  NewEncodedType,
  OldDecodedType,
  NewDecodedType,
  NEE extends Error,
  NDE extends Error,
  NEC,
  NDC
>(
  newEnc: (
    value: NewEncodedType,
    ctx: NEC
  ) => Result<NoInfer<OldEncodedType>, NEE>,
  newDec: (
    value: OldDecodedType,
    decoder: IDecoder,
    ctx: NDC,
    startPosition: number
  ) => Result<NewDecodedType, NDE>,
  nullable?: boolean
) => <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
  ty: ICborType<OldEncodedType, OldDecodedType, EE, DE, EC, DC>
) => CborType<
  NewEncodedType,
  NewDecodedType,
  NEE | EE,
  NDE | DE,
  NEC & EC,
  NDC & DC
>;

/**
 * Creates a new CBOR type that transforms values during encoding and decoding.
 * This operator allows you to modify values before they are encoded and after they are decoded,
 * while maintaining type safety and proper error handling.
 *
 * @param newEncode - Function that transforms the source value before encoding.
 *                   Receives the source value and context, must return a Result
 *                   containing either the transformed value or an error.
 *                   The transformed value will be encoded using the source type.
 *
 * @param newDecode - Function that transforms the decoded value.
 *                   Receives the decoded value, decoder instance, context, and start position.
 *                   Must return a Result containing either the transformed value or an error.
 *                   Called after the source type successfully decodes a value.
 *
 * @param nullable - Controls whether the resulting type allows null values.
 *                  When true, null values are accepted during encoding/decoding.
 *                  When not provided, inherits nullability from the source type.
 *
 * @returns A function that takes a source CBOR type and returns a new CBOR type
 *          with the specified transformations applied.
 *
 * @example
 * import { u32, array, err } from '@whiteand/cbor';
 *
 * // Creates a type that only accepts non-zero u32 values
 * const nonZeroU32 = u32.pipe(
 *   flatMap(
 *     (nonZero: number): Result<number, never> => ok(nonZero),
 *     (maybeZero): Result<number, Error> => {
 *       if (maybeZero === 0) return err(new Error("Expected non-zero u32"));
 *       return ok(maybeZero)
 *     }
 *   )
 * )
 */
export const flatMap: TFlatMap = (newEncode, newDecode, nullable) => (ty) => {
  interface IObj {
    newEncode(
      value: NotImportant,
      ctx: NotImportant
    ): Result<NotImportant, NotImportant>;
    newDecode(
      value: NotImportant,
      d: NotImportant,
      ctx: NotImportant,
      startPosition: number
    ): Result<NotImportant, NotImportant>;
    sourceType: ICborType<
      NotImportant,
      NotImportant,
      NotImportant,
      NotImportant,
      NotImportant,
      NotImportant
    >;
  }

  const proto = CborType.builder()
    .encode(function encode(
      this: IObj,
      value: unknown,
      e: IEncoder,
      ctx: unknown
    ) {
      const innerValueRes = this.newEncode(value, ctx);
      if (!innerValueRes.ok()) {
        return innerValueRes;
      }

      const innerValue = innerValueRes.value;

      return this.sourceType.encode(innerValue, e, ctx);
    })
    .decode(function decode(this: IObj, d: IDecoder, ctx: unknown) {
      const startPosition = d.ptr;
      const inner = this.sourceType.decode(d, ctx);
      return inner.ok()
        ? this.newDecode(inner.value, d, ctx, startPosition)
        : inner;
    })
    .nullable(nullable ?? ty.nullable)
    .build();

  const obj = {
    newEncode,
    newDecode,
    sourceType: ty,
  };

  Reflect.setPrototypeOf(obj, proto);

  return obj as NotImportant;
};
