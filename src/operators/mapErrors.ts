import { err, Result } from "resultra";
import { CborType } from "../base";
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
 * Maps the encoding and decoding errors of a CBOR type.
 *
 * @param ee function that transforms the encoding error into a new encoding error
 * @param de function that transforms decoding error into a new decoding error
 * @returns new type with mapped errors
 */
export function mapErrors<
  ET,
  DT,
  EE extends Error,
  NEE extends Error,
  DE extends Error,
  NDE extends Error
>(
  ee: (e: EE, v: ET) => NEE,
  de: (de: DE, marker: number, position: number) => NDE
): <ECArgs extends AnyContextArgs, DCArgs extends AnyContextArgs>(
  ty: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
) => CborType<ET, DT, NEE, NDE, ECArgs, DCArgs> {
  return <ECArgs extends AnyContextArgs, DCArgs extends AnyContextArgs>(
    ty: ICborType<ET, DT, EE, DE, ECArgs, DCArgs>
  ) =>
    CborType.builder()
      .encode(((
        v: ET,
        e: IEncoder,
        c: ContextFromArgs<ECArgs>
      ): Result<void, NEE> => {
        const r = (ty.encode as Z)(v, e, c);
        return r.ok() ? r : err(ee(r.error, v));
      }) as Z as TEncodeFunction<ET, NEE, ECArgs>)
      .decode(((d: IDecoder, c: ContextFromArgs<DCArgs>): Result<DT, NDE> => {
        const p = d.ptr;
        const m = d.buf[p];
        const r = (ty.decode as Z)(d, c);
        return r.ok() ? r : err(de(r.error, m, p));
      }) as Z as TDecodeFunction<DT, NDE, DCArgs>)
      .nullable(ty.nullable)
      .decodeNull(ty.decodeNull)
      .isNull(ty.isNull)
      .build();
}
