import { CborType } from "../base";
import { ICborType } from "../types";

export function cast<To, From extends To = To>(): <EE, DE>(
  ty: ICborType<From, void, EE, void, DE>,
) => CborType<To, void, EE, void, DE>;
export function cast<To, From extends To = To>(): <EC, EE, DC, DE>(
  ty: ICborType<From, EC, EE, DC, DE>,
) => CborType<To, EC, EE, DC, DE>;
export function cast<To, From extends To = To>(): <EE, DE>(
  ty: ICborType<From, any, EE, any, DE>,
) => CborType<To, any, EE, any, DE> {
  return <EE, DE>(ty: ICborType<From, any, EE, any, DE>) =>
    CborType.from(ty as unknown as ICborType<To, any, EE, any, DE>);
}
