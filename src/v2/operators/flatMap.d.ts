import { Result } from "resultra";
import { ICborTypeCodec, IDecoder } from "../types";
import { CborType } from "../base";

type MapEnc<in U, in NEC, out T, out NEE> = (
  value: U,
  ctx: NEC
) => Result<T, NEE>;
type MapDec<in NewType, in NDC, out OldType, out NDE> = (
  value: NewType,
  decoder: IDecoder,
  ctx: NDC,
  startPosition: number
) => Result<OldType, NDE>;

declare function flatMap<
  OldEncodedType,
  NewEncodedType,
  OldDecodedType,
  NewDecodedType,
  NEE extends Error,
  NDE extends Error,
  NEC,
  NDC
>(
  newEnc: MapEnc<NoInfer<OldEncodedType>, NEC, NewEncodedType, NEE>,
  newDec: MapDec<NewDecodedType, NDC, OldDecodedType, NDE>
): <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
  ty: ICborTypeCodec<OldEncodedType, OldDecodedType, EE, DE, EC, DC>
) => CborType<
  NewEncodedType,
  NewDecodedType,
  NEE | EE,
  NDE | DE,
  NEC & EC,
  NDC & DC
>;
