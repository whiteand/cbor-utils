import { Result } from "resultra";
import { ICborType, IDecoder } from "../types";
import { CborType } from "../base";

/**
 *
 * @param newEnc Function that transformes the target type value to the value that should be encoded
 * @param newDec Function that transforms decoded value to the target type value
 * @param nullable Defines if the new type can be encoded as null (default matches the target type nullable)
 */
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
    value: OldDecodedType,
    decoder: IDecoder,
    ctx: NDC,
    startPosition: number
  ) => Result<NewDecodedType, NDE>,
  nullable?: boolean
): <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(
  ty: ICborType<OldEncodedType, OldDecodedType, EE, DE, EC, DC>
) => CborType<
  NewEncodedType,
  NewDecodedType,
  NEE | EE,
  NDE | DE,
  NEC & EC,
  NDC & DC
>;
