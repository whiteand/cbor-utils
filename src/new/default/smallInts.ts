// import { Result, ok } from "resultra";
// import { OverflowError } from "../OverflowError";
// import { TypeMismatchError } from "../TypeMismatchError";
// import { UnderflowError } from "../UnderflowError";
// import { getTypeString } from "../getTypeString";
// import { flatMap } from "../operators/flatMap";
// import { uint } from "./uint";
// import { CborType } from "../base";
// import { InvalidCborError } from "../InvalidCborError";
// import { EndOfInputError } from "../EndOfInputError";
// import { MAX_U16, MAX_U32, MAX_U8 } from "../limits";
// import { IDecoder } from "../types";

import { CborType } from "../cbor-type";
import { OVERFLOW_ERROR_CODE, TYPE_MISMATCH_ERROR_CODE } from "../error-codes";
import { childCtor } from "../subclass";
import { IEncodable, OutputByteStream, SuccessResult } from "../types";
import { uint } from "./uint";

const MAX_SIZE = {
  8: 0xff,
  16: 0xffff,
  32: 0xffffffff,
};
function createEncoder(size: 8 | 16 | 32) {
  const UintEncoderCtor = childCtor(uint.encoder(), `U${size}Encoder`);
  class SmallIntEncoder
    extends UintEncoderCtor
    implements IEncodable<number, SuccessResult | typeof OVERFLOW_ERROR_CODE>
  {
    declare __inferT: number;
    declare __inferResults: SuccessResult | typeof OVERFLOW_ERROR_CODE;
    static BITS = size;
    static MAX_VALUE = MAX_SIZE[size];
    static MIN_VALUE = 0;
    encode(
      value: number,
      encoder: OutputByteStream
    ): SuccessResult | typeof OVERFLOW_ERROR_CODE {
      if (value > SmallIntEncoder.MAX_VALUE) {
        return OVERFLOW_ERROR_CODE;
      }
      return super.encode(value, encoder);
    }
  }
  return new SmallIntEncoder();
}

export const u8 = new CborType(createEncoder(8), createDecoder(8));
export const u16 = new CborType(createEncoder(16), createDecoder(16));
export const u32 = new CborType(createEncoder(32), createDecoder(32));

// const MAX_VALUE_DICT = {
//   8: MAX_U8,
//   16: MAX_U16,
//   32: MAX_U32,
// } as const;

// function getType(value: number): string {
//   return "u" + value.toString();
// }

// function getMaxValue(size: 8 | 16 | 32): number {
//   return MAX_VALUE_DICT[size];
// }

// function createSmallIntType(
//   size: 8 | 16 | 32
// ): CborType<
//   number,
//   number,
//   OverflowError | UnderflowError,
//   InvalidCborError | EndOfInputError | TypeMismatchError,
//   [],
//   []
// > {
//   return uint.pipe(
//     flatMap(
//       (value: number): Result<number, OverflowError | UnderflowError> => {
//         if (typeof value !== "number") {
//           return new TypeMismatchError("number", typeof value).err();
//         }
//         if (value > getMaxValue(size)) {
//           return new OverflowError(getMaxValue(size), value).err();
//         }
//         if (value < 0) {
//           return new UnderflowError(0, value).err();
//         }
//         if (!Number.isInteger(value)) {
//           return new TypeMismatchError(getType(size), "f64").err();
//         }
//         return ok(value);
//       },
//       (
//         arg: number | bigint,
//         d: IDecoder,
//         _: unknown,
//         start: number
//       ): Result<number, TypeMismatchError> => {
//         if (typeof arg === "bigint") {
//           if (arg <= BigInt(getMaxValue(size)) && arg >= BigInt(0)) {
//             return ok(Number(arg));
//           }
//           return new TypeMismatchError(
//             getType(size),
//             getTypeString(d.buf[start])
//           ).err();
//         }
//         if (arg <= getMaxValue(size) && arg >= 0) {
//           return ok(arg);
//         }
//         return new TypeMismatchError(
//           getType(size),
//           getTypeString(d.buf[start])
//         ).err();
//       }
//     )
//   ) as CborType<
//     number,
//     number,
//     OverflowError | UnderflowError,
//     InvalidCborError | EndOfInputError | TypeMismatchError,
//     [],
//     []
//   >;
// }

// /**
//  * A CBOR type that encodes unsigned integers between 0..=255
//  */
// export const u8: CborType<
//   number,
//   number,
//   OverflowError | UnderflowError,
//   InvalidCborError | EndOfInputError | TypeMismatchError,
//   [],
//   []
// > = createSmallIntType(8);

// /**
//  * A CBOR type that encodes unsigned integers between 0..=65_535
//  */
// export const u16: CborType<
//   number,
//   number,
//   OverflowError | UnderflowError,
//   InvalidCborError | EndOfInputError | TypeMismatchError,
//   [],
//   []
// > = createSmallIntType(16);

// /**
//  * A CBOR type that encodes unsigned integers between 0..=4_294_967_295n
//  */
// export const u32: CborType<
//   number,
//   number,
//   OverflowError | UnderflowError,
//   InvalidCborError | EndOfInputError | TypeMismatchError,
//   [],
//   []
// > = createSmallIntType(32);
