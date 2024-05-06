import { err } from "resultra";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType } from "../types";

export function mapErrors<
  T,
  EE extends Error,
  NEE extends Error,
  DE extends Error,
  NDE extends Error,
>(
  ee: (e: EE, v: T) => NEE,
  de: (de: DE, marker: number, position: number) => NDE,
): <EC, DC>(ty: ICborType<T, EE, DE, EC, DC>) => CborType<T, NEE, NDE, EC, DC> {
  return <EC, DC>(ty: ICborType<T, EE, DE, EC, DC>) =>
    new CborType<T, NEE, NDE, EC, DC>(
      (v, e, c) => {
        const r = ty[encodeSymbol](v, e, c);
        if (r.ok()) {
          return r;
        }
        return err(ee(r.error, v));
      },
      (d, c) => {
        const p = d.ptr;
        const m = d.buf[p];
        const r = ty[decodeSymbol](d, c);
        if (r.ok()) {
          return r;
        }
        return err(de(r.error, m, p));
      },
    );
}
