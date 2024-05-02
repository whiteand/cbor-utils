import { Result, err } from "resultra";
import { DecodingError } from "../DecodingError";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
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
import { decodeSymbol, encodeSymbol } from "../traits";
import { IDecoder, IEncoder } from "../types";
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
    return EOI_ERR;
  }
  const m = d.buf[p];
  const t = getType(m);
  switch (t) {
    case NUMBER_TYPE:
      return uint[decodeSymbol](d, null);
    case ARRAY_TYPE:
      return anyArray[decodeSymbol](d, null);
    case STRING_TYPE:
      return str[decodeSymbol](d, null);
    case MAP_TYPE:
      return anyMap[decodeSymbol](d, null);
    case NEGATIVE_INT_TYPE:
      return nint[decodeSymbol](d, null);
    case BYTES_TYPE:
      return bytes[decodeSymbol](d, null);
    case SPECIAL_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 20:
        case 21:
          return bool[decodeSymbol](d, null);
        case 22:
          return nullType[decodeSymbol](d, null);
        case 23:
          return undefinedType[decodeSymbol](d, null);
        case 25: {
          return f16[decodeSymbol](d, null);
        }
        case 26: {
          return f32[decodeSymbol](d, null);
        }
        case 27: {
          return f64[decodeSymbol](d, null);
        }
        default: {
          if (info < 20 || info === 24) {
            return simple[decodeSymbol](d, null);
          }
          return new InvalidCborError(
            m,
            p,
            new Error("not recognized special"),
          ).err();
        }
      }
    }
    case TAG_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 0:
          return dateTimeString[decodeSymbol](d, null);
        case 1:
          return epochTime[decodeSymbol](d, null);
        case 2:
        case 3:
          return bignum[decodeSymbol](d, null);
        case 24: {
          if (d.ptr + 1 >= d.buf.length) return EOI_ERR;
          const tag = d.buf[d.ptr + 1];
          switch (tag) {
            case 32:
              return uri[decodeSymbol](d, null);
            case 24:
              return cborBytes[decodeSymbol](d, null);
            default:
              return taggedAny[decodeSymbol](d, null);
          }
        }
        default:
          return taggedAny[decodeSymbol](d, null);
      }
    }

    default:
      throw new Error(`Not supported type: ${getTypeString(m)}`);
  }
}

function encodeBigInt(b: bigint, e: IEncoder): Result<null, OverflowError> {
  if (b > MAX_U128 || b < -MAX_U128 - 1n) {
    return bignum[encodeSymbol](b, e, null);
  }
  if (b >= 0n) {
    return uint[encodeSymbol](b, e, null);
  }
  return nint[encodeSymbol](b, e, null);
}
function encodeAny(
  value: DataItem,
  e: IEncoder,
): Result<null, OverflowError | TypeMismatchError> {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return encodeBigInt(BigInt(value), e);
    }
    return f64[encodeSymbol](value, e, null);
  }
  if (typeof value === "bigint") {
    return encodeBigInt(BigInt(value), e);
  }
  if (typeof value === "string") {
    return str[encodeSymbol](value, e, null);
  }
  if (typeof value === "boolean") {
    return bool[encodeSymbol](value, e, null);
  }
  if (value === null) {
    return nullType[encodeSymbol](value, e, null);
  }
  if (value === undefined) {
    return undefinedType[encodeSymbol](value, e, null);
  }
  if (value instanceof Uint8Array) {
    return bytes[encodeSymbol](value, e, null);
  }
  if (Array.isArray(value)) {
    return anyArray[encodeSymbol](value, e, null);
  }
  if (value instanceof Map) {
    return anyMap[encodeSymbol](value, e, null);
  }
  if (value instanceof Simple) {
    return simple[encodeSymbol](value, e, null);
  }
  if (value instanceof TaggedDataItem) {
    return taggedAny[encodeSymbol](value, e, null);
  }
  return err(
    new TypeMismatchError(
      "valid data item",
      Object.prototype.toString.call(value).slice("[object ".length, -1),
    ) as never,
  );
}

export const any = new CborType<
  DataItem,
  unknown,
  OverflowError | TypeMismatchError,
  unknown,
  DecodingError
>(encodeAny, decodeAny);

export const anyArray = any.pipe(array());
export const taggedAny = any.pipe(tagged());
export const anyMap = map(any, any);
export const uri = str.pipe(tagged(32), untag(32, "uri"));
export const dateTimeString = str.pipe(tagged(0), untag(0, "datetime string"));
export const cborBytes = bytes.pipe(tagged(24), untag(24, "cbor-bytes"));

export const epochTime = or(uint, f32, f16, f64).pipe(
  mapErrors(
    (_, v) => new TypeMismatchError("epoch time", String(v)),
    (_, m) => new TypeMismatchError("epoch time", getTypeString(m)),
  ),
  tagged(),
  untag(1, "epoch time"),
);
