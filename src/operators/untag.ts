import { Result, ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { flatMap } from "./flatMap";
import { ICborType } from "../types";
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
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<TaggedDataItem<ET>, TaggedDataItem<DT>, EE, DE, EC, DC>
) => CborType<ET, DT, EE, TypeMismatchError | DE, EC, DC> {
  return <ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<TaggedDataItem<ET>, TaggedDataItem<DT>, EE, DE, EC, DC>
  ) =>
    flatMap<
      TaggedDataItem<ET>,
      ET,
      TaggedDataItem<DT>,
      DT,
      never,
      TypeMismatchError,
      unknown,
      unknown
    >(
      (v: ET): Result<TaggedDataItem<ET>, never> =>
        ok(new TaggedDataItem(tag, v)),
      (t: TaggedDataItem<DT>): Result<DT, TypeMismatchError> => {
        if (t.tag !== tag) {
          return new TypeMismatchError(
            name,
            `Invalid tag for ${name}: ${t.tag}`
          ).err();
        }
        return ok(t.value);
      }
    )(ty);
}
