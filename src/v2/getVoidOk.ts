import { ok, Result } from "resultra";

const voidOk = Object.freeze(ok(undefined)) as Result<void, never>;
export function getVoidOk(): Result<void, never> {
  return voidOk;
}
