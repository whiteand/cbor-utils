import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { CborType } from "../base";
import { NULL_BYTE } from "../constants";
import { getVoidOk } from "../getVoidOk";
import {
  AnyContextArgs,
  ContextFromArgs,
  ICborType,
  IDecoder,
  IEncoder,
  Z,
  TDecodeFunction,
  TEncodeFunction,
} from "../types";

/**
 *
 * Transforms a CBOR type to nullable type.
 *
 * `CborType<T> -> CborType<T | null>`
 *
 * @returns Type that allows null CBOR Data item to be decoded as null
 */
export function nullable(): <
  ET,
  DT,
  EE extends Error,
  DE extends Error,
  ECArgs extends AnyContextArgs,
  DCArgs extends AnyContextArgs
>(
  ty: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
) => CborType<ET | null, DT | null, EE, DE | DecodingError, ECArgs, DCArgs> {
  return <
    ET,
    DT,
    EE extends Error,
    DE extends Error,
    ECArgs extends AnyContextArgs,
    DCArgs extends AnyContextArgs
  >(
    ty: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
  ): CborType<ET | null, DT | null, EE, DE | DecodingError, ECArgs, DCArgs> =>
    CborType.builder()
      .encode(((
        value: ET | null,
        e: IEncoder,
        ctx: ContextFromArgs<ECArgs>
      ): Result<void, EE> => {
        if (value == null) {
          e.write(NULL_BYTE);
          return getVoidOk();
        }
        return (ty.encode as Z)(value, e, ctx);
      }) as Z as TEncodeFunction<ET | null, EE, ECArgs>)
      .decode(((d: IDecoder, ctx: Z): Result<DT | null, DE | DecodingError> => {
        const marker = d.buf[d.ptr];
        if (marker === NULL_BYTE) {
          d.ptr++;
          return ok(null);
        }
        return (ty.decode as Z)(d, ctx);
      }) as Z as TDecodeFunction<DT | null, DE, DCArgs>)
      .nullable(true)
      .isNull((value, ...ctx) => value == null || ty.isNull(value, ...ctx))
      .decodeNull(() => null)
      .build();
}
