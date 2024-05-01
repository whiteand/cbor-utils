import { Result, ok } from "resultra";
import { ICborType, IDecodableType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { readArg } from "../readArg";
import { ARRAY_TYPE, TAG_TYPE } from "../constants";
import { okNull } from "../okNull";
import { getType } from "../marker";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { DecodingError } from "../DecodingError";
import { getTypeString } from "../getTypeString";
import { TaggedDataItem } from "../default/DataItem";
import { InvalidCborError } from "../InvalidCborError";
import { EOI, EOI_ERR } from "../EndOfInputError";
import { done } from "../utils/done";

export function tagged(): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => ICborType<
  TaggedDataItem<T>,
  EC,
  EE | OverflowError,
  DC,
  DE | DecodingError
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
    new CborType(
      (
        value: TaggedDataItem<T>,
        e: IEncoder,
        ctx: EC,
      ): Result<null, EE | OverflowError> => {
        let res = writeTypeAndArg(e, TAG_TYPE, value.tag);
        if (!res.ok()) {
          return res;
        }
        return ty[encodeSymbol](value.value, e, ctx);
      },
      (d: IDecoder, ctx: DC): Result<TaggedDataItem<T>, DE | DecodingError> => {
        if (done(d)) return EOI_ERR;
        const p = d.ptr;
        const marker = d.buf[p];
        const t = getType(marker);
        if (t !== TAG_TYPE) {
          return new TypeMismatchError("tagged", getTypeString(marker)).err();
        }
        const tagRes = readArg(d);
        if (!tagRes.ok()) return tagRes;
        const len = tagRes.value;
        if (len == null) {
          return new InvalidCborError(
            marker,
            p,
            new Error(`Tag cannot be null`),
          ).err();
        }
        const value = ty[decodeSymbol](d, ctx);
        if (!value.ok()) return value;
        return ok(new TaggedDataItem(len, value.value));
      },
    );
}
