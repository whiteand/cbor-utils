import { Result } from "resultra";
import { ICborType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";

type MapEnc<U, NEC, T, NEE> = (value: U, ctx: NEC) => Result<T, NEE>;
type MapDec<T, NDC, U, NDE> = (
  value: T,
  decoder: IDecoder,
  ctx: NDC,
  startPosition: number,
) => Result<U, NDE>;

export function map<U, T>(
  toEncoded: (value: U) => NoInfer<T>,
  fromDecoded: (value: T) => U,
): <EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => ICborType<U, EC, EE, DC, DE> {
  return <EC, EE, DC, DE>(
    ty: ICborType<T, EC, EE, DC, DE>,
  ): ICborType<U, EC, EE, DC, DE> =>
    new CborType(
      (value: U, e: IEncoder, ctx: EC): Result<null, EE> =>
        ty[encodeSymbol](toEncoded(value), e, ctx),
      (d: IDecoder, ctx: DC): Result<U, DE> =>
        ty[decodeSymbol](d, ctx).map(fromDecoded),
    );
}
