import { CborType } from "../base";
import { BaseError } from "../BaseError";
import {
  Assume,
  DecodeError,
  DecodedType,
  EncodeError,
  EncodedType,
  ICborType,
  NotImportant,
} from "../types";
import { TupleVals } from "../utils/TupleVals";

type InferEncodedOrType<
  TS extends readonly ICborType<NotImportant, NotImportant, Error, Error, NotImportant, NotImportant>[]
> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;

type InferDecodedOrType<
  TS extends readonly ICborType<NotImportant, NotImportant, Error, Error, NotImportant, NotImportant>[]
> = TupleVals<{
  [ind in keyof TS]: DecodedType<TS[ind]>;
}>;

type OrEncodeErrors<
  TS extends readonly ICborType<NotImportant, NotImportant, Error, Error, NotImportant, NotImportant>[]
> =  {
  [ind in keyof TS]: EncodeError<TS[ind]>;
};

type OrDecodeErrors<
  TS extends readonly ICborType<NotImportant, NotImportant, Error, Error, NotImportant, NotImportant>[]
> =  {
  [ind in keyof TS]: DecodeError<TS[ind]>;
};

declare class OrError<Errs extends readonly Error[]> extends BaseError {
  public readonly errors: Errs;
  constructor(errors: Errs);
}

declare function or<
  EC,
  DC,
  const Types extends readonly ICborType<NotImportant, NotImportant, NotImportant, NotImportant, EC, DC>[]
>(
  ...types: Types
): CborType<
  InferEncodedOrType<Types>,
  InferDecodedOrType<Types>,
  OrError<Assume<OrEncodeErrors<Types>, Error[]>>,
  OrError<Assume<OrDecodeErrors<Types>, Error[]>>,
  EC,
  DC
>;
