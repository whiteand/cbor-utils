import { OkResult, Result, ok } from "resultra";
import { CborType } from "../base";
import { TAG_TYPE } from "../constants";
import { DecodingError } from "../DecodingError";
import { TaggedDataItem } from "../default/DataItem";
import { EndOfInputError, getEoiResult } from "../EndOfInputError";
import { getTypeString } from "../getTypeString";
import { InvalidCborError } from "../InvalidCborError";
import { getType } from "../marker";
import { OverflowError } from "../OverflowError";
import { readArg } from "../readArg";
import { TypeMismatchError } from "../TypeMismatchError";
import { ICborTypeCodec, IDecoder, IEncodable, IEncoder } from "../types";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { done } from "../utils/done";
import { writeTypeAndArg } from "../writeTypeAndArg";

function sameTag(v: number | bigint, tag: number | bigint) {
  if (typeof v === "number" && typeof tag === "number") {
    return v === tag;
  }
  return BigInt(v) === BigInt(tag);
}

function encodeTagged<T, E extends Error, C>(
  e: IEncoder,
  ty: IEncodable<T, E, C>,
  value: TaggedDataItem<T>,
  ctx: C
) {
  return writeTypeAndArg(e, TAG_TYPE, value.tag).andThen(() =>
    ty.encode(value.value, e, ctx)
  );
}

function decodeTag(
  d: IDecoder
): Result<
  number | bigint,
  TypeMismatchError | EndOfInputError | InvalidCborError
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
  if (tagRes.value == null) {
    return new InvalidCborError(
      marker,
      p,
      new Error(`Tag cannot be null`)
    ).err();
  }
  return tagRes as OkResult<number | bigint>;
}

export function tagged(
  tag: number | bigint
): <T, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<T, T, EE, DE, EC, DC>
) => ICborTypeCodec<
  TaggedDataItem<T>,
  TaggedDataItem<T>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
export function tagged(): <T, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<T, T, EE, DE, EC, DC>
) => ICborTypeCodec<
  TaggedDataItem<T>,
  TaggedDataItem<T>,
  EE | OverflowError,
  DE | DecodingError,
  EC,
  DC
>;

export function tagged(
  tag?: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
) => ICborTypeCodec<
  TaggedDataItem<ET>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
> {
  return <ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
  ): ICborTypeCodec<
    TaggedDataItem<ET>,
    TaggedDataItem<DT>,
    EE | OverflowError,
    DE | DecodingError,
    EC,
    DC
  > =>
    tag == null
      ? CborType.builder()
          .encode(
            (
              value: TaggedDataItem<ET>,
              e: IEncoder,
              ctx: EC
            ): Result<void, EE | OverflowError> =>
              encodeTagged(e, ty, value, ctx)
          )
          .decode(
            (
              d: IDecoder,
              ctx: DC
            ): Result<TaggedDataItem<DT>, DE | DecodingError> => {
              const tRes = decodeTag(d);
              if (!tRes.ok()) return tRes;
              const t = tRes.value;
              const value = ty.decode(d, ctx);
              if (!value.ok()) return value;
              return ok(new TaggedDataItem(t, value.value));
            }
          )
          .build()
      : CborType.builder()
          .encode(
            (
              value: TaggedDataItem<ET>,
              e: IEncoder,
              ctx: EC
            ): Result<void, EE | OverflowError> =>
              sameTag(value.tag, tag)
                ? encodeTagged(e, ty, value, ctx)
                : new UnexpectedValueError(tag, value.tag).err()
          )
          .decode(
            (
              d: IDecoder,
              ctx: DC
            ): Result<TaggedDataItem<DT>, DE | DecodingError> => {
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
}
