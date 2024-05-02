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
import { IDecodableType, IDecoder, IEncodableType, IEncoder } from "../types";
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

function dec<T, E>(t: IDecodableType<T, void, E>, d: IDecoder): Result<T, E> {
  return t[decodeSymbol](d);
}
function enc<T, E>(
  t: IEncodableType<T, void, E>,
  v: T,
  e: IEncoder,
): Result<void, E> {
  return t[encodeSymbol](v, e);
}

export function decodeAny(d: IDecoder): Result<DataItem, EndOfInputError> {
  const p = d.ptr;
  if (p >= d.buf.length) {
    return EOI_ERR;
  }
  const m = d.buf[p];
  const t = getType(m);
  switch (t) {
    case NUMBER_TYPE:
      return dec(uint, d);
    case ARRAY_TYPE:
      return dec(anyArray, d);
    case STRING_TYPE:
      return dec(str, d);
    case MAP_TYPE:
      return dec(anyMap, d);
    case NEGATIVE_INT_TYPE:
      return dec(nint, d);
    case BYTES_TYPE:
      return dec(bytes, d);
    case SPECIAL_TYPE: {
      const info = getInfo(m);
      switch (info) {
        case 20:
        case 21:
          return dec(bool, d);
        case 22:
          return dec(nullType, d);
        case 23:
          return dec(undefinedType, d);
        case 25: {
          return dec(f16, d);
        }
        case 26: {
          return dec(f32, d);
        }
        case 27: {
          return dec(f64, d);
        }
        default: {
          if (info < 20 || info === 24) {
            return dec(simple, d);
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
          return dec(dateTimeString, d);
        case 1:
          return dec(epochTime, d);
        case 2:
        case 3:
          return dec(bignum, d);
        case 24: {
          if (d.ptr + 1 >= d.buf.length) return EOI_ERR;
          const tag = d.buf[d.ptr + 1];
          switch (tag) {
            case 32:
              return dec(uri, d);
            case 24:
              return dec(cborBytes, d);
            default:
              return dec(taggedAny, d);
          }
        }
        default:
          return dec(taggedAny, d);
      }
    }

    default:
      throw new Error(`Not supported type: ${getTypeString(m)}`);
  }
}

function encodeBigInt(b: bigint, e: IEncoder): Result<void, OverflowError> {
  if (b > MAX_U128 || b < -MAX_U128 - 1n) {
    return enc(bignum, b, e);
  }
  if (b >= 0n) {
    return enc(uint, b, e);
  }
  return enc(nint, b, e);
}
function encodeAny(
  value: DataItem,
  e: IEncoder,
): Result<void, OverflowError | TypeMismatchError> {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return encodeBigInt(BigInt(value), e);
    }
    return enc(f64, value, e);
  }
  if (typeof value === "bigint") {
    return encodeBigInt(BigInt(value), e);
  }
  if (typeof value === "string") {
    return enc(str, value, e);
  }
  if (typeof value === "boolean") {
    return enc(bool, value, e);
  }
  if (value === null) {
    return enc(nullType, value, e);
  }
  if (value === undefined) {
    return enc(undefinedType, value, e);
  }
  if (value instanceof Uint8Array) {
    return enc(bytes, value, e);
  }
  if (Array.isArray(value)) {
    return enc(anyArray, value, e);
  }
  if (value instanceof Map) {
    return enc(anyMap, value, e);
  }
  if (value instanceof Simple) {
    return enc(simple, value, e);
  }
  if (value instanceof TaggedDataItem) {
    return enc(taggedAny, value, e);
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
  void,
  OverflowError | TypeMismatchError,
  void,
  DecodingError
>(encodeAny, decodeAny);

export const anyArray = any.pipe(array());
export const taggedAny = any.pipe(tagged());
export const anyMap = map(any, any);
export const uri = str.pipe(tagged(32), untag(32, "uri"));
export const dateTimeString = str.pipe(tagged(0), untag(0, "datetime string"));
export const cborBytes = bytes.pipe(tagged(24), untag(24, "cbor-bytes"));

export const epochTime = or(uint, f64, f32, f16).pipe(
  mapErrors(
    (_, v) => new TypeMismatchError("epoch time", String(v)),
    (_, m) => new TypeMismatchError("epoch time", getTypeString(m)),
  ),
  tagged(),
  untag(1, "epoch time"),
);
