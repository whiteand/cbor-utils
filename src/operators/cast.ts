import { CborType } from "../base";
import { ICborType } from "../types";

export function cast<From, To extends From>(): <EC, EE, DC, DE>(
  ty: ICborType<From, EC, EE, DC, DE>,
) => CborType<To, EC, EE, DC, DE> {
  return <EC, EE, DC, DE>(ty: ICborType<From, EC, EE, DC, DE>) =>
    CborType.from(ty as unknown as ICborType<To, EC, EE, DC, DE>);
}
