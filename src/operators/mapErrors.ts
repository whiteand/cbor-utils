import { err } from "resultra";
import { CborType } from "../base";
import { ICborTypeCodec, IDecoder, IEncoder } from "../types";

export function mapErrors<
  ET,
  DT,
  EE extends Error,
  NEE extends Error,
  DE extends Error,
  NDE extends Error
>(
  ee: (e: EE, v: ET) => NEE,
  de: (de: DE, marker: number, position: number) => NDE
): <EC, DC>(
  ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
) => CborType<ET, DT, NEE, NDE, EC, DC> {
  return <EC, DC>(ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>) =>
    CborType.builder()
      .encode((v: ET, e: IEncoder, c: EC) => {
        const r = ty.encode(v, e, c);
        return r.ok() ? r : err(ee(r.error, v));
      })
      .decode((d: IDecoder, c: DC) => {
        const p = d.ptr;
        const m = d.buf[p];
        const r = ty.decode(d, c);
        return r.ok() ? r : err(de(r.error, m, p));
      })
      .build();
}
