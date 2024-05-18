import { EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { CborType } from "../base";
import { seq } from "./seq";
import { decodeSymbol, encodeSymbol } from "../traits";
import { DecodeError, EncodeError, EncodedType, ICborType } from "../types";
import { TupleVals } from "../utils/TupleVals";
import { arrayLen } from "./arrayLen";

export type InferTupleType<TS extends readonly ICborType[]> = {
  -readonly [ind in keyof TS]: EncodedType<TS[ind]>;
};

type InferTupleEE<TS extends readonly ICborType[]> = TupleVals<{
  -readonly [ind in keyof TS]: EncodeError<TS[ind]>;
}>;
type InferTupleDE<TS extends readonly ICborType[]> = TupleVals<{
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
  const Types extends readonly ICborType<any, any, any, EC, DC>[]
>(
  types: Types
): CborType<
  InferTupleType<Types>,
  InferTupleEE<Types> | TypeMismatchError,
  InferTupleDE<Types> | EndOfInputError | TypeMismatchError | InvalidCborError,
  EC,
  DC
> {
  const n = types.length as InferLen<Types>;
  const s = seq<EC, DC, Types>(types);
  return new CborType<
    InferTupleType<Types>,
    InferTupleEE<Types> | TypeMismatchError,
    | InferTupleDE<Types>
    | EndOfInputError
    | TypeMismatchError
    | InvalidCborError,
    EC,
    DC
  >(
    (v, e, ctx) => {
      const res = arrayLen.encode(n, e);
      if (!res.ok()) return res;
      return s[encodeSymbol](v, e, ctx);
    },
    (d, ctx) => {
      const actualN = arrayLen.decode(d);
      if (!actualN.ok()) return actualN;
      if (actualN.value !== n) {
        return new UnexpectedValueError(
          n,
          actualN.value,
          "tuple length mismatch"
        ).err();
      }
      return s[decodeSymbol](d, ctx);
    }
  );
}
