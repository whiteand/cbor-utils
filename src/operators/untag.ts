import { ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { flatMap } from "./flatMap";
import { ICborType } from "../types";
import { TaggedDataItem } from "../default/DataItem";

export function untag(
  tag: number | bigint,
  name: string,
): <T, EE, DE>(
  ty: ICborType<TaggedDataItem<T>, void, EE, void, DE>,
) => CborType<T, void, unknown, void, TypeMismatchError | DE>;
export function untag(
  tag: number | bigint,
  name: string,
): <T, EC, EE, DC, DE>(
  ty: ICborType<TaggedDataItem<T>, EC, EE, DC, DE>,
) => CborType<T, EC, unknown, DC, TypeMismatchError | DE>;
export function untag(
  tag: number | bigint,
  name: string,
): <T, EE, DE>(
  ty: ICborType<TaggedDataItem<T>, any, EE, any, DE>,
) => CborType<T, any, unknown, any, TypeMismatchError | DE> {
  return <T, EE, DE>(ty: ICborType<TaggedDataItem<T>, any, EE, any, DE>) =>
    flatMap(
      (v: T) => ok(new TaggedDataItem(tag, v)),
      (t: TaggedDataItem<T>) => {
        if (t.tag !== tag) {
          return new TypeMismatchError(
            name,
            `Invalid tag for ${name}: ${t.tag}`,
          ).err();
        }
        return ok(t.value);
      },
    )(ty);
}
