import { ok } from "resultra";
import { CborType } from "../base";
import { success } from "../success";

export const emptyType = new CborType<null, never, never, unknown, unknown>(
  () => success,
  () => ok(null),
);
