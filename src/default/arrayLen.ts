import { Result } from "resultra";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { ARRAY_TYPE } from "../constants";
import { getTypeString } from "../getTypeString";
import { getType } from "../marker";
import { readArg } from "../readArg";
import { done } from "../utils/done";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { IDecoder, IEncoder } from "../types";

/**
 * A cbor type for encoding and decoding the length of the array.
 *
 * Usually is used as a prefix for encoding of arrays or tuples.
 *
 * Encoding Example:
 *
 * ```ts
 * import { arrayLen, u8, encode } from '@whiteand/cbor'
 *
 * const pairTupleBytes = encode(e => {
 *   // arrayLen is used to encode the length of the tuple
 *   arrayLen.encode(2, e)
 *
 *   // encoding first element
 *   u8.encode(42, e)
 *
 *   // encoding second element
 *   u8.encode(27, e)
 * })
 *
 * console.log(pairTupleBytes)
 * //> Uint8Array(5) [ 130, 24, 42, 24, 27 ]
 * ```
 *
 * Decoding Example
 *
 * ```ts
 * import { arrayLen, u8, decode, err, ok } from '@whiteand/cbor'
 *
 * const pairTupleBytes = new Uint8Array([ 130, 24, 42, 24, 27 ])
 * const pairTuple = decode(pairTupleBytes, d => {
 *   // decoding the length of the tuple
 *   const len = arrayLen.decode(d)
 *
 *   // Checking if the decoding was successful
 *   // if not, returning the error result
 *   if (!len.ok()) return len
 *
 *   if (len.value !== 2) return err(new Error('Expected [u8, u8]'))
 *
 *   // decoding the first element
 *   const first = u8.decode(d)
 *
 *   // fail fast
 *   if (!first.ok()) return first
 *
 *   const second = u8.decode(d)
 *   if (!second.ok()) return second
 *
 *   return ok([first.value, second.value])
 * })
 * ```
 *
 * Note: the same can be achieved using tuple function in a more declarative way.
 *
 * ```ts
 * import {
 *   tuple,
 *   u8
 * } = '@whiteand/cbor'
 *
 * const pairTupleCbor = tuple([u8, u8])
 *
 * const tuple = decode(pairTupleBytes, d => pairTupleCbor.decode(d))
 * const tupleBytes = encode(e => pairTupleCbor.encode([42, 27], e))
 */
export const arrayLen: CborType<
  number | bigint | null,
  number | bigint | null,
  OverflowError,
  EndOfInputError | TypeMismatchError | InvalidCborError,
  unknown,
  unknown
> = CborType.builder()
  .encode((len: number | bigint | null, e: IEncoder) =>
    writeTypeAndArg(e, ARRAY_TYPE, len)
  )
  .decode(
    (
      d: IDecoder
    ): Result<
      number | bigint | null,
      EndOfInputError | TypeMismatchError | InvalidCborError
    > => {
      if (done(d)) return getEoiResult();
      const marker = d.buf[d.ptr];
      const t = getType(marker);
      if (t !== ARRAY_TYPE) {
        return new TypeMismatchError("array", getTypeString(marker)).err();
      }
      return readArg(d);
    }
  )
  .build();
