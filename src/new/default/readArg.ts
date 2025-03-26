import { getInfo } from "../../marker";
import { IDecoder } from "../../types";
import { done } from "../done";
import { EOI_ERROR_CODE, INVALID_CBOR_ERROR_CODE } from "../error-codes";
import { InputByteStream, SuccessResult } from "../types";

export type ReadArgErrors =
  | typeof EOI_ERROR_CODE
  | typeof INVALID_CBOR_ERROR_CODE;

export class ArgReceiver {
  protected numArg: number;
  protected bigIntArg: bigint;
  protected variant: 1 | 2 | 3;
  constructor() {
    this.numArg = 0;
    this.bigIntArg = 0n;
    this.variant = 3;
  }
  setNum(value: number) {
    this.variant = 1;
    this.numArg = value;
  }
  setBigInt(value: bigint) {
    this.variant = 2;
    this.bigIntArg = value;
  }
  setNull() {
    this.variant = 3;
  }
  getNumber() {
    return this.numArg;
  }
  getBigInt() {
    return this.bigIntArg;
  }

  isNull() {
    return this.variant === 3;
  }

  /**
   * @returns Returns true if the decoded value has type "number"
   */
  isNumber() {
    return this.variant === 1;
  }
}

export const argReceiver: ArgReceiver = new ArgReceiver();

export function readArg(
  d: InputByteStream,
  out: ArgReceiver
): ReadArgErrors | SuccessResult {
  const marker = d.buf[d.ptr++];
  const info = getInfo(marker);
  if (info < 24) {
    out.setNum(info);
    return 0;
  }
  switch (info) {
    case 24: {
      return out.setNum(d.buf[d.ptr++]), 0;
    }
    case 25: {
      return d.ptr + 1 < d.buf.length
        ? (out.setNum(decodeU16(d)), 0)
        : EOI_ERROR_CODE;
    }
    case 26: {
      return d.ptr + 3 >= d.buf.length
        ? EOI_ERROR_CODE
        : (out.setNum(decodeU32(d)), 0);
    }
    case 27: {
      return d.ptr + 7 >= d.buf.length
        ? EOI_ERROR_CODE
        : (out.setBigInt(decodeU64(d)), 0);
    }
    case 31: {
      return out.setNull(), 0;
    }
    default:
      return INVALID_CBOR_ERROR_CODE;
  }
}

function decodeU64(d: IDecoder): bigint {
  let value = BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  return value;
}

function decodeU32(d: IDecoder): number {
  return (
    ((((d.buf[d.ptr++] << 8) | d.buf[d.ptr++]) << 8) | d.buf[d.ptr++]) * 256 +
    d.buf[d.ptr++]
  );
}

function decodeU16(d: IDecoder): number {
  let value = d.buf[d.ptr++];
  value = (value << 8) | d.buf[d.ptr++];
  return value;
}
