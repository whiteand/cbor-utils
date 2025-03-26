import { Result, err } from "resultra";
import { DecodingError } from "../DecodingError";
import { EndOfInputError, getEoiResult } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { UnexpectedValueError } from "../UnexpectedValueError";
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
import { mapErrors } from "../operators/mapErrors";
import { or } from "../operators/or";
import { tagged } from "../operators/tagged";
import { untag } from "../operators/untag";
import { IDecoder, IEncoder, Z } from "../types";
import { DataItem, Simple } from "./DataItem";
import { TaggedDataItem } from "./TaggedDataItem";
import { bignum } from "./bignum";
import { bool } from "./bool";
import { bytes } from "./bytes";
import { f16 } from "./f16";
import { f32 } from "./f32";
import { f64 } from "./f64";
import { map } from "./map";
import { nint } from "./nint";
import { nullType } from "./null";
import { simple } from "./simple";
import { str } from "./str";
import { uint } from "./uint";
import { undefinedType } from "./undefined";
import { MAX_U64 } from "../limits";

export function decodeAny(d: IDecoder): Result<DataItem, EndOfInputError> {
  const p = d.ptr;
  if (p >= d.buf.length) {
    return getEoiResult();
  }
  const m = d.buf[p];
  const t = getType(m);
  switch (t) {
    case NUMBER_TYPE:
      return uint.decode(d);
    case ARRAY_TYPE:
      return anyArray.decode(d);
    case STRING_TYPE:
      return str.decode(d);
    case MAP_TYPE:
      return anyMap.decode(d);
    case NEGATIVE_INT_TYPE:
      return nint.decode(d);
    case BYTES_TYPE:
      return bytes.decode(d);
    case SPECIAL_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 20: /* falls through */
        case 21:
          return bool.decode(d);
        case 22:
          return nullType.decode(d);
        case 23:
          return undefinedType.decode(d);
        case 25: {
          return f16.decode(d);
        }
        case 26: {
          return f32.decode(d);
        }
        case 27: {
          return f64.decode(d);
        }
        default: {
          if (info < 20 || info === 24) {
            return simple.decode(d);
          }
          return new InvalidCborError(
            m,
            p,
            new Error("not recognized special")
          ).err();
        }
      }
      break;
    }
    case TAG_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 0:
          return dateTimeString.decode(d);
        case 1:
          return epochTime.decode(d);
        case 2: /* falls through */
        case 3:
          return bignum.decode(d);
        case 24: {
          if (d.ptr + 1 >= d.buf.length) return getEoiResult();
          const tag = d.buf[d.ptr + 1];
          switch (tag) {
            case 32:
              return uri.decode(d);
            case 24:
              return cborBytes.decode(d);
            default:
              return taggedAny.decode(d);
          }
        }
        default:
          return taggedAny.decode(d);
      }
      break;
    }

    default:
      throw new Error(`Not supported type: ${getTypeString(m)}`);
  }
}

function encodeBigInt(b: bigint, e: IEncoder): Result<void, OverflowError> {
  return b > MAX_U64 || b < -(MAX_U64 + 1n)
    ? bignum.encode(b, e)
    : b >= 0n
    ? uint.encode(b, e)
    : nint.encode(b, e);
}
function encodeAny(
  value: Readonly<DataItem>,
  e: IEncoder
): Result<void, OverflowError | TypeMismatchError> {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return encodeBigInt(BigInt(value), e);
    }
    return f64.encode(value, e);
  }
  if (typeof value === "bigint") {
    return encodeBigInt(BigInt(value), e);
  }
  if (typeof value === "string") {
    return str.encode(value, e);
  }
  if (typeof value === "boolean") {
    return bool.encode(value, e);
  }
  if (value === null) {
    return nullType.encode(value, e);
  }
  if (value === undefined) {
    return undefinedType.encode(value, e);
  }
  if (value instanceof Uint8Array) {
    return bytes.encode(value, e);
  }
  if (Array.isArray(value)) {
    return anyArray.encode(value, e);
  }
  if (value instanceof Map) {
    return anyMap.encode(value, e);
  }
  if (value instanceof Simple) {
    return simple.encode(value, e);
  }
  if (value instanceof TaggedDataItem) {
    return taggedAny.encode(value, e);
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
  [],
  []
> = CborType.builder().encode(encodeAny).decode(decodeAny).nullable().build();

export const anyArray: CborType<
  readonly Readonly<DataItem>[],
  DataItem[],
  OverflowError | TypeMismatchError,
  DecodingError,
  [],
  []
> = any.pipe(array());
export const taggedAny: CborType<
  TaggedDataItem<Readonly<DataItem>>,
  TaggedDataItem<DataItem>,
  OverflowError | TypeMismatchError,
  DecodingError,
  [],
  []
> = any.pipe(tagged());
export const anyMap: CborType<
  Map<Readonly<DataItem>, Readonly<DataItem>>,
  Map<DataItem, DataItem>,
  OverflowError | TypeMismatchError,
  DecodingError,
  [],
  []
> = map(any, any);
export const uri: CborType<
  string,
  string,
  | TypeMismatchError
  | OverflowError
  | UnexpectedValueError<number | bigint, number | bigint>,
  DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  [],
  []
> = str.pipe(tagged(32), untag(32, "uri"));

export const dateTimeString: CborType<
  string,
  string,
  | OverflowError
  | TypeMismatchError
  | UnexpectedValueError<number | bigint, number | bigint>,
  DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  [],
  []
> = str.pipe(tagged(0), untag(0, "datetime string"));

export const cborBytes: CborType<
  Uint8Array,
  Uint8Array,
  OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  [],
  []
> = bytes.pipe(tagged(24), untag(24, "cbor-bytes"));

export const epochTime: CborType<
  number | bigint,
  number | bigint,
  OverflowError | TypeMismatchError,
  DecodingError,
  [],
  []
> = or(uint, f64, f32, f16).pipe(
  mapErrors(
    (_: Z, v: number | bigint) =>
      new TypeMismatchError("epoch time", String(v)),
    (_: Z, m: number) => new TypeMismatchError("epoch time", getTypeString(m))
  ),
  tagged(),
  untag(1, "epoch time")
);
