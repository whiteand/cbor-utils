import { ok } from "resultra";
import { CborType } from "../base";

export const emptyType = new CborType<null, unknown, never, unknown, never>(
  () => okNull,
  () => ok(null),
);
