import { err } from "resultra";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";
import { ICborType } from "../types";

export function mapErrors<T, EE, NEE, DE, NDE>(
  ee: (e: EE, v: T) => NEE,
  de: (de: DE, marker: number, position: number) => NDE,
): (ty: ICborType<T, void, EE, void, DE>) => CborType<T, void, NEE, void, NDE>;
export function mapErrors<T, EE, NEE, DE, NDE>(
  ee: (e: EE, v: T) => NEE,
  de: (de: DE, marker: number, position: number) => NDE,
): <EC, DC>(ty: ICborType<T, EC, EE, DC, DE>) => CborType<T, EC, NEE, DC, NDE>;
export function mapErrors<T, EE, NEE, DE, NDE>(
  ee: (e: EE, v: T) => NEE,
  de: (de: DE, marker: number, position: number) => NDE,
): (ty: ICborType<T, any, EE, any, DE>) => CborType<T, any, NEE, any, NDE> {
  return (ty: ICborType<T, any, EE, any, DE>) =>
    new CborType<T, any, NEE, any, NDE>(
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
