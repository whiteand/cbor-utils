import { Result, err } from "resultra";
import { CborType } from "../base";
import {
  DecodeError,
  EncodeError,
  EncodedType,
  ICborTypeCodec,
} from "../types";
import { BaseError } from "../BaseError";
import { TupleVals } from "../utils/TupleVals";

type InferEncodedOrType<TS extends readonly ICborTypeCodec[]> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;
type InferDecodedOrType<TS extends readonly ICborTypeCodec[]> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;

type OrEncodeErrors<TS extends readonly ICborTypeCodec[]> = {
  [ind in keyof TS]: EncodeError<TS[ind]>;
};
type OrDecodeErrors<TS extends readonly ICborTypeCodec[]> = {
  [ind in keyof TS]: DecodeError<TS[ind]>;
};

declare class OrError<Errs extends readonly Error[]> extends BaseError {
  public readonly errors: Errs;
  constructor(errors: Errs);
}

declare function or<
  EC,
  DC,
  Types extends readonly ICborTypeCodec<any, any, any, any, EC, DC>[]
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
