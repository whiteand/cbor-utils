import { Pipeable } from "../pipe";
import { IEncoder, Z } from "../types";
import { IEncodable } from "./types";

export abstract class Encodable<T, Results>
  extends Pipeable
  implements IEncodable<T, Results, Z>
{
  abstract __inferCtx: Z;
  abstract __inferT: T;
  abstract setContext(ctx: Z): void;
  abstract encode(value: T, encoder: IEncoder): Results;
  abstract isNull(value: T): boolean;
}
export abstract class ContextDependentEncodable<
  T,
  Results,
  Ctx
> extends Encodable<T, Results> {
  abstract __inferCtx: Ctx;
  abstract __inferT: T;
  abstract setContext(ctx: Ctx): void;
  abstract encode(value: T, encoder: IEncoder): Results;
}
