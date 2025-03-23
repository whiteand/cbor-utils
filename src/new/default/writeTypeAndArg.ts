import { MAX_U16, MAX_U32, MAX_U64, MAX_U8 } from "../../limits";
import { OVERFLOW_ERROR_CODE, UNDERFLOW_ERROR_CODE } from "../error-codes";
import { MajorType } from "../major";
import { OutputByteStream, SuccessResult } from "../types";

export type WriteTypeAndArgResults =
  | SuccessResult
  | typeof OVERFLOW_ERROR_CODE
  | typeof UNDERFLOW_ERROR_CODE;

export function writeTypeAndArg(
  out: OutputByteStream,
  ty: MajorType,
  value: number | bigint | null
): WriteTypeAndArgResults {
  if (typeof value === "number") {
    return writeTypeAndArgNumber(out, ty, value);
  }
  if (typeof value === "bigint") {
    return writeTypeAndArgBigInt(out, ty, value);
  }
  return writeTypeAndArgNull(out, ty);
}

function writeTypeAndArgNumber(
  out: OutputByteStream,
  ty: MajorType,
  value: number
): WriteTypeAndArgResults {
  if (value < 0) return UNDERFLOW_ERROR_CODE;
  if (value <= MAX_U32) {
    return encodeSmallInt(out, ty, value);
  }

  const bigIntValue = BigInt(value);

  return bigIntValue <= MAX_U64
    ? encodeU64(out, ty << 5, bigIntValue)
    : OVERFLOW_ERROR_CODE;
}

function writeTypeAndArgNull(
  e: OutputByteStream,
  ty: number
): WriteTypeAndArgResults {
  e.write((ty << 5) | 31);
  return 0;
}

function writeTypeAndArgBigInt(
  e: OutputByteStream,
  ty: MajorType,
  bigInt: bigint
): WriteTypeAndArgResults {
  if (bigInt < 0n) return UNDERFLOW_ERROR_CODE;
  if (bigInt <= MAX_U32) {
    return encodeSmallInt(e, ty, Number(bigInt));
  }
  if (bigInt <= MAX_U64) {
    return encodeU64(e, ty << 5, bigInt);
  }

  return OVERFLOW_ERROR_CODE;
}

function encodeSmallInt(
  e: OutputByteStream,
  ty: MajorType,
  smallInt: number
): SuccessResult {
  const tyMask = ty << 5;
  if (smallInt < 24) {
    e.write(tyMask | (smallInt & 0xff));
    return 0;
  }
  if (smallInt <= MAX_U8) {
    return encodeU8(e, tyMask, smallInt);
  }
  if (smallInt <= MAX_U16) {
    return encodeU16(e, tyMask, smallInt);
  }
  return encodeU32(e, tyMask, smallInt);
}

function encodeU8(
  e: OutputByteStream,
  tyMask: number,
  smallInt: number
): SuccessResult {
  e.write(tyMask | 24).write(smallInt & 0xff);
  return 0;
}

function encodeU16(
  e: OutputByteStream,
  tyMask: number,
  smallInt: number
): SuccessResult {
  e.write(tyMask | 25)
    .write((smallInt >> 8) & 0xff)
    .write(smallInt & 0xff);
  return 0;
}

function encodeU32(
  e: OutputByteStream,
  tyMask: number,
  smallInt: number
): SuccessResult {
  e.write(tyMask | 26)
    .write((smallInt >> 24) & 0xff)
    .write((smallInt >> 16) & 0xff)
    .write((smallInt >> 8) & 0xff)
    .write(smallInt & 0xff);
  return 0;
}

function encodeU64(
  e: OutputByteStream,
  tyMask: number,
  bigInt: bigint
): SuccessResult {
  e.write(tyMask | 27)
    .write(Number((bigInt >> 56n) & 0xffn))
    .write(Number((bigInt >> 48n) & 0xffn))
    .write(Number((bigInt >> 40n) & 0xffn))
    .write(Number((bigInt >> 32n) & 0xffn))
    .write(Number((bigInt >> 24n) & 0xffn))
    .write(Number((bigInt >> 16n) & 0xffn))
    .write(Number((bigInt >> 8n) & 0xffn))
    .write(Number(bigInt & 0xffn));
  return 0;
}
