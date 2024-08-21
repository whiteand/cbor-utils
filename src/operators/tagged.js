import { ok } from "resultra";
import { CborType } from "../base";
import { TAG_TYPE } from "../constants";
import { TaggedDataItem } from "../default/DataItem";
import { getEoiResult } from "../EndOfInputError";
import { getTypeString } from "../getTypeString";
import { InvalidCborError } from "../InvalidCborError";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { done } from "../utils/done";
import { writeTypeAndArg } from "../writeTypeAndArg";

function sameTag(v, tag) {
  if (typeof v === "number" && typeof tag === "number") {
    return v === tag;
  }
  return BigInt(v) === BigInt(tag);
}

function encodeTagged(e, ty, value, ctx) {
  return writeTypeAndArg(e, TAG_TYPE, value.tag).andThen(() =>
    ty.encode(value.value, e, ctx)
  );
}

function decodeTag(d) {
  if (done(d)) return getEoiResult();
  const p = d.ptr;
  const marker = d.buf[p];
  const typ = getType(marker);
  if (typ !== TAG_TYPE) {
    return new TypeMismatchError("tagged", getTypeString(marker)).err();
  }
  const tagRes = readArg(d);
  if (!tagRes.ok()) return tagRes;
  if (tagRes.value == null) {
    return new InvalidCborError(
      marker,
      p,
      new Error(`Tag cannot be null`)
    ).err();
  }
  return tagRes;
}

export function tagged(tag) {
  return tag == null
    ? (inner) => {
        const proto = CborType.builder()
          .encode(function encode(value, e, ctx) {
            return encodeTagged(e, this.inner, value, ctx);
          })
          .decode(function decode(d, ctx) {
            const tRes = decodeTag(d);
            if (!tRes.ok()) return tRes;
            const t = tRes.value;
            const value = this.inner.decode(d, ctx);
            if (!value.ok()) return value;
            return ok(new TaggedDataItem(t, value.value));
          })
          .build();

        const taggedType = Object.create(proto);

        taggedType.inner = inner;

        return taggedType;
      }
    : (ty) => {
        const proto = CborType.builder()
          .encode((value, e, ctx) =>
            sameTag(value.tag, tag)
              ? encodeTagged(e, ty, value, ctx)
              : new UnexpectedValueError(tag, value.tag).err()
          )
          .decode((d, ctx) => {
            const tRes = decodeTag(d);
            if (!tRes.ok()) return tRes;
            const t = tRes.value;
            if (!sameTag(t, tag)) {
              return new UnexpectedValueError(tag, t).err();
            }
            const value = ty.decode(d, ctx);
            if (!value.ok()) return value;
            return ok(new TaggedDataItem(t, value.value));
          })
          .build();

        return proto;
      };
}
