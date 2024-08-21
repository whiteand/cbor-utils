import { Result, ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { flatMap } from "./flatMap";
import { ICborTypeCodec } from "../types";
import { TaggedDataItem } from "../default/DataItem";

export function untag(
  tag: number | bigint,
  name: string
): <T, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<TaggedDataItem<T>, TaggedDataItem<T>, EE, DE, EC, DC>
) => CborType<T, T, EE, TypeMismatchError | DE, EC, DC> {
  return <T, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborTypeCodec<TaggedDataItem<T>, TaggedDataItem<T>, EE, DE, EC, DC>
  ) =>
    flatMap<
      TaggedDataItem<T>,
      T,
      TaggedDataItem<T>,
      T,
      never,
      TypeMismatchError,
      unknown,
      unknown
    >(
      (v: T): Result<TaggedDataItem<T>, never> =>
        ok(new TaggedDataItem(tag, v)),
      (t: TaggedDataItem<T>): Result<T, TypeMismatchError> => {
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
