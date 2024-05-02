import { OkResult, Result, ok } from "resultra";
import { ICborType, IDecoder, IEncodableType, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { readArg } from "../readArg";
import { TAG_TYPE } from "../constants";
import { getType } from "../marker";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { DecodingError } from "../DecodingError";
import { getTypeString } from "../getTypeString";
import { TaggedDataItem } from "../default/DataItem";
import { InvalidCborError } from "../InvalidCborError";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { done } from "../utils/done";
import { UnexpectedValueError } from "../UnexpectedValueError";

function sameTag(v: number | bigint, tag: number | bigint) {
  if (typeof v === "number" && typeof tag === "number") {
    return v === tag;
  }
  return BigInt(v) === BigInt(tag);
}

function encodeTagged<T, C, E>(
  e: IEncoder,
  ty: IEncodableType<T, C, E>,
  value: TaggedDataItem<T>,
  ctx: C,
) {
  let res = writeTypeAndArg(e, TAG_TYPE, value.tag);
  if (!res.ok()) {
    return res;
  }
  return ty[encodeSymbol](value.value, e, ctx);
}

function decodeTag(
  d: IDecoder,
): Result<
  number | bigint,
  TypeMismatchError | EndOfInputError | InvalidCborError
> {
  if (done(d)) return EOI_ERR;
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
      new Error(`Tag cannot be null`),
    ).err();
  }
  return tagRes as OkResult<number | bigint>;
}

export function tagged(
  tag: number | bigint,
): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => ICborType<
  TaggedDataItem<T>,
  EC,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DC,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>
>;
export function tagged(): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => ICborType<
  TaggedDataItem<T>,
  EC,
  EE | OverflowError,
  DC,
  DE | DecodingError
>;
export function tagged(
  tag?: number | bigint,
): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => ICborType<
  TaggedDataItem<T>,
  EC,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DC,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>
> {
  return <T, EC, EE, DC, DE>(
    ty: ICborType<T, EC, EE, DC, DE>,
  ): ICborType<
    TaggedDataItem<T>,
    EC,
    EE | OverflowError,
    DC,
    DE | DecodingError
  > =>
    tag == null
      ? new CborType(
          (
            value: TaggedDataItem<T>,
            e: IEncoder,
            ctx: EC,
          ): Result<void, EE | OverflowError> => {
            return encodeTagged(e, ty, value, ctx);
          },
          (
            d: IDecoder,
            ctx: DC,
          ): Result<TaggedDataItem<T>, DE | DecodingError> => {
            const tRes = decodeTag(d);
            if (!tRes.ok()) return tRes;
            const t = tRes.value;
            const value = ty[decodeSymbol](d, ctx);
            if (!value.ok()) return value;
            return ok(new TaggedDataItem(t, value.value));
          },
        )
      : new CborType(
          (
            value: TaggedDataItem<T>,
            e: IEncoder,
            ctx: EC,
          ): Result<void, EE | OverflowError> => {
            if (!sameTag(value.tag, tag)) {
              return new UnexpectedValueError(tag, value.tag).err();
            }
            return encodeTagged(e, ty, value, ctx);
          },
          (
            d: IDecoder,
            ctx: DC,
          ): Result<TaggedDataItem<T>, DE | DecodingError> => {
            const tRes = decodeTag(d);
            if (!tRes.ok()) return tRes;
            const t = tRes.value;
            if (!sameTag(t, tag)) {
              return new UnexpectedValueError(tag, t).err();
            }
            const value = ty[decodeSymbol](d, ctx);
            if (!value.ok()) return value;
            return ok(new TaggedDataItem(t, value.value));
          },
        );
}
