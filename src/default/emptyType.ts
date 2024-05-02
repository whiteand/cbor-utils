import { ok } from "resultra";
import { CborType } from "../base";
import { success } from "../success";

export const emptyType = new CborType<null, void, never, void, never>(
  () => success,
  () => ok(null),
);
