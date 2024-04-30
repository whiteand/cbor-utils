import { ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { flatMap } from "./flatMap";
import { ICborType } from "../types";
import { TaggedDataItem } from "../default/DataItem";

export function untag(
  tag: number | bigint,
  name: string
): <T, EC, EE, DC, DE>(
  ty: ICborType<TaggedDataItem<T>, EC, EE, DC, DE>
) => CborType<T, EC, unknown, DC, TypeMismatchError | DE> {
  return <T, EC, EE, DC, DE>(
    ty: ICborType<TaggedDataItem<T>, EC, EE, DC, DE>
  ) =>
    flatMap(
      (v: T) => ok(new TaggedDataItem(tag, v)),
      (t: TaggedDataItem<T>) => {
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
