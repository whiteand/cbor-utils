import { Result, ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { AnyContextArgs, ICborType, IDecoder, IEncoder } from "../types";
import { TaggedDataItem } from "../default/TaggedDataItem";

/**
 * Unwraps decoded tagged data item
 * if it has the specified tag.
 *
 * Wraps encoded value into tagged data item with the specified tag.
 *
 * @param tag required tag value
 * @param name name of the type to use in error messages
 * @returns new cbor type that wraps original into tagged data item
 */
export function untag(
  tag: number | bigint,
  name: string
): <
  ET,
  DT,
  EE extends Error,
  DE extends Error,
  ECArgs extends AnyContextArgs,
  DCArgs extends AnyContextArgs
>(
  ty: ICborType<TaggedDataItem<ET>, TaggedDataItem<DT>, EE, DE, ECArgs, DCArgs>
) => CborType<ET, DT, EE, TypeMismatchError | DE, ECArgs, DCArgs> {
  return <
    ET,
    DT,
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >(
    ty: ICborType<
      TaggedDataItem<ET>,
      TaggedDataItem<DT>,
      EE,
      DE,
      ECArgs,
      DCArgs
    >
  ) =>
    new CborType(
      (value: ET, e: IEncoder, ...ctx: ECArgs): Result<void, EE> => {
        return ty.encode(new TaggedDataItem(tag, value), e, ...ctx);
      },
      (d: IDecoder, ...ctx: DCArgs): Result<DT, TypeMismatchError | DE> => {
        const tRes = ty.decode(d, ...ctx);
        if (!tRes.ok()) return tRes;
        const t = tRes.value;
        if (t.tag !== tag) {
          return new TypeMismatchError(
            name,
            `Invalid tag for ${name}: ${t.tag}`
          ).err();
        }
        return ok(t.value);
      },
      ty.nullable,
      (value, ...ctx) => {
        return ty.isNull(new TaggedDataItem(tag, value), ...ctx);
      },
      (...ctx) => {
        const value = ty.decodeNull(...ctx);
        return value.value;
      }
    );
}
