import { Result } from "resultra";
import { CborType } from "../base";
import { ICborType, IDecoder, IEncoder, NotImportant } from "../types";

/**
 * Given a source type (sourceTy) that handles values of type S, creates a target type (targetTy)
 * that handles values of type T. The transformation between S and T is handled by the provided
 * encoding and decoding functions, while maintaining type safety and proper error handling.
 *
 * When encoding: `T -> newEncode -> S -> sourceTy.encode -> bytes`
 *
 * When decoding: `bytes -> sourceTy.decode -> S -> newDecode -> T`
 *
 * @param newEncode - Function that transforms T to S before encoding.
 *                   Receives a value of type T and context, must return a Result
 *                   containing either a value of type S or an error.
 *                   The S value will be encoded using the source type.
 *
 * @param newDecode - Function that transforms S to T after decoding.
 *                   Receives the decoded S value, decoder instance, context, and start position.
 *                   Must return a Result containing either a value of type T or an error.
 *                   Called after sourceTy successfully decodes a value.
 *
 * @param nullable - Controls whether targetTy allows null values.
 *                  When true, null values are accepted during encoding/decoding.
 *                  When not provided, inherits nullability from sourceTy.
 *
 * @returns A function that takes sourceTy and returns targetTy with the
 *          specified transformations applied.
 *
 * @example
 * ```typescript
 * import { u32, ok, err } from '@whiteand/cbor';
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
 * ```
 */
export function flatMap<
  OldEncodedType,
  NewEncodedType,
  OldDecodedType,
  NewDecodedType,
  NEE extends Error,
  NDE extends Error,
  NEC,
  NDC
>(
  newEncode: (
    value: NewEncodedType,
    ctx: NEC
  ) => Result<NoInfer<OldEncodedType>, NEE>,
  newDecode: (
    value: OldDecodedType,
    decoder: IDecoder,
    ctx: NDC,
    startPosition: number
  ) => Result<NewDecodedType, NDE>,
  nullable?: boolean
): <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
  ty: ICborType<OldEncodedType, OldDecodedType, EE, DE, EC, DC>
) => CborType<
  NewEncodedType,
  NewDecodedType,
  NEE | EE,
  NDE | DE,
  NEC & EC,
  NDC & DC
> {
  return <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
    ty: ICborType<OldEncodedType, OldDecodedType, EE, DE, EC, DC>
  ): CborType<
    NewEncodedType,
    NewDecodedType,
    NEE | EE,
    NDE | DE,
    NEC & EC,
    NDC & DC
  > => {
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
}
