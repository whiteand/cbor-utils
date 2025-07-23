import { ok, Result } from "resultra";
import { CborType } from "../base";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { AnyContextArgs, ICborType, IDecoder, IEncoder, Z } from "../types";

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
 *
 * NOTE: A returning type is nullable if source type is nullable.
 * But in this case decodeNull is redefined to return expectedValue.
 */
export function constant<In, const V extends In>(
  expectedValue: V,
  isEqual: (exp: NoInfer<V>, b: NoInfer<In>) => boolean = Object.is
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
> {
  return <
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >(
    ty: ICborType<In, In, EE, DE, ECArgs, DCArgs>
  ) => {
    interface IConstant {
      expectedValue: V;
      isEqual(exp: NoInfer<V>, b: NoInfer<In>): boolean;
    }

    const proto = CborType.builder()
      .encode(function encode(
        this: IConstant,
        value: V,
        e: IEncoder,
        ...ctx: ECArgs
      ): Result<void, EE | UnexpectedValueError<In, V>> {
        const { expectedValue } = this;
        if (!this.isEqual(value, expectedValue)) {
          return new UnexpectedValueError(expectedValue, value).err();
        }
        return (ty.encode as Z)(value, e, ...ctx);
      })
      .decode(function decode(
        this: IConstant,
        d: IDecoder,
        ...ctx: DCArgs
      ): Result<V, DE | UnexpectedValueError<In, V>> {
        const v = (ty.decode as Z)(d, ...ctx);
        if (!v.ok()) {
          return v;
        }
        const { expectedValue } = this;
        if (!this.isEqual(expectedValue, v.value)) {
          return new UnexpectedValueError(expectedValue, v.value).err();
        }
        return ok(v.value as V);
      })
      .nullable(ty.nullable)
      .isNull(function isNull(this: IConstant, value, ...ctx) {
        return ty.isNull(value, ...ctx);
      })
      .decodeNull(() => expectedValue)
      .build();

    const constantType = Object.create(proto);

    Object.assign(constantType, {
      expectedValue,
      isEqual,
    });

    return constantType as Z as CborType<
      V,
      V,
      EE | UnexpectedValueError<In, V>,
      DE | UnexpectedValueError<In, V>,
      ECArgs,
      DCArgs
    >;
  };
}
