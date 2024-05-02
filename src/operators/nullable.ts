import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { CborType } from "../base";
import { NULL_BYTE } from "../constants";
import { success } from "../success";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType, IDecoder, IEncoder } from "../types";

export function nullable(): <T, EE, DE>(
  ty: ICborType<T, void, EE, void, DE>,
) => CborType<T | null, void, EE, void, DE | DecodingError>;
export function nullable(): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => CborType<T | null, EC, EE, DC, DE | DecodingError>;
export function nullable(): <T, EE, DE>(
  ty: ICborType<T, any, EE, any, DE>,
) => CborType<T | null, any, EE, any, DE | DecodingError> {
  return <T, EE, DE>(
    ty: ICborType<T, any, EE, any, DE>,
  ): CborType<T | null, any, EE, any, DE | DecodingError> =>
    new CborType(
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
