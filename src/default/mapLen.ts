import { Result } from "resultra";
import { CborType } from "../base";
import { MAP_TYPE } from "../constants";
import { IDecoder, IEncoder } from "../types";
import { writeTypeAndArg } from "../writeTypeAndArg";
import { OverflowError } from "../OverflowError";
import { getType } from "../marker";
import { TypeMismatchError } from "../TypeMismatchError";
import { getTypeString } from "../getTypeString";
import { readArg } from "../readArg";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { done } from "../utils/done";

/**
 * A CBOR type for encoding and decoding the length of the map.
 *
 * Usually is used as a prefix for encoding of maps.
 *
 * Encoding Example:
 *
 * ```ts
 * import { mapLen, u8, encode } from '@whiteand/cbor'
 *
 * const mapBytes = encode(e => {
 *   mapLen.encode(1, e)
 *
 *   // encoding key
 *   u8.encode(42, e)
 *
 *   // encoding value
 *   u8.encode(27, e)
 * })
 *
 * console.log(mapBytes)
 * //> Uint8Array(5) [ 161, 24, 42, 24, 27 ]
 * ```
 *
 * Decoding Example
 *
 * ```ts
 * import { mapLen, u8, decode, err, ok } from '@whiteand/cbor'
 *
 * const mapBytes = new Uint8Array([161, 24, 42, 24, 27])
 * const map = decode(mapBytes, d => {
 *   // decoding the length of the tuple
 *   const len = mapLen.decode(d)
 *
 *   // Checking if the decoding was successful
 *   // if not, returning the error result
 *   if (!len.ok()) return len
 *
 *   if (typeof len.value !== 'number') return err(new Error('Expected defined length for the map'))
 *
 *   const result = new Map()
 *
 *   for (let i = 0; i < len.value; i++) {
 *     const key = u8.decode(d)
 *     if (!key.ok()) return key
 *
 *     const value = u8.decode(d)
 *     if (!value.ok()) return value
 *
 *     result.set(key.value, value.value)
 *   }
 *
 *   return ok(result)
 * })
 *
 * console.log(map)
 * //> Map(1) { 42 => 27 }
 * ```
 *
 * Note: the similar result can be achieved using map function in a more declarative way. `map` function also allows to decode maps with undefined length.
 *
 * ```ts
 * import {
 *   map,
 *   u8,
 *   decode,
 *   encode,
 * } = '@whiteand/cbor'
 *
 * const mapCbor = map(u8, u8)
 *
 * const encodedMap = new Uint8Array([ 161, 24, 42, 24, 27 ])
 * const mapInstance = decode(encodedMap, d => mapCbor.decode(d))
 * const mapBytes = encode(e => mapCbor.encode(new Map([[42, 27]]), e))
 *
 * // mapInstance = Map(1) { 42 => 27 }
 * // mapBytes = Uint8Array(5) [ 161, 24, 42, 24, 27 ]
 * // mapBytes is the same as encoded bytes
 * ```
 *
 */
export const mapLen: CborType<
  number | bigint | null,
  number | bigint | null,
  OverflowError,
  EndOfInputError,
  [],
  []
> = CborType.builder()
  .encode(
    (v: bigint | number | null, e: IEncoder): Result<void, OverflowError> =>
      writeTypeAndArg(e, MAP_TYPE, v)
  )
  .decode((d: IDecoder) => {
    if (done(d)) return getEoiResult();
    const m = d.buf[d.ptr];
    return getType(m) !== MAP_TYPE
      ? new TypeMismatchError("map", getTypeString(m)).err()
      : readArg(d);
  })
  .build();
