import { Result, ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { flatMap } from "./flatMap";
import { ICborTypeCodec } from "../types";
import { TaggedDataItem } from "../default/DataItem";

export function untag(
  tag: number | bigint,
  name: string
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<TaggedDataItem<ET>, TaggedDataItem<DT>, EE, DE, EC, DC>
) => CborType<ET, DT, EE, TypeMismatchError | DE, EC, DC> {
  return <ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborTypeCodec<TaggedDataItem<ET>, TaggedDataItem<DT>, EE, DE, EC, DC>
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
