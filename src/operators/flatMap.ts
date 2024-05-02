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

export function flatMap<U, T, NEE, NDE>(
  newEnc: MapEnc<U, void, NoInfer<T>, NEE>,
  newDec: MapDec<T, void, U, NDE>,
): <EE, DE>(
  ty: ICborType<T, void, EE, void, DE>,
) => CborType<U, void, NEE | EE, void, NDE | DE>;
export function flatMap<U, T, NEC, NEE, NDC, NDE>(
  newEnc: MapEnc<U, NEC, NoInfer<T>, NEE>,
  newDec: MapDec<T, NDC, U, NDE>,
): <EC extends NEC, EE, DC extends NDC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => CborType<U, NEC & EC, NEE | EE, NDC & DC, NDE | DE>;
export function flatMap<U, T, NEC, NEE, NDC, NDE>(
  newEnc: MapEnc<U, NEC, NoInfer<T>, NEE>,
  newDec: MapDec<T, NDC, U, NDE>,
): <EE, DE>(
  ty: ICborType<T, any, EE, any, DE>,
) => CborType<U, NEC, NEE | EE, NDC, NDE | DE> {
  return <EE, DE>(
    ty: ICborType<T, any, EE, any, DE>,
  ): CborType<U, NEC, NEE | EE, NDC, NDE | DE> =>
    new CborType(
      (value: U, e: IEncoder, ctx: NEC): Result<void, NEE | EE> => {
        const inner = newEnc(value, ctx);
        if (!inner.ok()) {
          return inner;
        }
        return ty[encodeSymbol](inner.value, e, ctx);
      },
      (d: IDecoder, ctx: NDC): Result<U, NDE | DE> => {
        const startPosition = d.ptr;
        const inner = ty[decodeSymbol](d, ctx);
        if (!inner.ok()) {
          return inner;
        }
        return newDec(inner.value, d, ctx, startPosition);
      },
    );
}
