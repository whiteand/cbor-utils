import { CborType } from "../base";
import { ICborType } from "../types";

export function cast<From, To extends From>(): <
  EE extends Error,
  DE extends Error,
  EC,
  DC,
>(
  ty: ICborType<From, EE, DE, EC, DC>,
) => CborType<To, EE, DE, EC, DC> {
  return <EE extends Error, DE extends Error, EC, DC>(
    ty: ICborType<From, EE, DE, EC, DC>,
  ) => CborType.from(ty as unknown as CborType<To, EE, DE, EC, DC>);
}
