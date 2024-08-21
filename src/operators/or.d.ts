import { CborType } from "../base";
import { BaseError } from "../BaseError";
import {
  DecodeError,
  DecodedType,
  EncodeError,
  EncodedType,
  ICborTypeCodec,
} from "../types";
import { TupleVals } from "../utils/TupleVals";

type InferEncodedOrType<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;

type InferDecodedOrType<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = TupleVals<{
  [ind in keyof TS]: DecodedType<TS[ind]>;
}>;

type OrEncodeErrors<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = {
  [ind in keyof TS]: EncodeError<TS[ind]>;
};
type OrDecodeErrors<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = {
  [ind in keyof TS]: DecodeError<TS[ind]>;
};

declare class OrError<Errs extends readonly Error[]> extends BaseError {
  public readonly errors: Errs;
  constructor(errors: Errs);
}

declare function or<
  EC,
  DC,
  const Types extends readonly ICborTypeCodec<any, any, any, any, EC, DC>[]
>(
  ...types: Types
): CborType<
  InferEncodedOrType<Types>,
  InferDecodedOrType<Types>,
  OrError<OrEncodeErrors<Types>>,
  OrError<OrDecodeErrors<Types>>,
  EC,
  DC
>;
