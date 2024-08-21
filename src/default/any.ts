import { Result, err } from "resultra";
import { DecodingError } from "../DecodingError";
import { getEoiResult, EndOfInputError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import {
  ARRAY_TYPE,
  BYTES_TYPE,
  MAP_TYPE,
  NEGATIVE_INT_TYPE,
  NUMBER_TYPE,
  SPECIAL_TYPE,
  STRING_TYPE,
  TAG_TYPE,
} from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { array } from "../operators/array";
import { tagged } from "../operators/tagged";
import { or } from "../operators/or";
import { IDecodable, IDecoder, IEncodable, IEncoder } from "../types";
import { DataItem, Simple, TaggedDataItem } from "./DataItem";
import { bool } from "./bool";
import { bytes } from "./bytes";
import { f16 } from "./f16";
import { bignum } from "./bignum";
import { f32 } from "./f32";
import { f64 } from "./f64";
import { map } from "./map";
import { nint } from "./nint";
import { nullType } from "./null";
import { simple } from "./simple";
import { str } from "./str";
import { uint } from "./uint";
import { undefinedType } from "./undefined";
import { untag } from "../operators/untag";
import { mapErrors } from "../operators/mapErrors";
import { MAX_U128 } from "../limits";
import { OverflowError } from "../OverflowError";
import { InvalidCborError } from "../InvalidCborError";

export function decodeAny(d: IDecoder): Result<DataItem, EndOfInputError> {
  const p = d.ptr;
  if (p >= d.buf.length) {
    return getEoiResult();
  }
  const m = d.buf[p];
  const t = getType(m);
  switch (t) {
    case NUMBER_TYPE:
      return uint.decode(d, null);
    case ARRAY_TYPE:
      return anyArray.decode(d, null);
    case STRING_TYPE:
      return str.decode(d, null);
    case MAP_TYPE:
      return anyMap.decode(d, null);
    case NEGATIVE_INT_TYPE:
      return nint.decode(d, null);
    case BYTES_TYPE:
      return bytes.decode(d, null);
    case SPECIAL_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 20:
        case 21:
          return bool.decode(d, null);
        case 22:
          return nullType.decode(d, null);
        case 23:
          return undefinedType.decode(d, null);
        case 25: {
          return f16.decode(d, null);
        }
        case 26: {
          return f32.decode(d, null);
        }
        case 27: {
          return f64.decode(d, null);
        }
        default: {
          if (info < 20 || info === 24) {
            return simple.decode(d, null);
          }
          return new InvalidCborError(
            m,
            p,
            new Error("not recognized special")
          ).err();
        }
      }
    }
    case TAG_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 0:
          return dateTimeString.decode(d, null);
        case 1:
          return epochTime.decode(d, null);
        case 2:
        case 3:
          return bignum.decode(d, null);
        case 24: {
          if (d.ptr + 1 >= d.buf.length) return getEoiResult();
          const tag = d.buf[d.ptr + 1];
          switch (tag) {
            case 32:
              return uri.decode(d, null);
            case 24:
              return cborBytes.decode(d, null);
            default:
              return taggedAny.decode(d, null);
          }
        }
        default:
          return taggedAny.decode(d, null);
      }
    }

    default:
      throw new Error(`Not supported type: ${getTypeString(m)}`);
  }
}

function encodeBigInt(b: bigint, e: IEncoder): Result<void, OverflowError> {
  if (b > MAX_U128 || b < -MAX_U128 - 1n) {
    return bignum.encode(b, e, null);
  }
  if (b >= 0n) {
    return uint.encode(b, e, null);
  }
  return nint.encode(b, e, null);
}
function encodeAny(
  value: Readonly<DataItem>,
  e: IEncoder
): Result<void, OverflowError | TypeMismatchError> {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return encodeBigInt(BigInt(value), e);
    }
    return f64.encode(value, e, null);
  }
  if (typeof value === "bigint") {
    return encodeBigInt(BigInt(value), e);
  }
  if (typeof value === "string") {
    return str.encode(value, e, null);
  }
  if (typeof value === "boolean") {
    return bool.encode(value, e, null);
  }
  if (value === null) {
    return nullType.encode(value, e, null);
  }
  if (value === undefined) {
    return undefinedType.encode(value, e, null);
  }
  if (value instanceof Uint8Array) {
    return bytes.encode(value, e, null);
  }
  if (Array.isArray(value)) {
    return anyArray.encode(value, e, null);
  }
  if (value instanceof Map) {
    return anyMap.encode(value, e, null);
  }
  if (value instanceof Simple) {
    return simple.encode(value, e, null);
  }
  if (value instanceof TaggedDataItem) {
    return taggedAny.encode(value, e, null);
  }
  return err(
    new TypeMismatchError(
      "valid data item",
      Object.prototype.toString.call(value).slice("[object ".length, -1)
    ) as never
  );
}

/**
 * This instance of CBOR type allows you
 * to encode any valid CBOR data item.
 *
 * Decoding example:
 *
 * ```ts
 * import { any, decode } from '@whiteand/cbor'
 * const bytes = new Uint8Array([0x83,0x01,0x82,0x02,0x03,0x82,0x04,0x05])
 * const value = decode(bytes, d => any.decode(d)).unwrap()
 * console.log(value)
 * //> [ 1, [ 2, 3 ], [ 4, 5 ] ]
 *```
 *
 * Encoding example:
 *
 * ```ts
 * import { any, encode } from '@whiteand/cbor'
 * const bytes = encode(e => any.encode([1, [2, 3], [4, 5]], e))
 * console.log(bytes)
 * //> Uint8Array(8) [0x83,0x01,0x82,0x02,0x03,0x82,0x04,0x05]
 * ```
 */
export const any: CborType<
  Readonly<DataItem>,
  DataItem,
  OverflowError | TypeMismatchError,
  DecodingError,
  unknown,
  unknown
> = CborType.builder().encode(encodeAny).decode(decodeAny).nullable().build();

export const anyArray = any.pipe(array());
export const taggedAny = any.pipe(tagged());
export const anyMap = map(any, any);
export const uri = str.pipe(tagged(32), untag(32, "uri"));
export const dateTimeString = str.pipe(tagged(0), untag(0, "datetime string"));
export const cborBytes = bytes.pipe(tagged(24), untag(24, "cbor-bytes"));

export const epochTime = or(uint, f64, f32, f16).pipe(
  mapErrors(
    (_, v) => new TypeMismatchError("epoch time", String(v)),
    (_, m) => new TypeMismatchError("epoch time", getTypeString(m))
  ),
  tagged(),
  untag(1, "epoch time")
);
