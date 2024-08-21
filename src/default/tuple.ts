import { EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { CborType } from "../base";
import { seq } from "./seq";
import {
  DecodeError,
  DecodedType,
  EncodeError,
  EncodedType,
  ICborTypeCodec,
  IDecoder,
  IEncoder,
} from "../types";
import { TupleVals } from "../utils/TupleVals";
import { arrayLen } from "./arrayLen";
import { Result } from "resultra";

export type InferEncodedTupleType<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = {
  -readonly [ind in keyof TS]: EncodedType<TS[ind]>;
};
export type InferDecodedTupleType<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = {
  -readonly [ind in keyof TS]: DecodedType<TS[ind]>;
};

type InferTupleEE<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = TupleVals<{
  -readonly [ind in keyof TS]: EncodeError<TS[ind]>;
}>;
type InferTupleDE<
  TS extends readonly ICborTypeCodec<any, any, Error, Error, any, any>[]
> = TupleVals<{
  -readonly [ind in keyof TS]: DecodeError<TS[ind]>;
}>;

type InferLen<TS extends readonly any[]> = TS["length"];

/**
 * Type constructor that creates a tuple type from a list of element types.
 *
 * It uses array data item to encode a tuple of values.
 *
 * Example:
 *
 * ```ts
 * import { tuple, u8 } from '@whiteand/cbor'
 *
 * // pairOfU8 is a cbor type that encodes and decodes [number, number]
 * const pairOfU8 = tuple([u8, u8])
 * ```
 *
 * @param types
 * @returns
 */
export function tuple<
  const EC,
  const DC,
  const Types extends readonly ICborTypeCodec<
    any,
    any,
    Error,
    Error,
    any,
    any
  >[]
>(
  types: Types
): CborType<
  InferEncodedTupleType<Types>,
  InferDecodedTupleType<Types>,
  InferTupleEE<Types> | TypeMismatchError,
  InferTupleDE<Types> | EndOfInputError | TypeMismatchError | InvalidCborError,
  EC,
  DC
> {
  const n = types.length as InferLen<Types>;
  const s = seq<EC, DC, Types>(types);

  return CborType.builder()
    .encode(
      (
        v: InferEncodedTupleType<Types>,
        e: IEncoder,
        ctx: EC
      ): Result<void, InferTupleEE<Types> | TypeMismatchError> =>
        arrayLen.encode(n, e).andThen(() => s.encode(v, e, ctx)) as Result<
          void,
          InferTupleEE<Types> | TypeMismatchError
        >
    )
    .decode(
      (
        d: IDecoder,
        ctx: DC
      ): Result<
        InferDecodedTupleType<Types>,
        | InferTupleDE<Types>
        | EndOfInputError
        | TypeMismatchError
        | InvalidCborError
      > => {
        const actualN = arrayLen.decode(d);
        if (!actualN.ok()) return actualN;
        if (actualN.value !== n) {
          return new UnexpectedValueError(
            n,
            actualN.value,
            "tuple length mismatch"
          ).err();
        }
        return s.decode(d, ctx);
      }
    )
    .build();
}
