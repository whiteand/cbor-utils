import { Result, ok } from "resultra";
import { EOI_ERR, EndOfInputError } from "./EndOfInputError";
import { getInfo } from "./marker";
import { IDecoder } from "./types";
import { InvalidCborError } from "./InvalidCborError";
import { done } from "./utils/done";

export function readArg(
  d: IDecoder,
): Result<number | bigint | null, EndOfInputError | InvalidCborError> {
  const p = d.ptr;
  const marker = d.buf[d.ptr++];
  const info = getInfo(marker);
  if (info < 24) {
    return ok(info);
  }
  switch (info) {
    case 24: {
      if (done(d)) {
        return EOI_ERR;
      }
      const value = d.buf[d.ptr++];
      return ok(value);
    }
    case 25: {
      if (d.ptr + 1 >= d.buf.length) {
        return EOI_ERR;
      }
      let value = d.buf[d.ptr++];
      value = (value << 8) | d.buf[d.ptr++];
      return ok(value);
    }
    case 26: {
      if (d.ptr + 3 >= d.buf.length) {
        return EOI_ERR;
      }
      const value =
        (d.buf[d.ptr++] << 24) |
        (d.buf[d.ptr++] << 16) |
        (d.buf[d.ptr++] << 8) |
        d.buf[d.ptr++];
      return ok(value);
    }
    case 27: {
      if (d.ptr + 7 >= d.buf.length) {
        return EOI_ERR;
      }
      let value = BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      value = (value << 8n) | BigInt(d.buf[d.ptr++]);
      return ok(value);
    }
    // Not standardized u128
    case 28: {
      if (d.ptr + 15 >= d.buf.length) {
        return EOI_ERR;
      }
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
      return ok(value);
    }
    case 31: {
      return ok(null);
    }
    default:
      return new InvalidCborError(marker, p).err();
  }
}
