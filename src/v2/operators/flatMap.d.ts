import { Result } from "resultra";
import { ICborTypeCodec, IDecoder } from "../types";
import { CborType } from "../base";

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
  newEnc: (
    value: NewEncodedType,
    ctx: NEC
  ) => Result<NoInfer<OldEncodedType>, NEE>,
  newDec: (
    value: NoInfer<OldDecodedType>,
    decoder: IDecoder,
    ctx: NDC,
    startPosition: number
  ) => Result<NewDecodedType, NDE>
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
