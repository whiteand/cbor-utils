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
  ICborType,
  IDecoder,
  IEncoder,
  Z,
  AndManyContextsArgs,
  ContextFromArgs,
  SelectContextArgsFromProp,
  AnyCborTypeCodec,
} from "../types";
import { TupleVals } from "../utils/TupleVals";
import { arrayLen } from "./arrayLen";
import { Result } from "resultra";

export type InferEncodedTupleType<
  TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]
> = {
  -readonly [ind in keyof TS]: EncodedType<TS[ind]>;
};
export type InferDecodedTupleType<
  TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]
> = {
  -readonly [ind in keyof TS]: DecodedType<TS[ind]>;
};

type InferTupleEE<TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]> =
  TupleVals<{
    -readonly [ind in keyof TS]: EncodeError<TS[ind]>;
  }>;
type InferTupleDE<TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]> =
  TupleVals<{
    -readonly [ind in keyof TS]: DecodeError<TS[ind]>;
  }>;

type InferLen<TS extends readonly Z[]> = TS["length"];

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
export function tuple<const Types extends readonly AnyCborTypeCodec[]>(
  types: Types
): CborType<
  InferEncodedTupleType<Types>,
  InferDecodedTupleType<Types>,
  InferTupleEE<Types> | TypeMismatchError,
  InferTupleDE<Types> | EndOfInputError | TypeMismatchError | InvalidCborError,
  AndManyContextsArgs<SelectContextArgsFromProp<Types, "__inferEncodingCtx">>,
  AndManyContextsArgs<SelectContextArgsFromProp<Types, "__inferDecodingCtx">>
> {
  const n = types.length as InferLen<Types>;
  const s = seq<Types>(types);

  return CborType.builder()
    .encode(
      (
        v: InferEncodedTupleType<Types>,
        e: IEncoder,
        ctx: ContextFromArgs<
          AndManyContextsArgs<
            SelectContextArgsFromProp<Types, "__inferEncodingCtx">
          >
        >
      ): Result<void, InferTupleEE<Types> | TypeMismatchError> =>
        arrayLen
          .encode(n, e)
          .andThen(() => (s.encode as Z)(v, e, ctx)) as Result<
          void,
          InferTupleEE<Types> | TypeMismatchError
        >
    )
    .decode(
      (
        d: IDecoder,
        ctx: ContextFromArgs<
          AndManyContextsArgs<
            SelectContextArgsFromProp<Types, "__inferDecodingCtx">
          >
        >
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
        return (s.decode as Z)(d, ctx);
      }
    )
    .build() as Z;
}
