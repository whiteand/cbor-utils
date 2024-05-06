import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { CborType } from "../base";
import { NULL_BYTE } from "../constants";
import { success } from "../success";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType, IDecoder, IEncoder } from "../types";

export function nullable(): <T, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<T, EE, DE, EC, DC>,
) => CborType<T | null, EE, DE | DecodingError, EC, DC> {
  return <T, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<T, EE, DE, EC, DC>,
  ): CborType<T | null, EE, DE | DecodingError, EC, DC> =>
    new CborType<T | null, EE, DE | DecodingError, EC, DC>(
      (value: T | null, e: IEncoder, ctx: any): Result<void, EE> => {
        if (value == null) {
          e.write(NULL_BYTE);
          return success;
        }
        return ty[encodeSymbol](value, e, ctx);
      },
      (d: IDecoder, ctx: any): Result<T | null, DE | DecodingError> => {
        const marker = d.buf[d.ptr];
        if (marker === NULL_BYTE) {
          d.ptr++;
          return ok(null);
        }
        return ty[decodeSymbol](d, ctx);
      },
    );
}
