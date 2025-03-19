import { ok, Result } from "resultra";
import { CborType } from "../base";
import { TAG_TYPE } from "../constants";
import { TaggedDataItem } from "../default/TaggedDataItem";
import { EndOfInputError, getEoiResult } from "../EndOfInputError";
import { getTypeString } from "../getTypeString";
import { InvalidCborError } from "../InvalidCborError";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { done } from "../utils/done";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { DecodingError } from "../DecodingError";
import { OverflowError } from "../OverflowError";
import {
  AnyCborTypeCodec,
  ICborType,
  IDecodable,
  IDecoder,
  IEncodable,
  IEncoder,
  NotImportant,
} from "../types";

function sameTag(v: number | bigint, tag: number | bigint) {
  if (typeof v === "number" && typeof tag === "number") {
    return v === tag;
  }
  return BigInt(v) === BigInt(tag);
}

function encodeTagged<T, EE, EC>(
  e: IEncoder,
  ty: IEncodable<T, EE, EC>,
  value: TaggedDataItem<T>,
  ctx: EC
): Result<void, EE | OverflowError> {
  return writeTypeAndArg(e, TAG_TYPE, value.tag).andThen(() =>
    ty.encode(value.value, e, ctx)
  );
}

function decodeTag(
  d: IDecoder
): Result<
  number | bigint,
  EndOfInputError | TypeMismatchError | InvalidCborError
> {
  if (done(d)) return getEoiResult();
  const p = d.ptr;
  const marker = d.buf[p];
  const typ = getType(marker);
  if (typ !== TAG_TYPE) {
    return new TypeMismatchError("tagged", getTypeString(marker)).err();
  }
  const tagRes = readArg(d);
  if (!tagRes.ok()) return tagRes;
  const v = tagRes.value;
  if (v == null) {
    return new InvalidCborError(
      marker,
      p,
      new Error(`Tag cannot be null`)
    ).err();
  }
  return ok(v);
}

/**
 * Wraps a type into tagged data item
 * If tag is not provided, - any tag will be valid.
 * If tag is provided - only that value of tag will be valid.
 *
 * @param tag optional required tag
 */
export function tagged(
  tag: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  Readonly<TaggedDataItem<ET>>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
export function tagged(): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  Readonly<TaggedDataItem<ET>>,
  TaggedDataItem<DT>,
  EE | OverflowError,
  DE | DecodingError,
  EC,
  DC
>;
export function tagged(
  tag?: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  Readonly<TaggedDataItem<ET>>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
export function tagged(
  tag?: number | bigint
): (
  ty: CborType<
    NotImportant,
    NotImportant,
    Error,
    Error,
    NotImportant,
    NotImportant
  >
) => CborType<
  NotImportant,
  NotImportant,
  Error,
  Error,
  NotImportant,
  NotImportant
> {
  interface IInner {
    inner: IEncodable<NotImportant, NotImportant, NotImportant> &
      IDecodable<NotImportant, NotImportant, NotImportant>;
  }
  return tag == null
    ? function <ET, DT, EE extends Error, DE extends Error, EC, DC>(
        inner: AnyCborTypeCodec
      ): CborType<
        Readonly<TaggedDataItem<ET>>,
        TaggedDataItem<DT>,
        EE | OverflowError,
        DE | DecodingError,
        EC,
        DC
      > {
        const proto = CborType.builder()
          .encode(function (
            this: IInner,
            value: Readonly<TaggedDataItem<ET>>,
            e: IEncoder,
            ctx: EC
          ): Result<void, EE | OverflowError> {
            return encodeTagged<ET, EE, EC>(e, this.inner, value, ctx);
          })
          .decode(function decode(this: IInner, d: IDecoder, ctx: DC) {
            const tRes = decodeTag(d);
            if (!tRes.ok()) return tRes;
            const t = tRes.value;
            const value = this.inner.decode(d, ctx);
            if (!value.ok()) return value;
            return ok(new TaggedDataItem<DT>(t, value.value));
          })
          .build();

        const taggedType = Object.create(proto);

        taggedType.inner = inner;

        return taggedType;
      }
    : <ET, DT, EE extends Error, DE extends Error, EC, DC>(
        ty: ICborType<ET, DT, EE, DE, EC, DC>
      ): CborType<
        Readonly<TaggedDataItem<ET>>,
        TaggedDataItem<DT>,
        | EE
        | OverflowError
        | UnexpectedValueError<number | bigint, number | bigint>,
        | DE
        | DecodingError
        | UnexpectedValueError<number | bigint, number | bigint>,
        EC,
        DC
      > => {
        const proto = CborType.builder()
          .encode((value: Readonly<TaggedDataItem<ET>>, e: IEncoder, ctx: EC) =>
            sameTag(value.tag, tag)
              ? encodeTagged(e, ty, value, ctx)
              : new UnexpectedValueError(tag, value.tag).err()
          )
          .decode(
            (
              d: IDecoder,
              ctx: DC
            ): Result<
              TaggedDataItem<DT>,
              EndOfInputError | TypeMismatchError | InvalidCborError | DE
            > => {
              const tRes = decodeTag(d);
              if (!tRes.ok()) return tRes;
              const t = tRes.value;
              if (!sameTag(t, tag)) {
                return new UnexpectedValueError(tag, t).err();
              }
              const value = ty.decode(d, ctx);
              if (!value.ok()) return value;
              return ok(new TaggedDataItem(t, value.value));
            }
          )
          .build();

        return proto;
      };
}
