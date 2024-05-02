import { ok } from "resultra";
import { CborType } from "../base";
import { success } from "../success";

export const emptyType = new CborType<null, unknown, never, unknown, never>(
  () => success,
  () => ok(null),
);
