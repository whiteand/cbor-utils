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

export function flatMap<U, T, NEC, NEE, NDC, NDE>(
  newEnc: MapEnc<U, NEC, NoInfer<T>, NEE>,
  newDec: MapDec<T, NDC, U, NDE>,
): <EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => ICborType<U, NEC & EC, NEE | EE, NDC & DC, NDE | DE> {
  return <EC, EE, DC, DE>(
    ty: ICborType<T, EC, EE, DC, DE>,
  ): ICborType<U, NEC & EC, NEE | EE, NDC & DC, NDE | DE> =>
    new CborType(
      (value: U, e: IEncoder, ctx: NEC & EC): Result<null, NEE | EE> => {
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
