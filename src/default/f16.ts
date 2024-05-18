import { ok, Result } from "resultra";
import { EOI_ERR, EndOfInputError } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { CborType } from "../base";
import { SPECIAL_TYPE, SPECIAL_TYPE_MASK } from "../constants";
import { getTypeString } from "../getTypeString";
import { getInfo, getType } from "../marker";
import { IDecoder, IEncoder } from "../types";
import { success } from "../success";
import { hex } from "../utils/hex";
import { UnderflowError } from "../UnderflowError";
import { done } from "../utils/done";

const EPSILON = Number.EPSILON;
const INVERSE_OF_EPSILON = 1 / EPSILON;

/**
 * rounds to the nearest value;
 * if the number falls midway, it is rounded to the nearest value with an even least significant digit
 * @param num
 * @returns
 */
function roundTiesToEven(num: number) {
  return num + INVERSE_OF_EPSILON - INVERSE_OF_EPSILON;
}

const FLOAT16_MIN_VALUE = 6.103515625e-5;
const FLOAT16_MAX_VALUE = 65504;
const FLOAT16_EPSILON = 0.0009765625;

const FLOAT16_EPSILON_MULTIPLIED_BY_FLOAT16_MIN_VALUE =
  FLOAT16_EPSILON * FLOAT16_MIN_VALUE;
const FLOAT16_EPSILON_DEVIDED_BY_EPSILON = FLOAT16_EPSILON * INVERSE_OF_EPSILON;

/**
 * round a number to a half float number
 * @param num - double float
 * @returns half float number
 */
function roundToFloat16(num: number) {
  const number = +num;

  // NaN, Infinity, -Infinity, 0, -0
  if (!Number.isFinite(number) || number === 0) {
    return number;
  }

  // finite except 0, -0
  const sign = number > 0 ? 1 : -1;
  const absolute = Math.abs(number);

  // small number
  if (absolute < FLOAT16_MIN_VALUE) {
    return (
      sign *
      roundTiesToEven(
        absolute / FLOAT16_EPSILON_MULTIPLIED_BY_FLOAT16_MIN_VALUE
      ) *
      FLOAT16_EPSILON_MULTIPLIED_BY_FLOAT16_MIN_VALUE
    );
  }

  const temp = (1 + FLOAT16_EPSILON_DEVIDED_BY_EPSILON) * absolute;
  const result = temp - (temp - absolute);

  // large number
  if (result > FLOAT16_MAX_VALUE || Number.isNaN(result)) {
    return sign * Infinity;
  }

  return sign * result;
}

// 0111 1110 0000 0000
// peee ee10 0000 0000

function encodeF16Parts(
  sign: 1 | 0,
  exponent: number,
  significand: number,
  e: IEncoder
): Result<void, never> {
  const a = (sign << 7) | (exponent << 2) | ((significand >> 8) & 0b11);
  const b = significand & 0xff;
  e.write(SPECIAL_TYPE_MASK | 25)
    .write(a)
    .write(b);
  return success;
}

// f97e00
// 1 11110 010111

function encodeF16(
  value: number,
  e: IEncoder
): Result<void, OverflowError | UnderflowError> {
  if (Number.isNaN(value)) {
    return encodeF16Parts(0, 31, 512, e);
  }

  if (value === Infinity) {
    return encodeF16Parts(0, 31, 0, e);
  }
  if (value === -Infinity) {
    return encodeF16Parts(1, 31, 0, e);
  }

  if (value > FLOAT16_MAX_VALUE) {
    return new OverflowError(FLOAT16_MAX_VALUE, value).err();
  }
  if (value < -FLOAT16_MAX_VALUE) {
    return new UnderflowError(-FLOAT16_MAX_VALUE, value).err();
  }
  const v = roundToFloat16(value);

  if (Object.is(v, -0)) {
    return encodeF16Parts(1, 0, 0, e);
  }
  if (Object.is(v, 0)) {
    return encodeF16Parts(0, 0, 0, e);
  }

  const bs = new Uint8Array(4);
  new DataView(bs.buffer).setFloat32(0, v, false);
  const f32Sign = (bs[0] >> 7) as 1 | 0;
  const f32Exp = ((bs[0] & 0b01111111) << 1) | (bs[1] >> 7);
  const f32Significand = ((bs[1] & 0b01111111) << 16) | (bs[2] << 8) | bs[3];
  const f16Exp = f32Exp - 127 + 15;
  const f16Sig = f32Significand >> 13;
  if (f16Exp >= 31) {
    return new OverflowError(65504, value).err();
  }
  return encodeF16Parts(f32Sign, f16Exp, f16Sig, e);
}

function decodeHalfFloat(
  d: IDecoder
): Result<number, TypeMismatchError | EndOfInputError> {
  if (done(d)) return EOI_ERR;
  const m = d.buf[d.ptr];
  const t = getType(m);
  if (t !== SPECIAL_TYPE || getInfo(m) !== 25) {
    return new TypeMismatchError("f16", getTypeString(m)).err();
  }

  if (d.ptr + 2 >= d.buf.length) {
    return EOI_ERR;
  }
  d.ptr++;
  let a = d.buf[d.ptr++];
  let b = d.buf[d.ptr++];

  const pos = a >> 7 === 0;
  const exponent = (a & 0b1111100) >> 2;
  const significand = ((a & 0b11) << 8) | b;

  if (exponent === 0) {
    if (significand === 0) {
      return ok(pos ? 0 : -0);
    } else {
      return ok((pos ? 1 : -1) * 2 ** -14 * (significand / 1024));
    }
  }
  if (exponent === 31) {
    if (significand === 0) {
      return ok(pos ? Infinity : -Infinity);
    } else {
      return ok(NaN);
    }
  }
  let res = 2 ** (exponent - 15) * (1 + significand / 1024);
  return ok(pos ? res : -res);
}

export const f16: CborType<
  number,
  OverflowError,
  TypeMismatchError,
  unknown,
  unknown
> = new CborType<number, OverflowError, TypeMismatchError, unknown, unknown>(
  encodeF16,
  decodeHalfFloat
);
