import { ok, Result } from "resultra";
import { singleton } from "./singleton";

export const getVoidOk: () => Result<void, never> = singleton(() =>
  Object.freeze(ok(undefined))
);
