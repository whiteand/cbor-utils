import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { CborType } from "../base";
import { NULL_BYTE } from "../constants";
import { okNull } from "../okNull";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType, IDecoder, IEncoder } from "../types";

export function nullable(): <T, EC, EE, DC, DE>(
  ty: ICborType<T, EC, EE, DC, DE>,
) => CborType<T | null, EC, EE, DC, DE | DecodingError> {
  return <T, EC, EE, DC, DE>(
    ty: ICborType<T, EC, EE, DC, DE>,
  ): CborType<T | null, EC, EE, DC, DE | DecodingError> =>
    new CborType(
      (value: T | null, e: IEncoder, ctx: EC): Result<null, EE> => {
        if (value == null) {
          e.write(NULL_BYTE);
          return okNull;
        }
        return ty[encodeSymbol](value, e, ctx);
      },
      (d: IDecoder, ctx: DC): Result<T | null, DE | DecodingError> => {
        const marker = d.buf[d.ptr];
        if (marker === NULL_BYTE) {
          d.ptr++;
          return ok(null);
        }
        return ty[decodeSymbol](d, ctx);
      },
    );
}
