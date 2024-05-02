import { Result } from "resultra";
import { OverflowError } from "./OverflowError";
import { MAX_U128, MAX_U16, MAX_U32, MAX_U64, MAX_U8 } from "./limits";
import { success } from "./success";
import { IEncoder } from "./types";

function trySmall(value: number | bigint): number | null {
  if (typeof value === "bigint") {
    if (value > BigInt(MAX_U32)) {
      return null;
    }
    return Number(value);
  }
  if (value > MAX_U32) {
    return null;
  }
  return value;
}

export function writeTypeAndArg(
  e: IEncoder,
  ty: number,
  value: number | bigint | null,
): Result<void, OverflowError> {
  const tyMask = ty << 5;
  if (value == null) {
    e.write(tyMask | 31);
    return success;
  }
  const smallInt = trySmall(value);
  if (smallInt != null) {
    if (smallInt < 24) {
      e.write(tyMask | smallInt);
      return success;
    }
    if (smallInt <= MAX_U8) {
      e.write(tyMask | 24).write(smallInt);
      return success;
    }
    if (smallInt <= MAX_U16) {
      e.write(tyMask | 25)
        .write((smallInt >> 8) & 0xff)
        .write(smallInt & 0xff);
      return success;
    }
    e.write(tyMask | 26)
      .write((smallInt >> 24) & 0xff)
      .write((smallInt >> 16) & 0xff)
      .write((smallInt >> 8) & 0xff)
      .write(smallInt & 0xff);
    return success;
  }
  const bigInt = BigInt(value);
  if (bigInt <= MAX_U64) {
    e.write(tyMask | 27)
      .write(Number((bigInt >> 56n) & 0xffn))
      .write(Number((bigInt >> 48n) & 0xffn))
      .write(Number((bigInt >> 40n) & 0xffn))
      .write(Number((bigInt >> 32n) & 0xffn))
      .write(Number((bigInt >> 24n) & 0xffn))
      .write(Number((bigInt >> 16n) & 0xffn))
      .write(Number((bigInt >> 8n) & 0xffn))
      .write(Number(bigInt & 0xffn));
    return success;
  }
  if (bigInt <= MAX_U128) {
    e.write(tyMask | 28)
      .write(Number((bigInt >> 120n) & 0xffn))
      .write(Number((bigInt >> 112n) & 0xffn))
      .write(Number((bigInt >> 104n) & 0xffn))
      .write(Number((bigInt >> 96n) & 0xffn))
      .write(Number((bigInt >> 88n) & 0xffn))
      .write(Number((bigInt >> 80n) & 0xffn))
      .write(Number((bigInt >> 72n) & 0xffn))
      .write(Number((bigInt >> 64n) & 0xffn))
      .write(Number((bigInt >> 56n) & 0xffn))
      .write(Number((bigInt >> 48n) & 0xffn))
      .write(Number((bigInt >> 40n) & 0xffn))
      .write(Number((bigInt >> 32n) & 0xffn))
      .write(Number((bigInt >> 24n) & 0xffn))
      .write(Number((bigInt >> 16n) & 0xffn))
      .write(Number((bigInt >> 8n) & 0xffn))
      .write(Number(bigInt & 0xffn));
    return success;
  }
  return new OverflowError(MAX_U128, bigInt).err();
}
