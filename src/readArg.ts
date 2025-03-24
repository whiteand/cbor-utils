import { Result, ok } from "resultra";
import { getEoiResult, EndOfInputError } from "./EndOfInputError";
import { getInfo } from "./marker";
import { IDecoder } from "./types";
import { InvalidCborError } from "./InvalidCborError";
import { done } from "./utils/done";

export function readArg(
  d: IDecoder
): Result<number | bigint | null, EndOfInputError | InvalidCborError> {
  const p = d.ptr;
  const marker = d.buf[d.ptr++];
  const info = getInfo(marker);
  if (info < 24) {
    return ok(info);
  }
  switch (info) {
    case 24: {
      return done(d) ? getEoiResult() : ok(d.buf[d.ptr++]);
    }
    case 25: {
      return d.ptr + 1 < d.buf.length ? ok(decodeU16(d)) : getEoiResult();
    }
    case 26: {
      return d.ptr + 3 >= d.buf.length ? getEoiResult() : ok(decodeU32(d));
    }
    case 27: {
      return d.ptr + 7 >= d.buf.length ? getEoiResult() : ok(decodeU64(d));
    }
    // Not standardized u128
    case 28: {
      return d.ptr + 15 >= d.buf.length ? getEoiResult() : ok(decodeU128(d));
    }
    case 31: {
      return ok(null);
    }
    default:
      return new InvalidCborError(marker, p).err();
  }
}
function decodeU128(d: IDecoder): bigint {
  let value = BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  value = (value << 8n) | BigInt(d.buf[d.ptr++]);
  return value;
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
  let res = d.buf[d.ptr++];
  res = (res << 8) | d.buf[d.ptr++];
  res = (res << 8) | d.buf[d.ptr++];
  res = res * 256 + d.buf[d.ptr++];
  return res;
}

function decodeU16(d: IDecoder): number {
  let value = d.buf[d.ptr++];
  value = (value << 8) | d.buf[d.ptr++];
  return value;
}
