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

export function flatMap<U, T, NEE extends Error, NDE extends Error, NEC, NDC>(
  newEnc: MapEnc<U, NEC, NoInfer<T>, NEE>,
  newDec: MapDec<T, NDC, U, NDE>,
): <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
  ty: ICborType<T, EE, DE, EC, DC>,
) => CborType<U, NEE | EE, NDE | DE, NEC & EC, NDC & DC> {
  return <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
    ty: ICborType<T, EE, DE, EC, DC>,
  ): CborType<U, NEE | EE, NDE | DE, NEC & EC, NDC & DC> =>
    new CborType<U, NEE | EE, NDE | DE, NEC & EC, NDC & DC>(
      (value: U, e: IEncoder, ctx: NEC & EC): Result<void, NEE | EE> => {
        const inner = newEnc(value, ctx);
        if (!inner.ok()) {
          return inner;
        }
        return ty[encodeSymbol](inner.value, e, ctx);
      },
      (d: IDecoder, ctx: NDC & DC): Result<U, NDE | DE> => {
        const startPosition = d.ptr;
        const inner = ty[decodeSymbol](d, ctx);
        if (!inner.ok()) {
          return inner;
        }
        return newDec(inner.value, d, ctx, startPosition);
      },
    );
}
