import { Result, ok } from "resultra";
import { DecodingError } from "../DecodingError";
import { CborType } from "../base";
import { NULL_BYTE } from "../constants";
import { getVoidOk } from "../getVoidOk";
import { ICborType, IDecoder, IEncoder, NotImportant } from "../types";

export function nullable(): <
  ET,
  DT,
  EE extends Error,
  DE extends Error,
  EC,
  DC
>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<ET | null, DT | null, EE, DE | DecodingError, EC, DC> {
  return <ET, DT, EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<ET, DT, EE, DE, EC, DC>
  ): CborType<ET | null, DT | null, EE, DE | DecodingError, EC, DC> =>
    CborType.builder()
      .encode((value: ET | null, e: IEncoder, ctx: NotImportant): Result<void, EE> => {
        if (value == null) {
          e.write(NULL_BYTE);
          return getVoidOk();
        }
        return ty.encode(value, e, ctx);
      })
      .decode(
        (d: IDecoder, ctx: NotImportant): Result<DT | null, DE | DecodingError> => {
          const marker = d.buf[d.ptr];
          if (marker === NULL_BYTE) {
            d.ptr++;
            return ok(null);
          }
          return ty.decode(d, ctx);
        }
      )
      .nullable(true)
      .build();
}
